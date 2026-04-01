const SalaryMaster = require('../../models/SalaryMaster');
const Employee = require('../../models/Employee');

// @desc    Get all salary master configs
// @route   GET /api/salary-master
// @access  Private/Admin
const getAllSalaryMasters = async (req, res) => {
  try {
    const masters = await SalaryMaster.find()
      .populate('employee', 'firstName lastName email employeeId designation')
      .sort('-createdAt');
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
    const { 
      employeeId, 
      grossAmount, 
      earnings = [], 
      deductionsList = [], 
      designation, 
      departmentName,
      isAutoGenerate 
    } = req.body;

    const targetEmployee = await Employee.findById(employeeId);
    if (!targetEmployee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const totalEarnings = (earnings || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalDeductions = (deductionsList || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const netAmount = Number(grossAmount) + totalEarnings - totalDeductions;

    // Use findOneAndUpdate with upsert:true to handle both create and update
    const master = await SalaryMaster.findOneAndUpdate(
      { employee: employeeId },
      {
        employee: employeeId,
        designation: designation || targetEmployee.designation,
        departmentName: departmentName || '',
        grossAmount: Number(grossAmount),
        totalDeductions,
        netAmount,
        earnings,
        deductionsList,
        isAutoGenerate: isAutoGenerate !== undefined ? isAutoGenerate : true
      },
      { new: true, upsert: true, runValidators: true }
    ).populate('employee', 'firstName lastName email employeeId');

    // Also update the employee's legacy salaryStructure field for backward compatibility
    targetEmployee.salaryStructure = {
      earnings,
      deductionsList,
      grossAmount: Number(grossAmount),
      totalDeductions,
      netAmount,
      isAutoGenerate: isAutoGenerate !== undefined ? isAutoGenerate : true
    };
    await targetEmployee.save();

    res.status(200).json({ success: true, data: master });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete salary master config
// @route   DELETE /api/salary-master/:id
// @access  Private/Admin
const deleteSalaryMaster = async (req, res) => {
  try {
    const master = await SalaryMaster.findById(req.params.id);
    if (!master) {
      return res.status(404).json({ success: false, message: 'Salary config not found' });
    }

    await master.deleteOne();
    res.json({ success: true, message: 'Salary config removed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllSalaryMasters,
  saveSalaryMaster,
  deleteSalaryMaster
};
