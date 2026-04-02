const SalaryMasterService = require('../../services/admin/SalaryMasterService');

// @desc    Get all salary master configs
// @route   GET /api/salary-master
// @access  Private/Admin
const getAllSalaryMasters = async (req, res) => {
  try {
    const masters = await SalaryMasterService.getAllSalaryMasters();
    res.json({ success: true, data: masters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Upsert salary master config for an employee
// @route   POST /api/salary-master
// @access  Private/Admin
const saveSalaryMaster = async (req, res) => {
  try {
    const master = await SalaryMasterService.saveSalaryMaster(req.body);
    res.status(200).json({ success: true, data: master });
  } catch (error) {
    // Determine appropriate status code based on error message
    const statusCode = error.message === 'Employee not found' ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

// @desc    Delete salary master config
// @route   DELETE /api/salary-master/:id
// @access  Private/Admin
const deleteSalaryMaster = async (req, res) => {
  try {
    await SalaryMasterService.deleteSalaryMaster(req.params.id);
    res.json({ success: true, message: 'Salary config removed' });
  } catch (error) {
    const statusCode = error.message === 'Salary config not found' ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllSalaryMasters,
  saveSalaryMaster,
  deleteSalaryMaster
};
