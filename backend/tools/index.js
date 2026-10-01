const leaveTools = require("./leaveTools");
const userTools = require("./userTools");
const attendanceTools = require("./attendanceTools");
const departmentTools = require("./departmentTools");
const projectTools = require("./projectTools");
const queryTools = require("./queryTools");
const User = require("../models/User");
const Leave = require("../models/Leave");

function summarizeForAudio(text) {
  const trimmed = String(text || "").trim();
  return trimmed.length <= 500 ? trimmed : `${trimmed.slice(0, 500).trim()}...`;
}

async function executeDataQueryAction(action, actor) {
  if (!action || action.type !== "dataQuery") return null;

  try {
    if (action.entity === "user") {
      const filter = {};
      if (actor?.role !== "admin") {
        if (!actor) return "You must be logged in to view employee records.";
        filter._id = actor._id;
      } else {
        if (action.role) filter.role = action.role;
        if (action.isActive !== undefined) filter.isActive = action.isActive;
      }
      if (action.identifier) {
        if (actor?.role !== "admin") return "Only admins can search other employee records.";
        const identifier = String(action.identifier).trim();
        filter.$or = [
          { employeeId: new RegExp(identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { email: new RegExp(identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { name: new RegExp(identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        ];
      }

      const users = await User.find(filter)
        .populate("department", "name")
        .select("-password")
        .sort({ createdAt: -1 });

      if (!users.length) return "No data found.";

      const result = users.map((user) =>
        `Employee ID: ${user.employeeId}\nName: ${user.name}\nRole: ${user.role}\nDesignation: ${user.designation}\nDepartment: ${user.department?.name || "N/A"}\nStatus: ${user.isActive ? "Active" : "Inactive"}`
      ).join("\n\n");
      return result;
    }

    if (action.entity === "leave") {
      if (!actor) return "You must be logged in to view leave requests.";
      const filter = actor.role === "admin" || actor.role === "manager" ? {} : { user: actor._id };
      if (action.status) filter.status = action.status;
      const leaves = await Leave.find(filter)
        .populate("user", "employeeId name")
        .sort({ createdAt: -1 });

      if (!leaves.length) return "No data found.";

      const result = leaves.map((leave) => {
        const user = leave.user || {};
        const from = leave.from ? new Date(leave.from).toISOString().split("T")[0] : "N/A";
        const to = leave.to ? new Date(leave.to).toISOString().split("T")[0] : "N/A";
        return `Employee ID: ${user.employeeId || "N/A"}\nEmployee Name: ${user.name || "N/A"}\nLeave Type: ${leave.type || "N/A"}\nStatus: ${leave.status || "N/A"}\nFrom: ${from}\nTo: ${to}\nReason: ${leave.reason || "N/A"}`;
      }).join("\n\n");
      return result;
    }

    if (action.entity === "department") {
      return departmentTools.executeDepartmentDataQuery(action, actor);
    }

    if (action.entity === "attendance") {
      return attendanceTools.executeAttendanceDataQuery(action, actor);
    }

    if (["project", "client"].includes(action.entity)) {
      return projectTools.executeProjectDataQuery(action);
    }

    if (action.entity === "query") {
      return queryTools.executeQueryDataQuery(actor, action);
    }

    if (action.entity === "dashboard") {
      return executeDashboardAction({ type: "dashboardQuery", scope: action.scope }, actor);
    }

    return "No data found.";
  } catch (error) {
    console.error("Data query action error:", error);
    return "No data found.";
  }
}

async function executeDashboardAction(action, actor) {
  if (!action || action.type !== "dashboardQuery") return null;
  return require("./attendanceTools").executeAttendanceAction({
    type: "attendanceQuery",
    scope: action.scope === "details" ? "dashboardDetails" : "summary",
  }, actor);
}

module.exports = {
  leaveTools,
  userTools,
  attendanceTools,
  departmentTools,
  projectTools,
  queryTools,
  summarizeForAudio,
  executeDataQueryAction,
  executeDashboardAction,
};
