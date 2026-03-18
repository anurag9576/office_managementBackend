const express = require('express');
const router = express.Router();
const { getMyPayrolls, getAllPayrolls, generatePayroll, updatePayroll, deletePayroll } = require('../../controllers/employee/payrollController');
const { protect, authorize, checkPermission } = require('../../middleware/authMiddleware');

// Get all payrolls (Admin Only)
router.get('/', protect, checkPermission('payroll-admin'), getAllPayrolls);

// Generate payroll (Admin Only)
router.post('/', protect, checkPermission('payroll-admin'), generatePayroll);

// Update payroll (Admin Only)
router.put('/:id', protect, checkPermission('payroll-admin'), updatePayroll);

// Delete payroll (Admin Only)
router.delete('/:id', protect, checkPermission('payroll-admin'), deletePayroll);

// Get my payrolls
router.get('/my-payrolls', protect, getMyPayrolls);

module.exports = router;
