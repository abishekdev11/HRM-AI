const mongoose = require('mongoose');

const QueryMessageSchema = new mongoose.Schema({
  query: { type: mongoose.Schema.Types.ObjectId, ref: 'Query', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 4000 },
}, { timestamps: true });

QueryMessageSchema.index({ query: 1, createdAt: -1 });

module.exports = mongoose.model('QueryMessage', QueryMessageSchema);