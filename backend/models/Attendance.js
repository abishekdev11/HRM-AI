const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present','Absent'], default: 'Present' },
  loginTime: { type: Date, default: null },
  logoutTime: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
