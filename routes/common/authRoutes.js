const express = require('express');
const router = express.Router();
const { loginEmployee, registerEmployee } = require('../../controllers/common/authController');
const { protect, authorize, checkPermission } = require('../../middleware/authMiddleware');

router.post('/login', loginEmployee);
router.post('/register', protect, checkPermission('employees'), registerEmployee);

module.exports = router;
