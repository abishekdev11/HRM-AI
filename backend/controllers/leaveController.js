const Leave = require('../models/Leave');

async function applyLeave(req, res) {
  try {
    const userId = req.user._id;
    const { from, to, type, reason } = req.body;
    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'From and To dates are required' });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (fromDate >= toDate) {
      return res.status(400).json({ success: false, message: 'Invalid date range: From date must be before To date' });
    }

    const leave = await Leave.create({ user: userId, from, to, type, reason });
    return res.json({ success: true, data: leave });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function getLeaves(req, res) {
  try {
    const user = req.user;
    if (user.role === 'admin' || user.role === 'manager') {
      const leaves = await Leave.find().populate('user', 'name employeeId');
      return res.json({ success: true, data: leaves });
    }
    const leaves = await Leave.find({ user: user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, data: leaves });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function approveLeave(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Only managers and admins can approve leaves' });
    }
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    leave.status = 'Approved';
    await leave.save();
    return res.json({ success: true, data: leave });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

async function rejectLeave(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Only managers and admins can reject leaves' });
    }
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    leave.status = 'Rejected';
    await leave.save();
    return res.json({ success: true, data: leave });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

module.exports = { applyLeave, getLeaves, approveLeave, rejectLeave };
