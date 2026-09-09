const leaveTools = require("../tools/leaveTools");
const userTools = require("../tools/userTools");
const { executeDataQueryAction } = require("../tools");
const { callGeminiFallback } = require("../services/llm");
const { getPendingDraftFor } = require("./chatMemory");
const { canUpdateLeaveStatus, findClosestUserNameMatch } = leaveTools;

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function hasPendingAction(actor, actionName) {
  const pendingDraft = getPendingDraftFor(actor, actionName);
  return !!(pendingDraft && pendingDraft.fields && Object.keys(pendingDraft.fields).length > 0);
}

function extractLeaveIdentifier(question) {
  const patterns = [
    /\b(?:leave|request)\s*(?:id|number)?\s*(?:is|:|=|to)?\s*([A-Za-z0-9-]+)/i,
    /\b(?:employee|user)\s*(?:id|number)?\s*(?:is|:|=|to)?\s*([A-Za-z0-9-]+)/i,
    /\b(?:for|by|from)\s+([A-Z][A-Za-z' .-]+|[a-z][A-Za-z' .-]+)/i,
    /\b([A-Fa-f0-9]{24})\b/,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match && match[1]) return match[1].trim();
  }

  return null;
}

function extractUserIdentifier(question) {
  const patterns = [
    /\b(?:user|employee)\s*(?:id|number)?\s*(?:is|:|=|to)?\s*([A-Za-z0-9-]+)/i,
    /\b(?:email|e-mail)\s*(?:is|:|=|to)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /\b(?:for|named|name)\s+([A-Z][A-Za-z' .-]+|[a-z][A-Za-z' .-]+)/i,
    /\b([A-Z]{2,}\d{2,})\b/i,
    /\b([A-Fa-f0-9]{24})\b/,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match && match[1]) return match[1].trim();
  }

  return null;
}

