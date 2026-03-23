const mongoose = require('mongoose');

const EmployeeDocumentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', // Admin who issued the document
    required: true,
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentTemplate',
    required: true,
  },
  documentTitle: {
    type: String,
    required: true,
  },
  generatedContent: {
    type: String,
    required: true, // This will be the template content with replaced placeholders
  },
  status: {
    type: String,
    enum: ['Issued', 'Pending'],
    default: 'Issued',
  },
  issuedDate: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeDocument', EmployeeDocumentSchema);
