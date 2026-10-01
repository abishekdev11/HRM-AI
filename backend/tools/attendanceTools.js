const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Leave = require("../models/Leave");

const DAILY_WORK_TARGET_MS = 8 * 60 * 60 * 1000;

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatAttendance(record) {
  const user = record.user || {};
  const date = record.date ? new Date(record.date).toISOString().slice(0, 10) : "N/A";
  const login = record.loginTime ? new Date(record.loginTime).toLocaleTimeString() : "N/A";
  const logout = record.logoutTime ? new Date(record.logoutTime).toLocaleTimeString() : "Not logged out";
  return `Employee: ${user.name || "You"}${user.employeeId ? ` (${user.employeeId})` : ""}\nDate: ${date}\nStatus: ${record.status}\nLogin: ${login}\nLogout: ${logout}`;
}

function getActiveSession(attendance) {
  return [...attendance.workSessions].reverse().find((session) => !session.endedAt);
}

function calculateWorkProgress(attendance, now = new Date()) {
  const sessions = attendance.workSessions.length
    ? attendance.workSessions
    : attendance.loginTime
      ? [{ startedAt: attendance.loginTime, endedAt: attendance.logoutTime, breaks: [] }]
      : [];
  let workedMilliseconds = 0;
  for (const session of sessions) {
    const start = new Date(session.startedAt).getTime();
    const end = session.endedAt ? new Date(session.endedAt).getTime() : now.getTime();
    if (!Number.isFinite(start) || end <= start) continue;
    let duration = end - start;
    for (const breakPeriod of session.breaks || []) {
      const breakStart = new Date(breakPeriod.startedAt).getTime();
      const breakEnd = breakPeriod.endedAt ? new Date(breakPeriod.endedAt).getTime() : now.getTime();
      duration -= Math.max(0, Math.min(end, breakEnd) - Math.max(start, breakStart));
    }
    workedMilliseconds += Math.max(0, duration);
  }
  const activeSession = attendance.workSessions.length ? getActiveSession(attendance) : null;
  const activeBreak = activeSession
    ? [...activeSession.breaks].reverse().find((breakPeriod) => !breakPeriod.endedAt)
    : null;
  const cappedWorkMilliseconds = Math.min(workedMilliseconds, DAILY_WORK_TARGET_MS);
  return {
    workedMilliseconds: cappedWorkMilliseconds,
    targetMilliseconds: DAILY_WORK_TARGET_MS,
    progressPercent: Math.round((cappedWorkMilliseconds / DAILY_WORK_TARGET_MS) * 100),
    isActive: Boolean(activeSession || (!attendance.workSessions.length && attendance.loginTime && !attendance.logoutTime)),
    isOnBreak: Boolean(activeBreak),
    breakReason: activeBreak?.reason || null,
    isComplete: workedMilliseconds >= DAILY_WORK_TARGET_MS,
  };
}

async function getTodayAttendance(actor) {
  return Attendance.findOne({ user: actor._id, date: startOfDay() });
}

async function getDashboardSummary() {
  const today = startOfDay();
  const activeUsers = await User.find({ isActive: true }).select("_id").lean();
  const [presentRecords, approvedLeaves, pendingLeaves] = await Promise.all([
    Attendance.find({ date: today, status: "Present" }).select("user").lean(),
    Leave.find({ status: "Approved", from: { $lte: today }, to: { $gte: today } }).select("user").lean(),
    Leave.countDocuments({ status: "Pending" }),
  ]);
  const presentIds = new Set(presentRecords.map((record) => String(record.user)));
  const leaveIds = new Set(approvedLeaves.map((leave) => String(leave.user)));
  return {
    totalEmployees: activeUsers.length,
    presentCount: presentRecords.length,
    approvedLeaveCount: approvedLeaves.length,
    absentCount: activeUsers.filter((user) => !presentIds.has(String(user._id)) && !leaveIds.has(String(user._id))).length,
    pendingLeaves,
  };
}

