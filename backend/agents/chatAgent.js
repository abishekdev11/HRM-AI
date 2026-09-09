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

async function executeChatAction(action) {
  if (!action) {
    return null;
  }

  if (action.operation && action.message) {
    return action.message;
  }

  if (action.type === "dataQuery") {
    return executeDataQueryAction(action);
  }

  if (action.type === "employeeIdUpdate" || action.type === "statusUpdate") {
    return userTools.executeUserAction(action);
  }

  if (action.type === "leaveDecision") {
    return leaveTools.executeLeaveAction(action);
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
