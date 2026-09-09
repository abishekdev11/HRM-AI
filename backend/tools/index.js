const leaveTools = require("./leaveTools");
const userTools = require("./userTools");
const User = require("../models/User");
const Leave = require("../models/Leave");
const Department = require("../models/Department");

function summarizeForAudio(text) {
  const trimmed = String(text || "").trim();
  return trimmed.length <= 500 ? trimmed : `${trimmed.slice(0, 500).trim()}...`;
}

async function executeDataQueryAction(action) {
  if (!action || action.type !== "dataQuery") return null;

  try {
    if (action.entity === "user") {
      const filter = {};
      if (action.role) filter.role = action.role;
      if (action.isActive !== undefined) filter.isActive = action.isActive;

      const users = await User.find(filter)
        .populate("department", "name")
        .select("-password")
        .sort({ createdAt: -1 });

      if (!users.length) return "No data found.";

      const result = users.map((user) =>
        `Employee ID: ${user.employeeId}\nName: ${user.name}\nRole: ${user.role}\nDesignation: ${user.designation}\nDepartment: ${user.department?.name || "N/A"}\nStatus: ${user.isActive ? "Active" : "Inactive"}`
      ).join("\n\n");
      return summarizeForAudio(result);
    }

    if (action.entity === "leave") {
      const filter = action.status ? { status: action.status } : {};
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
      return summarizeForAudio(result);
    }

    if (action.entity === "department") {
      const departments = await Department.find({}).sort({ createdAt: -1 });
      if (!departments.length) return "No data found.";

      const result = departments.map((department) =>
        `Department: ${department.name}\nDescription: ${department.description || "N/A"}\nStatus: ${department.isActive ? "Active" : "Inactive"}`
      ).join("\n\n");
      return summarizeForAudio(result);
    }

    return "No data found.";
  } catch (error) {
    console.error("Data query action error:", error);
    return "No data found.";
  }
}

module.exports = {
  leaveTools,
  userTools,
  executeDataQueryAction,
};
