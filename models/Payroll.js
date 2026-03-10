const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  netAmount: {
    type: Number,
    required: true
  },
  grossAmount: {
    type: Number,
    required: true
  },
  totalDeductions: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    required: true
  },
  designation: String,
  departmentName: String,
  daysPresent: { type: Number, default: 0 },
  daysAbsent: { type: Number, default: 0 },
  totalDays: { type: Number, default: 30 },
  earnings: [
    {
      label: { type: String, required: true },
      amount: { type: Number, required: true }, // This will be "Earned"
      actualAmount: { type: Number, default: 0 } // This will be "Actual"
    }
  ],
  deductionsList: [
    {
      label: { type: String, required: true },
      amount: { type: Number, required: true }
    }
  ],
  pdfUrl: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Payroll', PayrollSchema);
