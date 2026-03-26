const express = require('express');
const router = express.Router();
const { getHolidays, addHoliday, deleteHoliday } = require('../../controllers/admin/holidayController');
// Assume protect and authorize exist based on folder structure (likely middleware/auth.js)
const { protect, authorize } = require('../../middleware/authMiddleware');

// Public route to view holidays (everyone)
router.get('/', getHolidays);

// Private routes to manage holidays (admin only)
router.post('/', protect, authorize('Admin'), addHoliday);
router.delete('/:id', protect, authorize('Admin'), deleteHoliday);

module.exports = router;
