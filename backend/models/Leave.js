const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  type: { type: String, default: 'Casual' },
  reason: { type: String },
  status: { type: String, enum: ['Pending','Approved','Rejected'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Leave', LeaveSchema);
