const Role = require('../../models/Role');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
const getRoles = async (req, res) => {
  try {
    let roles = await Role.find();
    
    // If no roles exist, seed default roles
    if (roles.length === 0) {
      const defaultRoles = [
        { 
          name: 'Admin', 
          permissions: ['dashboard', 'employees', 'roles', 'attendance', 'leaves-admin', 'payroll-admin', 'tasks', 'reports', 'announcement', 'settings'],
          isSystemRole: true 
        },
        { 
          name: 'Employee', 
          permissions: ['dashboard', 'profile', 'leaves', 'payroll', 'announcement', 'help'],
          isSystemRole: true 
        },
        { 
          name: 'HR Manager', 
          permissions: ['dashboard', 'employees', 'attendance', 'leaves-admin', 'announcement'],
          isSystemRole: false 
        },
        { 
          name: 'QA', 
          permissions: ['dashboard', 'profile', 'announcement', 'help'],
          isSystemRole: false 
        },
        { 
          name: 'Developer', 
          permissions: ['dashboard', 'profile', 'announcement', 'help', 'tasks'],
          isSystemRole: false 
        },
        { 
          name: 'Manager', 
          permissions: ['dashboard', 'attendance', 'leaves-admin', 'announcement', 'tasks', 'profile', 'help'],
          isSystemRole: false 
        },
        { 
          name: 'IT Team', 
          permissions: ['dashboard', 'settings', 'announcement', 'help'],
          isSystemRole: false 
        }
      ];
      roles = await Role.insertMany(defaultRoles);
    }
    
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
    const { id, name, permissions, description } = req.body;

    let role;
    if (id) {
      role = await Role.findById(id);
    } else {
      role = await Role.findOne({ name });
    }

    if (role) {
      role.name = name || role.name;
      role.permissions = permissions;
      role.description = description || role.description;
      await role.save();
    } else {
      role = await Role.create({ name, permissions, description });
    }

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
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isSystemRole) {
      return res.status(400).json({ success: false, message: 'System roles cannot be deleted' });
    }

    await role.deleteOne();
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
