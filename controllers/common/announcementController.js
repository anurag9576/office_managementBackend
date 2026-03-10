const Announcement = require('../../models/Announcement');

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
      pollOptions,
      author: req.user._id,
    });
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

module.exports = { getAnnouncements, createAnnouncement, toggleLike };