function cleanParsedValue(value) {
  return String(value || '').trim().replace(/[.,!?;:]+$/g, '');
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function resolveLeaveDecisionVerb(value) {
  const verb = String(value || '').toLowerCase();

  for (const candidate of ['approve', 'reject']) {
    if (verb === candidate || levenshteinDistance(verb, candidate) <= 1) {
      return candidate;
    }

    const hasAdjacentTransposition = verb.length === candidate.length &&
      verb.length > 1 &&
      Array.from({ length: verb.length - 1 }).some((_, index) => {
        const transposed = candidate.split('');
        [transposed[index], transposed[index + 1]] = [transposed[index + 1], transposed[index]];
        return transposed.join('') === verb;
      });

    if (hasAdjacentTransposition) {
      return candidate;
    }
  }

  return null;
}

function parseEmployeeStatusAction(question) {
  if (!question || typeof question !== 'string') return null;

  const normalized = question.trim().replace(/\s+/g, ' ');

  const patterns = [
    /^(?:update|set|change)\s+([A-Za-z0-9-]+)\s+(?:isActive|is\s+active|active|inactive)\s+status\s+to\s+(true|false|active|inactive)\s*$/i,
    /^(?:update|set|change)\s+([A-Za-z0-9-]+)\s+status\s+to\s+(true|false|active|inactive)\s*$/i,
    /^(?:update|set|change)\s+([A-Za-z0-9-]+)\s+(?:status\s+)?to\s+(true|false|active|inactive)\s*$/i,
    /^(?:update|set|change)\s+([A-Za-z][A-Za-z' .-]+)\s+(?:is\s+)?(?:active|inactive)\s+status\s+to\s+(true|false|active|inactive)\s*$/i,
    /^(?:update|set|change)\s+([A-Za-z][A-Za-z' .-]+)\s+status\s+to\s+(true|false|active|inactive)\s*$/i,
    /^(?:update|set|change)\s+([A-Za-z][A-Za-z' .-]+)\s+to\s+(active|inactive)\s*$/i,
    /^(?:update|set|change)\s+([A-Za-z][A-Za-z' .-]+)\s+(active|inactive)\s*$/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const rawTarget = cleanParsedValue(match[1]);
      const rawValue = cleanParsedValue(match[2] || match[1] || '').toLowerCase();
      const isActive = /^(true|active)$/i.test(rawValue);

      return {
        type: 'statusUpdate',
        employeeId: rawTarget.toUpperCase(),
        isActive,
        source: 'command'
      };
    }
  }

  return null;
}

function parseEmployeeIdUpdateAction(question) {
  if (!question || typeof question !== 'string') return null;

  const trimmed = question.trim();
  const normalized = trimmed.replace(/\s+/g, ' ');

  const match = normalized.match(/^(?:update|set)\s+employee(?:id)?\s+(?:from\s+)?([A-Za-z0-9-]+)\s+(?:to|=)\s+([A-Za-z0-9-]+)\s*$/i);

  if (!match) return null;

  return {
    type: 'employeeIdUpdate',
    currentEmployeeId: cleanParsedValue(match[1]).toUpperCase(),
    newEmployeeId: cleanParsedValue(match[2]).toUpperCase(),
    source: 'command'
  };
}

function parseDataQueryAction(question) {
  if (!question || typeof question !== 'string') return null;

  const normalized = question.trim().replace(/\s+/g, ' ');
  const lower = normalized.toLowerCase();

  const showPrefix = /(show|list|get|display)\s+(me\s+)?(all\s+the\s+|all\s+|every\s+)?/i;
  const listPrefix = /(list|show|get|display)\s+(the\s+)?/i;

  if ((showPrefix.test(lower) || listPrefix.test(lower)) && /\bactive\b/.test(lower) && /\b(users?|employees?)\b/.test(lower)) {
    return { type: 'dataQuery', entity: 'user', isActive: true };
  }

  if ((showPrefix.test(lower) || listPrefix.test(lower)) && /\binactive\b/.test(lower) && /\b(users?|employees?)\b/.test(lower)) {
    return { type: 'dataQuery', entity: 'user', isActive: false };
  }

  if ((showPrefix.test(lower) || listPrefix.test(lower)) && /(users?|employees?)$/.test(lower)) {
    return { type: 'dataQuery', entity: 'user' };
  }

  if ((showPrefix.test(lower) || listPrefix.test(lower)) && /\bhrs?\b/.test(lower)) {
    return { type: 'dataQuery', entity: 'user', role: 'hr' };
  }

  if ((showPrefix.test(lower) || listPrefix.test(lower)) && /\bhr\b/.test(lower) && /\busers?\b/.test(lower)) {
    return { type: 'dataQuery', entity: 'user', role: 'hr' };
  }

  if ((showPrefix.test(lower) || listPrefix.test(lower)) && /\b(pending|approved|rejected)\b.*\bleave(s)?\b|\bleave(s)?\b.*\b(pending|approved|rejected)\b/.test(lower)) {
    const status = lower.includes('pending') ? 'Pending' : lower.includes('approved') ? 'Approved' : 'Rejected';
    return { type: 'dataQuery', entity: 'leave', status };
  }

  if ((showPrefix.test(lower) || listPrefix.test(lower)) && /\b(pending|approved|rejected)\b\s+(leave|leaves|request|requests)/.test(lower)) {
    const status = lower.includes('pending') ? 'Pending' : lower.includes('approved') ? 'Approved' : 'Rejected';
    return { type: 'dataQuery', entity: 'leave', status };
  }

  if ((showPrefix.test(lower) || listPrefix.test(lower)) && /\bleave(s)?\b/.test(lower)) {
    return { type: 'dataQuery', entity: 'leave' };
  }

  if ((showPrefix.test(lower) || listPrefix.test(lower)) && /\bdepartments?\b/.test(lower)) {
    return { type: 'dataQuery', entity: 'department' };
  }

  if ((showPrefix.test(lower) || listPrefix.test(lower)) && /\badmins?\b/.test(lower)) {
    return { type: 'dataQuery', entity: 'user', role: 'admin' };
  }

  if ((showPrefix.test(lower) || listPrefix.test(lower)) && /\bmanagers?\b/.test(lower)) {
    return { type: 'dataQuery', entity: 'user', role: 'manager' };
  }

  return null;
}

function parseLeaveDecisionAction(question) {
  if (!question || typeof question !== 'string') return null;

  const normalized = question.trim().replace(/\s+/g, ' ');

  const match = normalized.match(/^([A-Za-z]+)\s+(?:the\s+)?(?:leave|leave request)\s+(?:for|of)\s+(.+)$/i)
    || normalized.match(/^([A-Za-z]+)\s+(?:the\s+)?(?:leave|leave request)\s+(?:for\s+)?(?:employee\s+id\s+)?([A-Za-z0-9-]+)\s*$/i);

  if (!match) return null;

  const decisionVerb = resolveLeaveDecisionVerb(match[1]);
  if (!decisionVerb) return null;

  const decision = decisionVerb === 'approve' ? 'Approved' : 'Rejected';
  const rawTarget = match[2] ? match[2].trim() : '';
  const target = cleanParsedValue(
    rawTarget
      .replace(/^employee\s+id\s+/i, '')
      .replace(/\s+(?:leave|leave request|request)$/i, '')
      .trim()
  );

  if (!target) return null;

  return {
    type: 'leaveDecision',
    decision,
    target: target.toLowerCase(),
    source: 'command'
  };
}

function parseAction(question) {
  return parseEmployeeStatusAction(question)
    || parseEmployeeIdUpdateAction(question)
    || parseLeaveDecisionAction(question)
    || parseDataQueryAction(question);
}

function getWorkflowHelpResponse(question) {
  const lower = normalizeText(question).toLowerCase();

  if (/\bhow\b.*\b(create|add|register)\b.*\b(user|employee)s?\b/.test(lower)) {
    return "To create a new user:\n1. Open User Management from the sidebar.\n2. Select Add User.\n3. Enter the employee name, employee ID, email, department, designation, role, and password.\n4. Review the details and select Create User.\n5. Confirm that the new employee appears in the user list.\n\nYou can also ask the assistant: 'create user John Smith with empid EMP001 and email john@example.com'.";
  }

  if (/\bhow\b.*\b(update|edit|change|modify)\b.*\b(user|employee|status|role|email|designation)\b/.test(lower)) {
    return "To update an employee:\n1. Find the employee by name, employee ID, or email.\n2. Choose the field you want to change.\n3. Enter the new value and save the update.\n4. Refresh the employee record and confirm the new value.\n\nYou can also ask the assistant: 'make EMP001 inactive' or 'update EMP001 role to manager'.";
  }

  if (/\bhow\b.*\b(approve|reject|deny|decline)\b.*\bleave\b/.test(lower)) {
    return "To process a leave request:\n1. Open Leave Management or Attendance.\n2. Find the employee's pending leave request.\n3. Review the leave dates, type, and reason.\n4. Select Approve or Reject.\n5. Confirm that the request status has changed.\n\nYou can also ask the assistant: 'approve leave for EMP001' or 'reject leave for EMP001'.";
  }

  if (/\bhow\b.*\b(view|see|show|find|list)\b.*\b(user|employee|leave|department)/.test(lower)) {
    return "To view company records:\n1. Open the relevant section from the sidebar.\n2. Use the search or filter controls to narrow the list.\n3. Select a record to view its details.\n4. For the assistant, ask questions such as 'show all active employees', 'list pending leaves', or 'show all departments'.";
  }

  return null;
}

async function routeChatRequest({ question, actor }) {
  if (!question || typeof question !== "string") {
    return null;
  }

  const text = normalizeText(question);
  const lower = text.toLowerCase();
  const pendingCreateDraft = getPendingDraftFor(actor, "user.create");
  const hasPendingCreateFields = !!pendingCreateDraft && Object.keys(pendingCreateDraft.fields || {}).length > 0;
  const pendingUpdateDraft = getPendingDraftFor(actor, "user.update");
  const hasPendingUpdateFields = !!pendingUpdateDraft && Object.keys(pendingUpdateDraft.fields || {}).length > 0;

  const isApproveLeave = /\b(approve|approved|accept|accepting|grant)\b.*\b(leave|leave request|request)\b|\b(leave|leave request|request)\b.*\b(approve|accept|grant)\b/i.test(lower) ||
    (hasPendingAction(actor, "leave.approve") && /(?:leave|employee|user|email|id|approve|accept|grant)/i.test(lower));
  const isRejectLeave = /\b(reject|rejected|deny|decline|declined)\b.*\b(leave|leave request|request)\b|\b(leave|leave request|request)\b.*\b(reject|deny|decline)\b/i.test(lower) ||
    (hasPendingAction(actor, "leave.reject") && /(?:leave|employee|user|email|id|reject|deny|decline)/i.test(lower));
  const isCreateUser = /\b(create|add|new|register)\b.*\b(user|employee)\b|\b(new\s+employee|add\s+employee|create\s+new\s+employee|register\s+new\s+employee)\b/i.test(lower) ||
    (hasPendingCreateFields && /(?:name|empid|employee\s*id|email|e-mail|department|designation|role|password)\b/i.test(text));
  const isUpdateUser =
    /(?:\b(edit|update|modify|change|rename|make|set)\b.*\b(user|employee|status|designation|role|email|department|name|active|inactive|isactive)\b)/i.test(lower) ||
    /(?:\bchange\s+(?:the\s+)?user|\bupdate\s+(?:the\s+)?employee|\bmake\s+.*\s+(?:active|inactive|isactive)|\bset\s+.*\s+(?:active|inactive|isactive)\b)/i.test(lower) ||
    /(?:\b[A-Z]{2,}\d{2,}\b.*\b(?:designation|status|role|email|department|name|isactive)\b)|(?:\b(?:designation|status|role|email|department|name|isactive)\b.*\b[A-Z]{2,}\d{2,}\b)/i.test(text) ||
    (hasPendingUpdateFields && /(?:role|email|designation|department|name|status|active|inactive|isactive|employee|user)/i.test(lower));

  if (isApproveLeave) {
    return leaveTools.approveLeaveRequest({
      actor,
      leaveIdentifier: extractLeaveIdentifier(text),
    });
  }

  if (isRejectLeave) {
    return leaveTools.rejectLeaveRequest({
      actor,
      leaveIdentifier: extractLeaveIdentifier(text),
    });
  }

  if (isCreateUser || hasPendingCreateFields) {
    return userTools.createUserFromPrompt({ actor, question: text });
  }

  if (isUpdateUser) {
    return userTools.updateUserFromPrompt({
      actor,
      question: text,
      userIdentifier: extractUserIdentifier(text),
    });
  }

  const parsed = parseAction(text);
  if (parsed) {
    return parsed;
  }

  const geminiIntent = await callGeminiFallback(text);
  if (geminiIntent) {
    return geminiIntent;
  }

  return null;
}

module.exports = {
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
};
