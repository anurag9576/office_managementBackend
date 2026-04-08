const TimesheetService = require('../../services/employee/TimesheetService');

// @desc    Get all timesheets for logged in employee
// @route   GET /api/timesheets/my
// @access  Private
exports.getMyTimesheets = async (req, res) => {
    try {
        const timesheets = await TimesheetService.getMyTimesheets(req.user.id);
        res.status(200).json({
            success: true,
            data: timesheets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Add new timesheet entry
// @route   POST /api/timesheets
// @access  Private
exports.createTimesheet = async (req, res) => {
    try {
        const timesheet = await TimesheetService.createTimesheet(req.user.id, req.body);
        res.status(201).json({
            success: true,
            data: timesheet
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Validation Error',
            error: error.message
        });
    }
};

// @desc    Update timesheet entry
// @route   PUT /api/timesheets/:id
// @access  Private
exports.updateTimesheet = async (req, res) => {
    try {
        const timesheet = await TimesheetService.updateTimesheet(
            req.params.id, 
            req.user.id, 
            req.body, 
            req.user.role
        );
        res.status(200).json({
            success: true,
            data: timesheet
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('authorized') ? 401 : 400;
        res.status(statusCode).json({
            success: false,
            message: 'Update Error',
            error: error.message
        });
    }
};

// @desc    Delete timesheet entry
// @route   DELETE /api/timesheets/:id
// @access  Private
exports.deleteTimesheet = async (req, res) => {
    try {
        await TimesheetService.deleteTimesheet(req.params.id, req.user.id, req.user.role);
        res.status(200).json({
            success: true,
            message: 'Timesheet removed'
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('authorized') ? 401 : 500;
        res.status(statusCode).json({
            success: false,
            message: 'Delete Error',
            error: error.message
        });
    }
};

// @desc    Get all timesheets (Admin only)
// @route   GET /api/timesheets/all
// @access  Private/Admin
exports.getAllTimesheets = async (req, res) => {
    try {
        const timesheets = await TimesheetService.getAllTimesheets(req.user);
        res.status(200).json({
            success: true,
            data: timesheets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
