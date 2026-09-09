const Leave = require("../models/Leave");
const User = require("../models/User");
const { getPendingDraftFor, savePendingDraft, clearPendingDraft } = require("../agents/chatMemory");

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function findClosestUserNameMatch(target, candidates = []) {
  if (!target || !Array.isArray(candidates) || candidates.length === 0) return null;

  const normalizedTarget = normalizeName(target);
  if (!normalizedTarget) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const normalizedName = normalizeName(candidate?.name);
    if (!normalizedName) continue;

    const distance = levenshteinDistance(normalizedTarget, normalizedName);
    const maxLength = Math.max(normalizedTarget.length, normalizedName.length, 1);
    const similarity = 1 - (distance / maxLength);
    const includesMatch = normalizedTarget.includes(normalizedName) || normalizedName.includes(normalizedTarget);
    const candidateScore = includesMatch ? 0.85 : similarity;

    if (candidateScore > bestScore && candidateScore >= 0.7) {
      bestMatch = candidate;
      bestScore = candidateScore;
    }
  }

  return bestMatch;
}

function canUpdateLeaveStatus(currentStatus, nextStatus) {
  const current = (currentStatus || "").trim();
  const next = (nextStatus || "").trim();

  return !!current && !!next && current !== "Approved" && current !== "Rejected";
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildActionResult({ success, message, operation, entityType, data, handled = true }) {
  return {
    success,
    handled,
    operation,
    entityType,
    message,
    summary: message,
    data,
  };
}

async function findLeaveByIdentifier(identifier) {
  if (!identifier) return null;

  const cleanIdentifier = String(identifier).trim();

  if (/^[0-9a-fA-F]{24}$/.test(cleanIdentifier)) {
    const leave = await Leave.findById(cleanIdentifier).populate("user", "name employeeId email");
    if (leave) return leave;
  }

  const user = await User.findOne({
    $or: [
      { employeeId: new RegExp(cleanIdentifier, "i") },
      { email: new RegExp(cleanIdentifier, "i") },
      { name: new RegExp(cleanIdentifier, "i") },
    ],
  });

  if (user) {
    return Leave.findOne({ user: user._id }).sort({ createdAt: -1 }).populate("user", "name employeeId email");
  }

  return Leave.findOne({
    $or: [
      { reason: new RegExp(cleanIdentifier, "i") },
      { type: new RegExp(cleanIdentifier, "i") },
    ],
  }).populate("user", "name employeeId email");
}

async function approveLeaveRequest({ actor, leaveIdentifier }) {
  if (!actor) {
    return buildActionResult({
      success: false,
      message: "You must be logged in to approve leave requests.",
      operation: "leave.approve",
      entityType: "leave",
    });
  }

  if (actor.role !== "admin" && actor.role !== "manager") {
    return buildActionResult({
      success: false,
      message: "Only admins or managers can approve leave requests.",
      operation: "leave.approve",
      entityType: "leave",
    });
  }

  const pendingDraft = getPendingDraftFor(actor, "leave.approve");
  const mergedLeaveIdentifier = leaveIdentifier || (pendingDraft && pendingDraft.fields && pendingDraft.fields.leaveIdentifier) || null;

  if (mergedLeaveIdentifier) {
    savePendingDraft(actor, {
      action: "leave.approve",
      fields: { leaveIdentifier: mergedLeaveIdentifier },
    });
  }

  const leave = await findLeaveByIdentifier(mergedLeaveIdentifier);

  if (!mergedLeaveIdentifier) {
    savePendingDraft(actor, { action: "leave.approve", fields: {} });
    return buildActionResult({
      success: false,
      message: "I need the leave request identifier. Please tell me the employee name, employee ID, or email. Example: 'approve leave for John Doe'",
      operation: "leave.approve",
      entityType: "leave",
    });
  }

  if (!leave) {
    return buildActionResult({
      success: false,
      message: "Could not find that leave request. Please provide one of the following:\n• Employee name: 'approve leave for John'\n• Employee ID: 'approve leave for EMP001'\n• Email: 'approve leave for john@gmail.com'\n\nExample: 'approve leave for John Doe'",
      operation: "leave.approve",
      entityType: "leave",
    });
  }

  if (leave.status === "Approved") {
    return buildActionResult({
      success: true,
      message: `Leave for ${leave.user?.name || "this employee"} is already approved.`,
      operation: "leave.approve",
      entityType: "leave",
      data: leave,
    });
  }

  if (leave.status === "Rejected") {
    return buildActionResult({
      success: false,
      message: `Leave for ${leave.user?.name || "this employee"} is already rejected and cannot be approved.`,
      operation: "leave.approve",
      entityType: "leave",
      data: leave,
    });
  }

  clearPendingDraft(actor);
  leave.status = "Approved";
  await leave.save();

  return buildActionResult({
    success: true,
    message: `Leave request approved for ${leave.user?.name || "the employee"}.`,
    operation: "leave.approve",
    entityType: "leave",
    data: leave,
  });
}

async function rejectLeaveRequest({ actor, leaveIdentifier }) {
  if (!actor) {
    return buildActionResult({
      success: false,
      message: "You must be logged in to reject leave requests.",
      operation: "leave.reject",
      entityType: "leave",
    });
  }

  if (actor.role !== "admin" && actor.role !== "manager") {
    return buildActionResult({
      success: false,
      message: "Only admins or managers can reject leave requests.",
      operation: "leave.reject",
      entityType: "leave",
    });
  }

  const pendingDraft = getPendingDraftFor(actor, "leave.reject");
  const mergedLeaveIdentifier = leaveIdentifier || (pendingDraft && pendingDraft.fields && pendingDraft.fields.leaveIdentifier) || null;

  if (mergedLeaveIdentifier) {
    savePendingDraft(actor, {
      action: "leave.reject",
      fields: { leaveIdentifier: mergedLeaveIdentifier },
    });
  }

  const leave = await findLeaveByIdentifier(mergedLeaveIdentifier);

  if (!mergedLeaveIdentifier) {
    savePendingDraft(actor, { action: "leave.reject", fields: {} });
    return buildActionResult({
      success: false,
      message: "I need the leave request identifier. Please tell me the employee name, employee ID, or email. Example: 'reject leave for John Doe'",
      operation: "leave.reject",
      entityType: "leave",
    });
  }

  if (!leave) {
    return buildActionResult({
      success: false,
      message: "Could not find that leave request. Please provide one of the following:\n• Employee name: 'reject leave for John'\n• Employee ID: 'reject leave for EMP001'\n• Email: 'reject leave for john@gmail.com'\n\nExample: 'reject leave for John Doe'",
      operation: "leave.reject",
      entityType: "leave",
    });
  }

  if (leave.status === "Rejected") {
    return buildActionResult({
      success: true,
      message: `Leave for ${leave.user?.name || "this employee"} is already rejected.`,
      operation: "leave.reject",
      entityType: "leave",
      data: leave,
    });
  }

  if (leave.status === "Approved") {
    return buildActionResult({
      success: false,
      message: `Leave for ${leave.user?.name || "this employee"} is already approved and cannot be rejected.`,
      operation: "leave.reject",
      entityType: "leave",
      data: leave,
    });
  }

  clearPendingDraft(actor);
  leave.status = "Rejected";
  await leave.save();

  return buildActionResult({
    success: true,
    message: `Leave request rejected for ${leave.user?.name || "the employee"}.`,
    operation: "leave.reject",
    entityType: "leave",
    data: leave,
  });
}

async function executeLeaveAction(action) {
  if (!action || action.type !== "leaveDecision") return null;

  const target = String(action.target || "").trim().replace(/[.,!?;:]+$/g, "");
  let user = await User.findOne({ employeeId: target.toUpperCase() });

  if (!user) {
    user = await User.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(target)}$`, "i") },
    });
  }

  if (!user) {
    const nameCandidates = await User.find({}, { name: 1 }).lean();
    const closestMatch = findClosestUserNameMatch(target, nameCandidates);
    if (closestMatch) user = await User.findById(closestMatch._id);
  }

  if (!user) return "No employee found.";

  const leave = await Leave.findOne({ user: user._id }).sort({ createdAt: -1 });
  if (!leave) return `No leave found for ${user.name}.`;

  if (!canUpdateLeaveStatus(leave.status, action.decision)) {
    return `Leave for ${user.name} is already ${leave.status.toLowerCase()}. It cannot be changed again.`;
  }

  leave.status = action.decision;
  await leave.save();
  return `Leave for ${user.name} has been ${action.decision.toLowerCase()}.`;
}

module.exports = {
  findLeaveByIdentifier,
  approveLeaveRequest,
  rejectLeaveRequest,
  executeLeaveAction,
  canUpdateLeaveStatus,
  findClosestUserNameMatch,
};
