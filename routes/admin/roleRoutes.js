const express = require('express');
const router = express.Router();
const { getRoles, upsertRole, getRolePermissions, deleteRole } = require('../../controllers/admin/roleController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(authorize('Admin'), getRoles)
  .post(authorize('Admin'), upsertRole);

router.delete('/:id', authorize('Admin'), deleteRole);

router.get('/:name', getRolePermissions);

module.exports = router;
