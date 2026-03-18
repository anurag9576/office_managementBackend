const express = require('express');
const router = express.Router();
const { getRoles, upsertRole, getRolePermissions, deleteRole } = require('../../controllers/admin/roleController');
const { protect, authorize, checkPermission } = require('../../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(checkPermission('roles'), getRoles)
  .post(checkPermission('roles'), upsertRole);

router.delete('/:id', checkPermission('roles'), deleteRole);

router.get('/:name', getRolePermissions);

module.exports = router;
