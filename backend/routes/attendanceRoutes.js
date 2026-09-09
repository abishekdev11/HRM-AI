const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const { checkIn, myAttendance, todayAttendance } = require('../controllers/attendanceController');
const { summary } = require('../controllers/attendanceController');

router.post('/checkin', protect, checkIn);
router.get('/me', protect, myAttendance);
router.get('/today', protect, authorize('admin','manager'), todayAttendance);
router.get('/summary', protect, authorize('admin','manager'), summary);

module.exports = router;
