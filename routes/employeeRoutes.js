const express = require('express');
const router = express.Router();
const { getEmployees, getEmployeeById, updateEmployee, deleteEmployee } = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Admin'), getEmployees);
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, authorize('Admin'), updateEmployee);
router.delete('/:id', protect, authorize('Admin'), deleteEmployee);

module.exports = router;
