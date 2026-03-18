const express = require('express');
const router = express.Router();
const { getEmployees, getEmployeeById, updateEmployee, deleteEmployee } = require('../../controllers/employee/employeeController');
const { protect, authorize, checkPermission } = require('../../middleware/authMiddleware');

router.get('/', protect, checkPermission('employees'), getEmployees);
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, updateEmployee);
router.delete('/:id', protect, checkPermission('employees'), deleteEmployee);

module.exports = router;
