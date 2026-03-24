const express = require('express');
const router = express.Router();
const { 
    getMyTimesheets, 
    createTimesheet, 
    updateTimesheet, 
    deleteTimesheet, 
    getAllTimesheets 
} = require('../controllers/admin/timesheetController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createTimesheet);

router.route('/my')
    .get(protect, getMyTimesheets);

router.route('/all')
    .get(protect, authorize('admin'), getAllTimesheets);

router.route('/:id')
    .put(protect, updateTimesheet)
    .delete(protect, deleteTimesheet);

module.exports = router;
