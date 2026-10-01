const mongoose = require('mongoose');

const BreakSchema = new mongoose.Schema({
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, default: null },
  reason: { type: String, default: 'Other' },
}, { _id: false });

const WorkSessionSchema = new mongoose.Schema({
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, default: null },
  breaks: { type: [BreakSchema], default: [] },
}, { _id: false });

const AttendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present','Absent'], default: 'Present' },
  loginTime: { type: Date, default: null },
  logoutTime: { type: Date, default: null },
  workSessions: { type: [WorkSessionSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
