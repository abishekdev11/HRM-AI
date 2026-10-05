const {
    routeChatRequest,
    executeChatAction,
    getWorkflowHelpResponse,
} = require("../agents/chatAgent");

const DEFAULT_RESPONSE = "I can help with employees, attendance, departments, projects, leave requests, and employee queries.";

async function createChatResponse(question, actor) {
    const workflowAnswer = getWorkflowHelpResponse(question);
    const action = workflowAnswer ? null : await routeChatRequest({ question, actor });
    const result = action
        ? await executeChatAction(action, actor)
        : workflowAnswer || DEFAULT_RESPONSE;
    const answer = typeof result === "string" ? result : JSON.stringify(result ?? DEFAULT_RESPONSE);

    return { transcript: question, answer };
}

module.exports = { createChatResponse };