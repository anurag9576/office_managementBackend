const mongoose = require('mongoose');

const SalaryMasterSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true // One master config per employee
  },
  designation: String,
  departmentName: String,
  grossAmount: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  earnings: [
    {
      label: { type: String, required: true },
      actualAmount: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    }
  ],
  deductionsList: [
    {
      label: { type: String, required: true },
      amount: { type: Number, required: true }
    }
  ],
  isAutoGenerate: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SalaryMaster', SalaryMasterSchema);