async function executeAttendanceAction(action, actor) {
  if (!action || !["attendanceQuery", "attendanceAction", "moduleAction"].includes(action.type)) return null;
  if (action.type === "moduleAction" && action.module !== "attendance") return null;
  if (!actor) return "You must be logged in to view attendance.";

  const today = startOfDay();
  if (action.type === "attendanceAction" || action.type === "moduleAction") {
    const attendance = await getTodayAttendance(actor);
    if (action.operation === "progress") {
      return attendance
        ? JSON.stringify(calculateWorkProgress(attendance))
        : "No work session is recorded for you today.";
    }
    if (!attendance) return "Log in before managing a break.";
    let session = getActiveSession(attendance);
    if (!session && attendance.workSessions.length === 0 && attendance.loginTime && !attendance.logoutTime) {
      attendance.workSessions.push({ startedAt: attendance.loginTime, breaks: [] });
      session = getActiveSession(attendance);
    }
    if (action.operation === "startBreak") {
      const reason = String(action.reason || "").trim().slice(0, 60);
      if (!reason) return "Please specify a break type.";
      if (!session) return "There is no active work session.";
      if (session.breaks.some((breakPeriod) => !breakPeriod.endedAt)) return "A break is already in progress.";
      session.breaks.push({ startedAt: new Date(), reason });
    } else if (action.operation === "endBreak") {
      const activeBreak = session && [...session.breaks].reverse().find((breakPeriod) => !breakPeriod.endedAt);
      if (!activeBreak) return "There is no break in progress.";
      activeBreak.endedAt = new Date();
    } else {
      return "Unsupported attendance action.";
    }
    await attendance.save();
    return `Attendance updated. ${JSON.stringify(calculateWorkProgress(attendance))}`;
  }

  if (action.scope === "summary" || action.scope === "dashboard") {
    if (!["admin", "manager"].includes(actor.role)) return "Only admins or managers can view attendance summaries.";
    return JSON.stringify(await getDashboardSummary());
  }

  if (action.scope === "dashboardDetails") {
    if (!["admin", "manager"].includes(actor.role)) return "Only admins or managers can view dashboard attendance details.";
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [employees, presentRecords, approvedLeaves, pendingLeaveRequests] = await Promise.all([
      User.find({ isActive: true }).select("name employeeId designation department").populate("department", "name").sort({ name: 1 }).lean(),
      Attendance.find({ date: { $gte: today, $lt: tomorrow }, status: "Present" })
      .populate("user", "name employeeId designation department")
      .lean(),
      Leave.find({ status: "Approved", from: { $lt: tomorrow }, to: { $gte: today } })
        .populate("user", "name employeeId designation")
        .sort({ from: 1 })
        .lean(),
      Leave.find({ status: "Pending" }).populate("user", "name employeeId designation").sort({ createdAt: -1 }),
    ]);
    const presentIds = new Set(presentRecords.filter((record) => record.user).map((record) => String(record.user._id)));
    const leaveIds = new Set(approvedLeaves.filter((leave) => leave.user).map((leave) => String(leave.user._id)));
    const absentEmployees = employees.filter((employee) =>
      !presentIds.has(String(employee._id)) && !leaveIds.has(String(employee._id))
    );
    return JSON.stringify({
      totalEmployees: employees.length,
      presentCount: presentRecords.length,
      approvedLeaveCount: approvedLeaves.length,
      absentCount: absentEmployees.length,
      pendingLeaves: pendingLeaveRequests.length,
      employees,
      present: presentRecords,
      onLeave: approvedLeaves,
      absent: absentEmployees,
      pendingLeaveRequests,
    });
  }

  if (action.scope === "today") {
    if (!["admin", "manager"].includes(actor.role)) {
      return "Only admins or managers can view team attendance.";
    }
    const records = await Attendance.find({ date: today })
      .populate("user", "name employeeId")
      .sort({ createdAt: -1 });
    return records.length ? records.map(formatAttendance).join("\n\n") : "No attendance records found for today.";
  }

  if (action.scope === "todayMine") {
    const record = await Attendance.findOne({ user: actor._id, date: today });
    return record ? formatAttendance(record) : "No attendance record found for you today.";
  }

  const records = await Attendance.find({ user: actor._id })
    .sort({ date: -1 })
    .limit(30);
  return records.length
    ? records.map(formatAttendance).join("\n\n")
    : "No attendance records found for your account.";
}

async function executeAttendanceDataQuery(action, actor) {
  return executeAttendanceAction({
    type: "attendanceQuery",
    scope: action.scope || "me",
  }, actor);
}

module.exports = { executeAttendanceAction, executeAttendanceDataQuery };