const express = require('express');
const router = express.Router();
const { 
    getMyTimesheets, 
    createTimesheet, 
    updateTimesheet, 
    deleteTimesheet, 
    getAllTimesheets 
} = require('../../controllers/admin/timesheetController');
const { protect, authorize, checkPermission } = require('../../middleware/authMiddleware');

router.post('/', protect, createTimesheet);
router.get('/my', protect, getMyTimesheets);
router.get('/all', protect, checkPermission('timesheet-admin'), getAllTimesheets);
router.put('/:id', protect, updateTimesheet);
router.delete('/:id', protect, deleteTimesheet);

module.exports = router;
