const Payroll = require('../../models/Payroll');
const Employee = require('../../models/Employee');
const cloudinary = require('../../config/cloudinary');
const { deleteFromCloudinary } = require('../../utils/cloudinaryHelper');

const getMyPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find({ 
      employee: req.user._id,
      paymentDate: { $lte: new Date() }
    }).sort('-paymentDate');
    res.json({ success: true, data: payrolls });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find().populate('employee', 'firstName lastName email employeeId').sort('-paymentDate');
    res.json({ success: true, data: payrolls });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generatePayroll = async (req, res) => {
  try {
    const { 
      employeeId, 
      email, 
      month, 
      year, 
      paymentDate, 
      grossAmount, 
      earnings = [], 
      deductionsList = [], 
      period, 
      status,
      pdfUrl
    } = req.body;

    let targetEmployee;

    if (email) {
      targetEmployee = await Employee.findOne({ email });
    } else if (employeeId) {
      targetEmployee = await Employee.findOne({ employeeId }) || await Employee.findById(employeeId);
    }

    if (!targetEmployee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found with the provided email or ID' 
      });
    }

    const totalEarnings = (earnings || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalDeductions = (deductionsList || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const netAmount = Number(grossAmount) + totalEarnings - totalDeductions;

    let finalPaymentDate;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = monthNames.indexOf(month);
    if (monthIndex !== -1) {
      finalPaymentDate = new Date(year, monthIndex + 1, 0);
    } else {
      finalPaymentDate = new Date(); 
    }

    let finalPdfUrl = pdfUrl || '';
    
    if (finalPdfUrl && finalPdfUrl.length > 7000000) {
      return res.status(400).json({
        success: false,
        message: 'PDF is too large! Please upload a file smaller than 5MB.'
      });
    }

    if (finalPdfUrl && finalPdfUrl.startsWith('data:application/pdf')) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(finalPdfUrl, {
          folder: 'office-management/payroll',
          resource_type: 'auto',
        });
        finalPdfUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary Payroll Upload Error:', uploadError);
      }
    }

    let payroll = await Payroll.create({
      employee: targetEmployee._id,
      month,
      year,
      paymentDate: finalPaymentDate,
      netAmount,
      grossAmount: Number(grossAmount),
      totalDeductions,
      period: period || `${month} ${year}`,
      designation: req.body.designation || targetEmployee.designation,
      departmentName: req.body.departmentName || '',
      daysPresent: req.body.daysPresent || 0,
      daysAbsent: req.body.daysAbsent || 0,
      totalDays: req.body.totalDays || 30,
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

    payroll = await payroll.populate('employee', 'firstName lastName email employeeId');

    res.status(201).json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    if (req.body.earnings || req.body.deductionsList || req.body.grossAmount) {
      const earnings = req.body.earnings || payroll.earnings;
      const deductionsList = req.body.deductionsList || payroll.deductionsList;
      const grossAmount = req.body.grossAmount || payroll.grossAmount;

      const totalEarnings = earnings.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const totalDeductions = deductionsList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      
      req.body.totalDeductions = totalDeductions;
      req.body.netAmount = Number(grossAmount) + totalEarnings - totalDeductions;
    }

    let updateData = { ...req.body };

    if (updateData.pdfUrl && updateData.pdfUrl.length > 7000000) {
      return res.status(400).json({
        success: false,
        message: 'PDF is too large! Please upload a file smaller than 5MB.'
      });
    }

    if (updateData.pdfUrl && updateData.pdfUrl !== payroll.pdfUrl) {
      let oldPdfUrl = payroll.pdfUrl;
      let isReadyToDelete = false;

      if (updateData.pdfUrl.startsWith('data:application/pdf')) {
        try {
          const uploadResponse = await cloudinary.uploader.upload(updateData.pdfUrl, {
            folder: 'office-management/payroll',
            resource_type: 'auto',
          });
          updateData.pdfUrl = uploadResponse.secure_url;
          isReadyToDelete = true;
        } catch (uploadError) {
          console.error('Cloudinary Payroll Update Error:', uploadError);
          isReadyToDelete = false;
        }
      } else if (updateData.pdfUrl.includes('cloudinary.com')) {
        isReadyToDelete = true;
      }

      if (isReadyToDelete && oldPdfUrl) {
        await deleteFromCloudinary(oldPdfUrl);
      }
    }

    const updatedPayroll = await Payroll.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('employee', 'firstName lastName email employeeId');

    res.json({ success: true, data: updatedPayroll });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    if (payroll.pdfUrl) {
      await deleteFromCloudinary(payroll.pdfUrl);
    }

    await payroll.deleteOne();
    res.json({ success: true, message: 'Payroll record removed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getMyPayrolls,
  getAllPayrolls,
  generatePayroll,
  updatePayroll,
  deletePayroll
};
