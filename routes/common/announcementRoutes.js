const express = require('express');
const router = express.Router();
const { 
    getAnnouncements, 
    createAnnouncement, 
    updateAnnouncement,
    deleteAnnouncement,
    toggleLike,
    addComment,
    deleteComment,
    toggleFlagComment,
    voteAnnouncementPoll
} = require('../../controllers/common/announcementController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.get('/', protect, getAnnouncements);
router.post('/', protect, authorize('Admin'), createAnnouncement);
router.put('/:id', protect, authorize('Admin'), updateAnnouncement);
router.delete('/:id', protect, authorize('Admin'), deleteAnnouncement);
router.put('/:id/like', protect, toggleLike);

// Comment routes
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);
router.put('/:id/comments/:commentId/flag', protect, authorize('Admin'), toggleFlagComment);

// Poll routes
router.put('/:id/vote', protect, voteAnnouncementPoll);

module.exports = router;
