const Payroll = require('../../models/Payroll');
const Employee = require('../../models/Employee');
const cloudinary = require('../../config/cloudinary');
const { deleteFromCloudinary } = require('../../utils/cloudinaryHelper');

class PayrollService {
  async getMyPayrolls(userId) {
    return await Payroll.find({ 
      employee: userId,
      paymentDate: { $lte: new Date() }
    }).sort('-paymentDate');
  }

  async getAllPayrolls() {
    return await Payroll.find().populate('employee', 'firstName lastName email employeeId').sort('-paymentDate');
  }

  async generatePayroll(data) {
    const { 
      employeeId, 
      email, 
      month, 
      year, 
      grossAmount, 
      earnings = [], 
      deductionsList = [], 
      period, 
      pdfUrl,
      designation,
      departmentName,
      daysPresent,
      daysAbsent,
      totalDays
    } = data;

    let targetEmployee;
    if (email) {
      targetEmployee = await Employee.findOne({ email });
    } else if (employeeId) {
      targetEmployee = await Employee.findOne({ employeeId }) || await Employee.findById(employeeId);
    }

    if (!targetEmployee) {
      throw new Error('Employee not found');
    }

    const totalEarnings = (earnings || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalDeductions = (deductionsList || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const netAmount = Number(grossAmount) + totalEarnings - totalDeductions;

    let finalPaymentDate;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = monthNames.indexOf(month);
    finalPaymentDate = monthIndex !== -1 ? new Date(year, monthIndex + 1, 0) : new Date();

    let finalPdfUrl = pdfUrl || '';
    if (finalPdfUrl && finalPdfUrl.startsWith('data:application/pdf')) {
      const uploadResponse = await cloudinary.uploader.upload(finalPdfUrl, {
        folder: 'office-management/payroll',
        resource_type: 'auto',
      });
      finalPdfUrl = uploadResponse.secure_url;
    }

    const payroll = await Payroll.create({
      employee: targetEmployee._id,
      month,
      year,
      paymentDate: finalPaymentDate,
      netAmount,
      grossAmount: Number(grossAmount),
      totalDeductions,
      period: period || `${month} ${year}`,
      designation: designation || targetEmployee.designation,
      departmentName: departmentName || '',
      daysPresent: daysPresent || 0,
      daysAbsent: daysAbsent || 0,
      totalDays: totalDays || 30,
      earnings: earnings || [],
      deductionsList: deductionsList || [],
      pdfUrl: finalPdfUrl
    });

    targetEmployee.salaryStructure = {
      earnings: earnings || [],
      deductionsList: deductionsList || [],
      grossAmount: Number(grossAmount) || 0,
      totalDeductions: totalDeductions || 0,
      netAmount: netAmount || 0,
      isAutoGenerate: true
    };
    await targetEmployee.save();

    return await Payroll.findById(payroll._id).populate('employee', 'firstName lastName email employeeId');
  }

  async updatePayroll(id, updateData) {
    const payroll = await Payroll.findById(id);
    if (!payroll) throw new Error('Payroll record not found');

    let dataToUpdate = { ...updateData };

    if (dataToUpdate.earnings || dataToUpdate.deductionsList || dataToUpdate.grossAmount) {
      const earnings = dataToUpdate.earnings || payroll.earnings;
      const deductionsList = dataToUpdate.deductionsList || payroll.deductionsList;
      const grossAmount = dataToUpdate.grossAmount || payroll.grossAmount;

      const totalEarnings = earnings.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const totalDeductions = deductionsList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      
      dataToUpdate.totalDeductions = totalDeductions;
      dataToUpdate.netAmount = Number(grossAmount) + totalEarnings - totalDeductions;
    }

    if (dataToUpdate.pdfUrl && dataToUpdate.pdfUrl !== payroll.pdfUrl) {
      if (dataToUpdate.pdfUrl.startsWith('data:application/pdf')) {
        const uploadResponse = await cloudinary.uploader.upload(dataToUpdate.pdfUrl, {
          folder: 'office-management/payroll',
          resource_type: 'auto',
        });
        if (payroll.pdfUrl) await deleteFromCloudinary(payroll.pdfUrl);
        dataToUpdate.pdfUrl = uploadResponse.secure_url;
      }
    }

    return await Payroll.findByIdAndUpdate(id, dataToUpdate, {
      new: true,
      runValidators: true,
    }).populate('employee', 'firstName lastName email employeeId');
  }

  async deletePayroll(id) {
    const payroll = await Payroll.findById(id);
    if (!payroll) throw new Error('Payroll record not found');

    if (payroll.pdfUrl) {
      await deleteFromCloudinary(payroll.pdfUrl);
    }

    await payroll.deleteOne();
    return true;
  }
}

module.exports = new PayrollService();
