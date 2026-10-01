const mongoose = require("mongoose");
const User = require("../models/User");
const Query = require("../models/Query");
const QueryMessage = require("../models/QueryMessage");
const { canStartQuery } = require("../utils/queryAccess");

const PARTICIPANT_FIELDS = "name employeeId role designation";

async function getVisibleQuery(queryIdentifier, actor) {
  if (!actor || !mongoose.Types.ObjectId.isValid(String(queryIdentifier || ""))) return null;
  const query = await Query.findOne({ _id: queryIdentifier, participants: actor._id })
    .populate("participants", PARTICIPANT_FIELDS);
  if (!query) return null;
  const other = query.participants.find((participant) => String(participant._id) !== String(actor._id));
  return other && canStartQuery(actor.role, other.role) ? query : null;
}

async function executeQueryDataQuery(actor, action = {}) {
  if (!actor) return "You must be logged in to view employee queries.";
  if (action.scope === "recipients") {
    const users = await User.find({ isActive: true, _id: { $ne: actor._id } })
      .select("name employeeId role designation")
      .sort({ name: 1 });
    const allowed = users.filter((user) => canStartQuery(actor.role, user.role));
    return allowed.length
      ? allowed.map((user) => `${user.name} (${user.employeeId}) - ${user.role}`).join("\n")
      : "No query recipients are available to your account.";
  }
  let queries = await Query.find({ participants: actor._id })
    .populate("participants", PARTICIPANT_FIELDS)
    .sort({ lastMessageAt: -1 })
    .limit(50);
  queries = queries.filter((query) => {
    const other = query.participants.find((participant) => String(participant._id) !== String(actor._id));
    return other && canStartQuery(actor.role, other.role);
  });

  if (action.queryIdentifier) {
    queries = queries.filter((query) => String(query._id) === String(action.queryIdentifier));
    if (!queries.length) return "Query not found.";
    const messages = await QueryMessage.find({ query: queries[0]._id })
      .populate("sender", "name employeeId")
      .sort({ createdAt: 1 })
      .limit(100);
    return messages.length
      ? messages.map((message) => `${message.sender?.name || "Participant"}: ${message.body}`).join("\n")
      : "This query has no messages.";
  }

  return queries.length
    ? queries.map((query) => {
      const other = query.participants.find((participant) => String(participant._id) !== String(actor._id));
      return `${query.subject} with ${other?.name || "participant"}: ${query.lastMessage}`;
    }).join("\n")
    : "No employee queries found for your account.";
}

async function executeQueryAction(action, actor) {
  if (!action || action.type !== "moduleAction" || action.module !== "query") return null;
  if (!actor) return "You must be logged in to use employee queries.";
  if (action.operation === "list") return executeQueryDataQuery(actor);
  if (action.operation === "recipients") {
    const users = await User.find({ isActive: true, _id: { $ne: actor._id } })
      .select("name employeeId role designation")
      .sort({ name: 1 });
    const allowed = users.filter((user) => canStartQuery(actor.role, user.role));
    return allowed.length
      ? allowed.map((user) => `${user.name} (${user.employeeId}) - ${user.role}`).join("\n")
      : "No query recipients are available to your account.";
  }

  if (action.operation === "create") {
    const recipientIdentifier = String(action.recipient || "").trim();
    const subject = String(action.subject || "").trim();
    const body = String(action.body || "").trim();
    if (!recipientIdentifier || !subject || !body) return "A recipient, subject, and message are required to start a query.";
    if (subject.length > 120 || body.length > 4000) return "The subject must be 120 characters or fewer and the message 4000 characters or fewer.";

    const recipient = await User.findOne({
      isActive: true,
      $or: [
        { employeeId: recipientIdentifier.toUpperCase() },
        { email: recipientIdentifier.toLowerCase() },
        { name: new RegExp(`^${recipientIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        ...(mongoose.Types.ObjectId.isValid(recipientIdentifier) ? [{ _id: recipientIdentifier }] : []),
      ],
    });
    if (!recipient) return "No active recipient matched that name, email, or employee ID.";
    if (String(recipient._id) === String(actor._id) || !canStartQuery(actor.role, recipient.role)) {
      return "You cannot start a query with that recipient.";
    }

    const now = new Date();
    const query = await Query.create({
      subject,
      participants: [actor._id, recipient._id],
      createdBy: actor._id,
      lastMessage: body.slice(0, 160),
      lastMessageAt: now,
    });
    await QueryMessage.create({ query: query._id, sender: actor._id, body });
    return `Query "${subject}" was sent to ${recipient.name}.`;
  }

  if (action.operation === "reply") {
    const body = String(action.body || "").trim();
    if (!body || body.length > 4000) return "A message of 4000 characters or fewer is required.";
    const query = await getVisibleQuery(action.queryIdentifier, actor);
    if (!query) return "Query not found or not accessible.";
    const other = query.participants.find((participant) => String(participant._id) !== String(actor._id));
    const recipient = await User.findOne({ _id: other?._id, isActive: true }).select("role");
    if (!recipient || !canStartQuery(actor.role, recipient.role)) return "You cannot message this participant.";
    await QueryMessage.create({ query: query._id, sender: actor._id, body });
    query.lastMessage = body.slice(0, 160);
    query.lastMessageAt = new Date();
    await query.save();
    return `Your reply was sent in "${query.subject}".`;
  }

  return "Unsupported employee query action.";
}

module.exports = { executeQueryAction, executeQueryDataQuery };