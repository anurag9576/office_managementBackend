const AnnouncementService = require('../../services/common/AnnouncementService');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await AnnouncementService.getAnnouncements();
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
    const announcement = await AnnouncementService.createAnnouncement(req.body, req.user._id);
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Toggle Like
// @route   PUT /api/announcements/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const likes = await AnnouncementService.toggleLike(req.params.id, req.user._id);
    res.json({ success: true, data: likes });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// @desc    Add comment to announcement
// @route   POST /api/announcements/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const comments = await AnnouncementService.addComment(req.params.id, req.user._id, req.body.text);
    res.status(201).json({ success: true, data: comments });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// @desc    Delete comment from announcement
// @route   DELETE /api/announcements/:id/comments/:commentId
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comments = await AnnouncementService.deleteComment(
        req.params.id, 
        req.params.commentId, 
        req.user._id, 
        req.user.role
    );
    res.json({ success: true, data: comments });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('authorized') ? 401 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// @desc    Flag/Unflag comment
// @route   PUT /api/announcements/:id/comments/:commentId/flag
// @access  Private/Admin
const toggleFlagComment = async (req, res) => {
  try {
    // Keeping this simple as it's directly on the document
    const Announcement = require('../../models/Announcement');
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    const comment = announcement.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
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
    const announcement = await AnnouncementService.updateAnnouncement(req.params.id, req.body, req.user.role);
    res.json({ success: true, data: announcement });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('authorized') ? 401 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
const deleteAnnouncement = async (req, res) => {
  try {
    await AnnouncementService.deleteAnnouncement(req.params.id, req.user.role);
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('authorized') ? 401 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// @desc    Vote in a poll
// @route   PUT /api/announcements/:id/vote
// @access  Private
const voteAnnouncementPoll = async (req, res) => {
  try {
    const announcement = await AnnouncementService.votePoll(req.params.id, req.user._id, req.body.optionId);
    res.json({ success: true, data: announcement });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
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
