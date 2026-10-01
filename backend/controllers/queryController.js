const mongoose = require('mongoose');
const User = require('../models/User');
const Query = require('../models/Query');
const QueryMessage = require('../models/QueryMessage');
const { canStartQuery } = require('../utils/queryAccess');

const PARTICIPANT_FIELDS = 'name employeeId role designation';

async function getRecipients(req, res) {
  try {
    const users = await User.find({ isActive: true, _id: { $ne: req.user._id } })
      .select('name employeeId role designation')
      .sort({ name: 1 })
      .lean();
    const data = users.filter((user) => canStartQuery(req.user.role, user.role));
    return res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function listQueries(req, res) {
  try {
    const queries = await Query.find({ participants: req.user._id })
      .populate('participants', PARTICIPANT_FIELDS)
      .sort({ lastMessageAt: -1 })
      .lean();
    const visibleQueries = queries.filter((query) => {
      const otherParticipant = query.participants.find(
        (participant) => participant && String(participant._id) !== String(req.user._id)
      );
      return otherParticipant && canStartQuery(req.user.role, otherParticipant.role);
    });
    return res.json({ success: true, data: visibleQueries });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function createQuery(req, res) {
  try {
    const { recipientId } = req.body;
    const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
    const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ success: false, message: 'Choose a valid recipient' });
    }
    if (String(recipientId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot send a query to yourself' });
    }
    if (!subject || subject.length > 120 || !body || body.length > 4000) {
      return res.status(400).json({ success: false, message: 'Subject and message are required and must be within their length limits' });
    }

    const recipient = await User.findOne({ _id: recipientId, isActive: true }).select('name employeeId role designation');
    if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found' });
    if (!canStartQuery(req.user.role, recipient.role)) {
      return res.status(403).json({ success: false, message: 'You cannot start a query with this user' });
    }

    const now = new Date();
    const query = await Query.create({
      subject,
      participants: [req.user._id, recipient._id],
      createdBy: req.user._id,
      lastMessage: body.slice(0, 160),
      lastMessageAt: now,
    });

    let message;
    try {
      message = await QueryMessage.create({ query: query._id, sender: req.user._id, body });
    } catch (error) {
      await Query.deleteOne({ _id: query._id });
      throw error;
    }

    const populatedQuery = await Query.findById(query._id).populate('participants', PARTICIPANT_FIELDS).lean();
    const populatedMessage = await QueryMessage.findById(message._id).populate('sender', PARTICIPANT_FIELDS).lean();
    return res.status(201).json({ success: true, data: populatedQuery, message: populatedMessage });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function getQueryMessages(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.queryId)) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }
    const query = await Query.findOne({ _id: req.params.queryId, participants: req.user._id })
      .populate('participants', 'role');
    if (!query) return res.status(404).json({ success: false, message: 'Query not found' });
    const otherParticipant = query.participants.find(
      (participant) => participant && String(participant._id) !== String(req.user._id)
    );
    if (!otherParticipant || !canStartQuery(req.user.role, otherParticipant.role)) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }

    const messages = await QueryMessage.find({ query: query._id })
      .populate('sender', PARTICIPANT_FIELDS)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function sendQueryMessage(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.queryId)) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }
    const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
    if (!body || body.length > 4000) {
      return res.status(400).json({ success: false, message: 'Message is required and must be 4000 characters or fewer' });
    }

    const query = await Query.findOne({ _id: req.params.queryId, participants: req.user._id });
    if (!query) return res.status(404).json({ success: false, message: 'Query not found' });
    const recipientId = query.participants.find((participantId) => !participantId.equals(req.user._id));
    const recipient = recipientId && await User.findOne({ _id: recipientId, isActive: true }).select('role');
    if (!recipient || !canStartQuery(req.user.role, recipient.role)) {
      return res.status(403).json({ success: false, message: 'You cannot message this participant' });
    }

    const now = new Date();
    const message = await QueryMessage.create({ query: query._id, sender: req.user._id, body });
    query.lastMessage = body.slice(0, 160);
    query.lastMessageAt = now;
    await query.save();

    const populatedMessage = await QueryMessage.findById(message._id).populate('sender', PARTICIPANT_FIELDS).lean();
    return res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

module.exports = { getRecipients, listQueries, createQuery, getQueryMessages, sendQueryMessage };