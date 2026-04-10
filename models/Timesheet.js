const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    project: {
        type: String,
        required: true,
        trim: true
    },
    branchName: {
        type: String,
        trim: true,
        default: ''
    },
    taskName: {
        type: String,
        trim: true,
        default: ''
    },
    task: {
        type: String,
        required: true
    },
    minutes: {
        type: Number,
        required: true,
        min: 0
    },
    workStatus: {
        type: String,
        required: true
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Timesheet', timesheetSchema);
