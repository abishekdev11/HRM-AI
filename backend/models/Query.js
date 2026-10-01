const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
  subject: { type: String, required: true, trim: true, maxlength: 120 },
  participants: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    validate: (participants) => participants.length === 2,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastMessage: { type: String, required: true, maxlength: 160 },
  lastMessageAt: { type: Date, required: true },
}, { timestamps: true });

QuerySchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Query', QuerySchema);