const Timesheet = require('../models/Timesheet');

// @desc    Get all timesheets for logged in employee
// @route   GET /api/timesheets/my
// @access  Private
exports.getMyTimesheets = async (req, res) => {
    try {
        const timesheets = await Timesheet.find({ employeeId: req.user.id }).sort({ date: -1 });
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
        const { date, project, branchName, task, minutes, workStatus } = req.body;

        const timesheet = await Timesheet.create({
            employeeId: req.user.id,
            date,
            project,
            branchName,
            task,
            minutes,
            workStatus
        });

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
        let timesheet = await Timesheet.findById(req.params.id);

        if (!timesheet) {
            return res.status(404).json({ success: false, message: 'Timesheet not found' });
        }

        // Make sure user owns timesheet
        if (timesheet.employeeId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        timesheet = await Timesheet.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: timesheet
        });
    } catch (error) {
        res.status(400).json({
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
        const timesheet = await Timesheet.findById(req.params.id);

        if (!timesheet) {
            return res.status(404).json({ success: false, message: 'Timesheet not found' });
        }

        // Make sure user owns timesheet
        if (timesheet.employeeId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await timesheet.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Timesheet removed'
        });
    } catch (error) {
        res.status(500).json({
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
        const timesheets = await Timesheet.find().populate('employeeId', 'firstName lastName email role').sort({ date: -1 });
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
