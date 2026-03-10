const express = require('express');
const router = express.Router();
const { getMyPayrolls, getAllPayrolls, generatePayroll, updatePayroll, deletePayroll } = require('../../controllers/employee/payrollController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Get all payrolls (Admin Only)
router.get('/', protect, authorize('Admin'), getAllPayrolls);

// Generate payroll (Admin Only)
router.post('/', protect, authorize('Admin'), generatePayroll);

// Update payroll (Admin Only)
router.put('/:id', protect, authorize('Admin'), updatePayroll);

// Delete payroll (Admin Only)
router.delete('/:id', protect, authorize('Admin'), deletePayroll);

// Get my payrolls
router.get('/my-payrolls', protect, getMyPayrolls);

module.exports = router;
