const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: []
  }],
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['request', 'system', 'info', 'alert', 'success'],
    default: 'info'
  },
  icon: {
    type: String,
    default: 'notifications'
  },
  route: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for faster querying
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ isGlobal: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ readBy: 1 }); // Track which user read which global notification faster

module.exports = mongoose.model('Notification', notificationSchema);
