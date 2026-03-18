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
const { protect, authorize, checkPermission } = require('../../middleware/authMiddleware');

router.get('/', protect, getAnnouncements);
router.post('/', protect, checkPermission('announcement'), createAnnouncement);
router.put('/:id', protect, checkPermission('announcement'), updateAnnouncement);
router.delete('/:id', protect, checkPermission('announcement'), deleteAnnouncement);
router.put('/:id/like', protect, toggleLike);

// Comment routes
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);
router.put('/:id/comments/:commentId/flag', protect, checkPermission('announcement'), toggleFlagComment);

// Poll routes
router.put('/:id/vote', protect, voteAnnouncementPoll);

module.exports = router;
