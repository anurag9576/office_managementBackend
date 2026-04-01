const express = require('express');
const router = express.Router();
const { getAllSalaryMasters, saveSalaryMaster, deleteSalaryMaster } = require('../../controllers/admin/salaryMasterController');
const { protect, authorize, checkPermission } = require('../../middleware/authMiddleware');

// Get all salary master configs
router.get('/', protect, checkPermission('payroll-admin'), getAllSalaryMasters);

// Create or update salary master config
router.post('/', protect, checkPermission('payroll-admin'), saveSalaryMaster);

// Delete salary master config
router.delete('/:id', protect, checkPermission('payroll-admin'), deleteSalaryMaster);

module.exports = router;
