const PayrollService = require('../../services/employee/PayrollService');

const getMyPayrolls = async (req, res) => {
  try {
    const payrolls = await PayrollService.getMyPayrolls(req.user._id);
    res.json({ success: true, data: payrolls });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllPayrolls = async (req, res) => {
  try {
    const payrolls = await PayrollService.getAllPayrolls();
    res.json({ success: true, data: payrolls });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generatePayroll = async (req, res) => {
  try {
    if (req.body.pdfUrl && req.body.pdfUrl.length > 7000000) {
      return res.status(400).json({
        success: false,
        message: 'PDF is too large! Please upload a file smaller than 5MB.'
      });
    }

    const payroll = await PayrollService.generatePayroll(req.body);
    res.status(201).json({ success: true, data: payroll });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

const updatePayroll = async (req, res) => {
  try {
    if (req.body.pdfUrl && req.body.pdfUrl.length > 7000000) {
      return res.status(400).json({
        success: false,
        message: 'PDF is too large! Please upload a file smaller than 5MB.'
      });
    }

    const updatedPayroll = await PayrollService.updatePayroll(req.params.id, req.body);
    res.json({ success: true, data: updatedPayroll });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

const deletePayroll = async (req, res) => {
  try {
    await PayrollService.deletePayroll(req.params.id);
    res.json({ success: true, message: 'Payroll record removed' });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

module.exports = {
  getMyPayrolls,
  getAllPayrolls,
  generatePayroll,
  updatePayroll,
  deletePayroll
};
