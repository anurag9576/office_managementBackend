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
        required: true,
        trim: true
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Timesheet', timesheetSchema);
