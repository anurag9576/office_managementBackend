const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EmployeeSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
  },
  role: {
    type: String,
    enum: ['Admin', 'HR Manager', 'QA', 'Developer', 'Manager', 'IT Team', 'Employee'],
    default: 'Employee',
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false,
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Terminated'],
    default: 'Active',
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  phone: {
    type: String,
    trim: true,
  },
  personalEmail: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  emergencyContact: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
  },
  location: {
    type: String,
    trim: true,
  },
  leaveBalance: {
    casual: {
      type: Number,
      default: 12,
    },
    sick: {
      type: Number,
      default: 6,
    },
  },
  salaryStructure: {
    earnings: [{ label: String, actualAmount: Number, amount: Number }],
    deductionsList: [{ label: String, amount: Number }],
    grossAmount: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    isAutoGenerate: { type: Boolean, default: true }
  },
  passwordChanged: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Hash password before saving
EmployeeSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
EmployeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add index for common queries
EmployeeSchema.index({ role: 1 });

module.exports = mongoose.model('Employee', EmployeeSchema);
