const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves, updateLeaveStatus, getAllLeaves } = require('../../controllers/employee/leaveController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.get('/', protect, authorize('Admin'), getAllLeaves);
router.post('/', protect, applyLeave);
router.get('/my-leaves', protect, getMyLeaves);
router.put('/:id', protect, authorize('Admin'), updateLeaveStatus);

module.exports = router;
