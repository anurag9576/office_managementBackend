const mongoose = require('mongoose');

const DocumentTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a template name'],
    unique: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a document title'],
  },
  content: {
    type: String,
    required: [true, 'Please add template content'],
    // This will support HTML or plain text with placeholders like {{firstName}}, {{lastName}}, etc.
  },
  type: {
    type: String,
    enum: ['Experience', 'Relieving', 'NOC', 'Bonafide', 'Other'],
    default: 'Other',
  }
}, { timestamps: true });

module.exports = mongoose.model('DocumentTemplate', DocumentTemplateSchema);
