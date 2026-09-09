const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const { applyLeave, getLeaves, approveLeave } = require('../controllers/leaveController');

router.post('/', protect, applyLeave);
router.get('/', protect, getLeaves);
router.patch('/:id/approve', protect, authorize('admin','manager'), approveLeave);
router.patch('/:id/reject', protect, authorize('admin','manager'), require('../controllers/leaveController').rejectLeave);

module.exports = router;
