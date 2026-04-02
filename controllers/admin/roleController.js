const RoleService = require('../../services/admin/RoleService');
const Role = require('../../models/Role');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
const getRoles = async (req, res) => {
  try {
    const roles = await RoleService.getRoles();
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create or update role permissions
// @route   POST /api/roles
// @access  Private/Admin
const upsertRole = async (req, res) => {
  try {
    const role = await RoleService.upsertRole(req.body);
    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
const deleteRole = async (req, res) => {
  try {
    await RoleService.deleteRole(req.params.id);
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('System') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Get permissions for a specific role
// @route   GET /api/roles/:name
// @access  Private
const getRolePermissions = async (req, res) => {
  try {
    const role = await Role.findOne({ name: { $regex: new RegExp(`^${req.params.name}$`, 'i') } });
    if (!role) {
      // Return default employee permissions if role not found
      return res.json({ success: true, permissions: ['dashboard', 'profile', 'leaves', 'payroll', 'announcement', 'help'] });
    }
    res.json({ success: true, permissions: role.permissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getRoles,
  upsertRole,
  getRolePermissions,
  deleteRole
};
