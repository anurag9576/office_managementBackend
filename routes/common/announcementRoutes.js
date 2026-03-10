const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, toggleLike } = require('../../controllers/common/announcementController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.get('/', protect, getAnnouncements);
router.post('/', protect, authorize('Admin'), createAnnouncement);
router.put('/:id/like', protect, toggleLike);

module.exports = router;
