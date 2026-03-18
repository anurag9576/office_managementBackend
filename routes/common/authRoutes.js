const express = require('express');
const router = express.Router();
const { loginEmployee, registerEmployee } = require('../../controllers/common/authController');
const { protect, authorize, checkPermission } = require('../../middleware/authMiddleware');
const { loginEmployee, registerEmployee, changePassword } = require('../../controllers/common/authController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.post('/login', loginEmployee);
router.post('/register', protect, checkPermission('employees'), registerEmployee);

module.exports = router;
