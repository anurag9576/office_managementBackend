const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../../controllers/admin/departmentController');
const { protect, authorize, checkPermission } = require('../../middleware/authMiddleware');

router.get('/', protect, getDepartments);
router.post('/', protect, checkPermission('employees'), createDepartment);
router.put('/:id', protect, checkPermission('employees'), updateDepartment);
router.delete('/:id', protect, checkPermission('employees'), deleteDepartment);

module.exports = router;
