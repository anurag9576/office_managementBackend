const Announcement = require('../../models/Announcement');
const Employee = require('../../models/Employee');
const { createNotification } = require('../common/notificationController');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({})
      .populate('author', 'firstName lastName')
      .populate('comments.user', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: announcements.length, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create an announcement
// @route   POST /api/announcements
// @access  Private/Admin
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, type, imageUrl, pollOptions } = req.body;
    
    const announcement = await Announcement.create({
      title,
      content,
      type,
      imageUrl,
      pollOptions: pollOptions || [],
      author: req.user._id,
    });

    // Notify All Employees
    const employees = await Employee.find({});
    for (const emp of employees) {
      if (emp._id.toString() !== req.user._id.toString()) { // Don't notify the author
        await createNotification({
          recipient: emp._id,
          title: 'New Announcement',
          message: title,
          type: 'info',
          icon: 'campaign',
          route: '/dashboard/announcement'
        });
      }
    }

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error('SERVER ERROR (Create Announcement):', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Toggle Like
// @route   PUT /api/announcements/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const alreadyLiked = announcement.likes.find((like) => like.toString() === req.user._id.toString());
    if (alreadyLiked) {
      announcement.likes = announcement.likes.filter((like) => like.toString() !== req.user._id.toString());
    } else {
      announcement.likes.push(req.user._id);
    }

    await announcement.save();
    res.json({ success: true, data: announcement.likes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add comment to announcement
// @route   POST /api/announcements/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const { text } = req.body;
    announcement.comments.push({
      user: req.user._id,
      text,
    });

    await announcement.save();
    
    res.status(201).json({ success: true, data: announcement.comments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete comment from announcement
// @route   DELETE /api/announcements/:id/comments/:commentId
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const comment = announcement.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if current user is owner of comment OR is Admin
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    announcement.comments.pull(req.params.commentId);
    await announcement.save();

    res.json({ success: true, data: announcement.comments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Flag/Unflag comment
// @route   PUT /api/announcements/:id/comments/:commentId/flag
// @access  Private/Admin
const toggleFlagComment = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const comment = announcement.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    comment.isFlagged = !comment.isFlagged;
    await announcement.save();

    res.json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin
const updateAnnouncement = async (req, res) => {
  try {
    let announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // Only allow Admin to update
    if (req.user.role?.toLowerCase() !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update' });
    }

    announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error('SERVER ERROR (Update Announcement):', error);
    res.status(500).json({ success: false, error: 'Update failed: ' + error.message });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // Only allow Admin to delete
    if (req.user.role?.toLowerCase() !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete' });
    }

    await announcement.deleteOne();

    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('SERVER ERROR (Delete Announcement):', error);
    res.status(500).json({ success: false, error: 'Delete failed: ' + error.message });
  }
};

// @desc    Vote in a poll
// @route   PUT /api/announcements/:id/vote
// @access  Private
const voteAnnouncementPoll = async (req, res) => {
  try {
    const { optionId } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (announcement.type !== 'Poll') {
      return res.status(400).json({ success: false, message: 'This announcement is not a poll' });
    }

    // Check if user has already voted
    let previousOptionId = null;
    announcement.pollOptions.forEach(opt => {
      if (opt.voters.some(voterId => voterId.toString() === req.user._id.toString())) {
        previousOptionId = opt._id;
      }
    });

    if (previousOptionId) {
      // If clicking the same option they already voted for, do nothing or show message
      if (previousOptionId.toString() === optionId) {
        return res.status(400).json({ success: false, message: 'You have already voted for this option' });
      }

      // Remove previous vote
      const prevOption = announcement.pollOptions.id(previousOptionId);
      prevOption.votes = Math.max(0, prevOption.votes - 1);
      prevOption.voters = prevOption.voters.filter(vId => vId.toString() !== req.user._id.toString());
    }

    // Find the new option and add vote
    const option = announcement.pollOptions.id(optionId);
    if (!option) {
      return res.status(404).json({ success: false, message: 'Option not found' });
    }

    option.votes += 1;
    option.voters.push(req.user._id);

    await announcement.save();

    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  getAnnouncements, 
  createAnnouncement, 
  updateAnnouncement,
  deleteAnnouncement,
  toggleLike, 
  addComment, 
  deleteComment, 
  toggleFlagComment,
  voteAnnouncementPoll
};
