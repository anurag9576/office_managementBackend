const express = require('express');
const router = express.Router();
const { loginEmployee, registerEmployee, changePassword } = require('../../controllers/common/authController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.post('/login', loginEmployee);
router.post('/register', protect, authorize('Admin'), registerEmployee);
router.put('/change-password', protect, changePassword);

module.exports = router;
