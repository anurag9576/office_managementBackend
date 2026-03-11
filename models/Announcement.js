const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  type: {
    type: String,
    enum: ['Post', 'Poll'],
    default: 'Post',
  },
  imageUrl: {
    type: String,
  },
  pollOptions: [
    {
      label: {
        type: String,
        required: true,
      },
      votes: {
        type: Number,
        default: 0,
      },
      voters: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        }
      ]
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      isFlagged: {
        type: Boolean,
        default: false,
      },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
