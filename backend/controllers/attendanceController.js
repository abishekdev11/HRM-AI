const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Leave = require('../models/Leave');

// Note: Attendance is now automatically recorded on login with loginTime
// This function is kept for reference but not used
async function checkIn(req, res) {
  try {
    return res.status(400).json({ success: false, message: 'Use login endpoint to check in' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function myAttendance(req, res) {
  try {
    const userId = req.user._id;
    const records = await Attendance.find({ user: userId }).sort({ date: -1 }).limit(30);
    return res.json({ success: true, data: records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function todayAttendance(req, res) {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const records = await Attendance.find({ date: today }).populate('user', 'name employeeId department');
    return res.json({ success: true, data: records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function summary(req, res) {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalEmployees = await User.countDocuments({ isActive: true });
    const presentCount = await Attendance.countDocuments({ date: today, status: 'Present' });

    const approvedLeavesToday = await Leave.countDocuments({
      status: 'Approved',
      from: { $lte: today },
      to: { $gte: today }
    });

    const allUserIds = await User.find({ isActive: true }).select('_id').lean();
    const activeUserIds = allUserIds.map(user => user._id);

    const presentUserIds = await Attendance.find({
      date: today,
      status: 'Present'
    }).select('user').lean();

    const presentSet = new Set(presentUserIds.map(record => String(record.user)));
    const approvedLeaveUserIds = await Leave.find({
      status: 'Approved',
      from: { $lte: today },
      to: { $gte: today }
    }).select('user').lean();

    const approvedLeaveSet = new Set(approvedLeaveUserIds.map(record => String(record.user)));

    const absentCount = activeUserIds.filter(userId => {
      const id = String(userId._id || userId);
      return !presentSet.has(id) && !approvedLeaveSet.has(id);
    }).length;

    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

    return res.json({
      success: true,
      data: {
        totalEmployees,
        presentCount,
        approvedLeaveCount: approvedLeavesToday,
        absentCount,
        pendingLeaves,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

module.exports = { checkIn, myAttendance, todayAttendance, summary };
