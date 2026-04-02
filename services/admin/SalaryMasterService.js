const SalaryMaster = require('../../models/SalaryMaster');
const Employee = require('../../models/Employee');

class SalaryMasterService {
  async saveSalaryMaster(data) {
    const { 
      employeeId, 
      grossAmount, 
      earnings = [], 
      deductionsList = [], 
      designation, 
      departmentName,
      isAutoGenerate 
    } = data;

    const targetEmployee = await Employee.findById(employeeId);
    if (!targetEmployee) {
      throw new Error('Employee not found');
    }

    const totalEarnings = (earnings || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalDeductions = (deductionsList || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const netAmount = Number(grossAmount) + totalEarnings - totalDeductions;

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

    targetEmployee.salaryStructure = {
      earnings,
      deductionsList,
      grossAmount: Number(grossAmount),
      totalDeductions,
      netAmount,
      isAutoGenerate: isAutoGenerate !== undefined ? isAutoGenerate : true
    };
    await targetEmployee.save();

    return master;
  }

  async getAllSalaryMasters() {
    return await SalaryMaster.find()
      .populate('employee', 'firstName lastName email employeeId designation')
      .sort('-createdAt');
  }

  async deleteSalaryMaster(id) {
    const master = await SalaryMaster.findById(id);
    if (!master) {
      throw new Error('Salary config not found');
    }
    await master.deleteOne();
    return true;
  }
}

module.exports = new SalaryMasterService();
