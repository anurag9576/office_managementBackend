const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  type: {
    type: String,
    enum: ['Casual Leave', 'Sick Leave', 'Optional Leave'],
    required: [true, 'Please provide leave type']
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide end date']
  },
  days: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason']
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Leave', LeaveSchema);
