const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Leave = require('../models/Leave');
const DAILY_WORK_TARGET_MS = 8 * 60 * 60 * 1000;

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
    const startedAt = new Date(session.startedAt).getTime();
    const endedAt = session.endedAt ? new Date(session.endedAt).getTime() : now.getTime();
    if (!Number.isFinite(startedAt) || endedAt <= startedAt) continue;

    let sessionWork = endedAt - startedAt;
    for (const breakPeriod of session.breaks || []) {
      const breakStartedAt = new Date(breakPeriod.startedAt).getTime();
      const breakEndedAt = breakPeriod.endedAt ? new Date(breakPeriod.endedAt).getTime() : now.getTime();
      sessionWork -= Math.max(0, Math.min(endedAt, breakEndedAt) - Math.max(startedAt, breakStartedAt));
    }
    workedMilliseconds += Math.max(0, sessionWork);
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
    serverTime: now.toISOString(),
  };
}

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

async function getWorkProgress(req, res) {
  try {
    const attendance = await Attendance.findOne({ user: req.user._id, date: getTodayStart() });
    const now = new Date();
    return res.json({
      success: true,
      data: attendance
        ? calculateWorkProgress(attendance, now)
        : {
            workedMilliseconds: 0,
            targetMilliseconds: DAILY_WORK_TARGET_MS,
            progressPercent: 0,
            isActive: false,
            isOnBreak: false,
            breakReason: null,
            isComplete: false,
            serverTime: now.toISOString(),
          },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function startBreak(req, res) {
  try {
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 60) : '';
    if (!reason) return res.status(400).json({ success: false, message: 'A break type is required' });

    const attendance = await Attendance.findOne({ user: req.user._id, date: getTodayStart() });
    if (!attendance) return res.status(404).json({ success: false, message: 'Log in before starting a break' });

    let session = getActiveSession(attendance);
    if (!session && attendance.workSessions.length === 0 && attendance.loginTime && !attendance.logoutTime) {
      attendance.workSessions.push({ startedAt: attendance.loginTime, breaks: [] });
      session = getActiveSession(attendance);
    }
    if (!session) return res.status(409).json({ success: false, message: 'There is no active work session' });
    if (session.breaks.some((breakPeriod) => !breakPeriod.endedAt)) {
      return res.status(409).json({ success: false, message: 'A break is already in progress' });
    }

    session.breaks.push({ startedAt: new Date(), reason });
    await attendance.save();
    return res.json({ success: true, data: calculateWorkProgress(attendance) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function endBreak(req, res) {
  try {
    const attendance = await Attendance.findOne({ user: req.user._id, date: getTodayStart() });
    if (!attendance) return res.status(404).json({ success: false, message: 'No work session found today' });

    const session = getActiveSession(attendance);
    const activeBreak = session && [...session.breaks].reverse().find((breakPeriod) => !breakPeriod.endedAt);
    if (!activeBreak) return res.status(409).json({ success: false, message: 'There is no break in progress' });

    activeBreak.endedAt = new Date();
    await attendance.save();
    return res.json({ success: true, data: calculateWorkProgress(attendance) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

// Note: Attendance is now automatically recorded on login with loginTime
// This function is kept for reference but not used
async function checkIn(req, res) {
  try {
    return res.status(400).json({ success: false, message: 'Use login endpoint to check in' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function myAttendance(req, res) {
  try {
    const userId = req.user._id;
    const records = await Attendance.find({ user: userId }).sort({ date: -1 }).limit(30);
    return res.json({ success: true, data: records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function todayAttendance(req, res) {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const records = await Attendance.find({ date: today }).populate('user', 'name employeeId department');
    return res.json({ success: true, data: records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function summary(req, res) {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalEmployees = await User.countDocuments({ isActive: true });
    const presentCount = await Attendance.countDocuments({ date: today, status: 'Present' });

    const approvedLeavesToday = await Leave.countDocuments({
      status: 'Approved',
      from: { $lte: today },
      to: { $gte: today }
    });

    const allUserIds = await User.find({ isActive: true }).select('_id').lean();
    const activeUserIds = allUserIds.map(user => user._id);

    const presentUserIds = await Attendance.find({
      date: today,
      status: 'Present'
    }).select('user').lean();

    const presentSet = new Set(presentUserIds.map(record => String(record.user)));
    const approvedLeaveUserIds = await Leave.find({
      status: 'Approved',
      from: { $lte: today },
      to: { $gte: today }
    }).select('user').lean();

    const approvedLeaveSet = new Set(approvedLeaveUserIds.map(record => String(record.user)));

    const absentCount = activeUserIds.filter(userId => {
      const id = String(userId._id || userId);
      return !presentSet.has(id) && !approvedLeaveSet.has(id);
    }).length;

    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

    return res.json({
      success: true,
      data: {
        totalEmployees,
        presentCount,
        approvedLeaveCount: approvedLeavesToday,
        absentCount,
        pendingLeaves,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function dashboardDetails(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [employees, presentRecords, approvedLeaves, pendingLeaveRequests] = await Promise.all([
      User.find({ isActive: true })
        .select('name employeeId designation department')
        .populate('department', 'name')
        .sort({ name: 1 })
        .lean(),
      Attendance.find({ date: { $gte: today, $lt: tomorrow }, status: 'Present' })
        .populate('user', 'name employeeId designation department')
        .lean(),
      Leave.find({
        status: 'Approved',
        from: { $lt: tomorrow },
        to: { $gte: today },
      })
        .populate('user', 'name employeeId designation')
        .sort({ from: 1 })
        .lean(),
      Leave.find({ status: 'Pending' })
        .populate('user', 'name employeeId designation')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const presentEmployeeIds = new Set(
      presentRecords.filter((record) => record.user).map((record) => String(record.user._id))
    );
    const leaveEmployeeIds = new Set(
      approvedLeaves.filter((leave) => leave.user).map((leave) => String(leave.user._id))
    );
    const absentEmployees = employees.filter((employee) =>
      !presentEmployeeIds.has(String(employee._id)) && !leaveEmployeeIds.has(String(employee._id))
    );

    return res.json({
      success: true,
      data: {
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
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

module.exports = {
  checkIn,
  myAttendance,
  todayAttendance,
  summary,
  dashboardDetails,
  getWorkProgress,
  startBreak,
  endBreak,
};
