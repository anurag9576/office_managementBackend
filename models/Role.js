const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
  },
  permissions: {
    type: [String], // Array of route strings or module keys
    default: [],
  },
  description: {
    type: String,
    trim: true,
  },
  isSystemRole: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
