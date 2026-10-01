const {
  parseEmployeeStatusAction,
  parseEmployeeIdUpdateAction,
  parseDataQueryAction,
  parseLeaveDecisionAction,
  canUpdateLeaveStatus,
  parseAction,
  executeDataQueryAction,
  getWorkflowHelpResponse,
  routeChatRequest,
  findClosestUserNameMatch,
} = require("./intentRouter");
const leaveTools = require("../tools/leaveTools");
const userTools = require("../tools/userTools");
const { attendanceTools, departmentTools, projectTools, queryTools } = require("../tools");

async function executeChatAction(action, actor) {
  if (!action) {
    return null;
  }

  if (action.operation && action.message) {
    return action.message;
  }

  if (action.type === "dataQuery") {
    return executeDataQueryAction(action, actor);
  }

  if (action.type === "employeeIdUpdate" || action.type === "statusUpdate") {
    return userTools.executeUserAction(action, actor);
  }

  if (action.type === "leaveDecision") {
    return leaveTools.executeLeaveAction(action, actor);
  }

  if (action.type === "dashboardQuery") {
    return require("../tools").executeDashboardAction(action, actor);
  }

  if (action.type === "userDelete") {
    return userTools.deleteUserFromPrompt({ actor, identifier: action.identifier });
  }

  if (action.type === "attendanceQuery" || action.type === "attendanceAction") {
    return attendanceTools.executeAttendanceAction(action, actor);
  }

  if (action.type === "moduleAction") {
    const executeModuleAction = {
      attendance: attendanceTools.executeAttendanceAction,
      department: departmentTools.executeDepartmentAction,
      leave: leaveTools.executeLeaveModuleAction,
      project: projectTools.executeProjectAction,
      query: queryTools.executeQueryAction,
      user: async (moduleAction, moduleActor) => {
        if (moduleAction.operation === "delete") {
          return userTools.deleteUserFromPrompt({ actor: moduleActor, identifier: moduleAction.identifier });
        }
        return "Unsupported user action.";
      },
    }[action.module];
    if (!executeModuleAction) return "Unsupported AI tool action.";
    const result = await executeModuleAction(action, actor);
    return result && typeof result === "object" && result.message
      ? result.message
      : result;
  }

  return null;
}

async function handleChatRequest({ question, actor }) {
  return routeChatRequest({ question, actor });
}

module.exports = {
  handleChatRequest,
  parseEmployeeStatusAction,
  parseEmployeeIdUpdateAction,
  parseDataQueryAction,
  parseLeaveDecisionAction,
  canUpdateLeaveStatus,
  parseAction,
  executeDataQueryAction,
  executeChatAction,
  getWorkflowHelpResponse,
  routeChatRequest,
  findClosestUserNameMatch,
};
