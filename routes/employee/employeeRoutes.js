const express = require('express');
const router = express.Router();
const { getEmployees, getEmployeeById, updateEmployee, getNextEmployeeId } = require('../../controllers/employee/employeeController');
const { protect, authorize, checkPermission } = require('../../middleware/authMiddleware');

router.get('/next-id', protect, getNextEmployeeId);
router.get('/', protect, checkPermission('employees'), getEmployees);
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, updateEmployee);

module.exports = router;
