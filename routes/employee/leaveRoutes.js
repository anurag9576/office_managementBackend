const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves, updateLeaveStatus, getAllLeaves } = require('../../controllers/employee/leaveController');
const { protect, authorize, checkPermission } = require('../../middleware/authMiddleware');

router.get('/', protect, checkPermission('leaves-admin'), getAllLeaves);
router.post('/', protect, applyLeave);
router.get('/my-leaves', protect, getMyLeaves);
router.put('/:id', protect, checkPermission('leaves-admin'), updateLeaveStatus);

module.exports = router;
