const DocumentTemplate = require('../../models/DocumentTemplate');
const EmployeeDocument = require('../../models/EmployeeDocument');
const Employee = require('../../models/Employee');
const DocumentRequest = require('../../models/DocumentRequest');
const Notification = require('../../models/Notification');

// @desc    Get all document templates
// @route   GET /api/documents/templates
// @access  Private/Admin
const getTemplates = async (req, res) => {
  try {
    const templates = await DocumentTemplate.find({});
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new document template
// @route   POST /api/documents/templates
// @access  Private/Admin
const createTemplate = async (req, res) => {
  try {
    const template = await DocumentTemplate.create(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Issue a document to an employee
// @route   POST /api/documents/issue
// @access  Private/Admin
const issueDocument = async (req, res) => {
  try {
    const { employeeId, templateId, customContent, requestId } = req.body;

    const employee = await Employee.findById(employeeId).populate('department', 'name');
    const template = await DocumentTemplate.findById(templateId);

    if (!employee || !template) {
      return res.status(404).json({ success: false, message: 'Employee or Template not found' });
    }

    // Process placeholders in template content
    let finalContent = template.content;
    const placeholders = {
      '{{firstName}}': employee.firstName,
      '{{lastName}}': employee.lastName,
      '{{fullName}}': `${employee.firstName} ${employee.lastName}`,
      '{{employeeId}}': employee.employeeId,
      '{{designation}}': employee.designation,
      '{{department}}': employee.department ? employee.department.name : 'N/A',
      '{{joiningDate}}': employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '',
      '{{today}}': new Date().toLocaleDateString(),
    };

    // Replace placeholders
    Object.keys(placeholders).forEach(key => {
      finalContent = finalContent.split(key).join(placeholders[key]);
    });

    const document = await EmployeeDocument.create({
      employee: employee._id,
      issuedBy: req.user._id,
      template: template._id,
      documentTitle: template.title,
      generatedContent: finalContent,
    });

    // Notify employee
    await Notification.create({
      recipient: employee._id,
      title: 'Document Issued',
      message: `Admin has issued your ${template.title}.`,
      type: 'success',
      icon: 'description',
      route: '/dashboard/profile'
    });

    // If this was from a request, update the request status
    if (requestId) {
      await DocumentRequest.findByIdAndUpdate(requestId, { status: 'Approved' });
    }

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get issued documents for the logged in employee
// @route   GET /api/documents/my
// @access  Private
const getMyDocuments = async (req, res) => {
  try {
    const documents = await EmployeeDocument.find({ employee: req.user._id })
      .populate('issuedBy', 'firstName lastName')
      .sort('-issuedDate');
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all issued documents (for Admin)
// @route   GET /api/documents/issued-all
// @access  Private/Admin
const getAllIssuedDocuments = async (req, res) => {
    try {
      const documents = await EmployeeDocument.find({})
        .populate('employee', 'firstName lastName employeeId email')
        .populate('issuedBy', 'firstName lastName')
        .sort('-issuedDate');
      res.json({ success: true, data: documents });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

// @desc    Request a document (by Employee)
// @route   POST /api/documents/request
// @access  Private
const requestDocument = async (req, res) => {
  try {
    const { templateId, customDocumentName, message } = req.body;
    
    if (!templateId && !customDocumentName) {
      return res.status(400).json({ success: false, message: 'Please provide a document type or name' });
    }

    const requestData = {
      employee: req.user._id,
      message
    };

    if (templateId) requestData.template = templateId;
    if (customDocumentName) requestData.customDocumentName = customDocumentName;

    const request = await DocumentRequest.create(requestData);

    // Notify admins
    const admins = await Employee.find({ role: { $in: ['Admin', 'HR Manager'] } });
    const templateNameStr = templateId ? 'a document' : `the custom document "${customDocumentName}"`;
    if (admins.length > 0) {
      const notifications = admins.map(admin => ({
        recipient: admin._id,
        title: 'New Document Request',
        message: `${req.user.firstName} ${req.user.lastName} requested ${templateNameStr}.`,
        type: 'request',
        icon: 'file_present',
        route: '/dashboard/documents-admin?tab=requests'
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get my document requests
// @route   GET /api/documents/my-requests
// @access  Private
const getMyRequests = async (req, res) => {
  try {
    const requests = await DocumentRequest.find({ employee: req.user._id })
      .populate('template', 'name title')
      .sort('-createdAt');
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all document requests (for Admin)
// @route   GET /api/documents/requests-all
// @access  Private/Admin
const getAllRequests = async (req, res) => {
  try {
    const requests = await DocumentRequest.find({})
      .populate('employee', 'firstName lastName employeeId')
      .populate('template', 'name title')
      .sort('-createdAt');
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update document request status
// @route   PUT /api/documents/request/:id
// @access  Private/Admin
const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const request = await DocumentRequest.findById(req.params.id).populate('template', 'title');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.status = status;
    await request.save();

    // Notify employee about rejection or approval (if not already notified via issueDocument)
    if (status === 'Rejected' || status === 'Approved') {
      const docName = request.template ? request.template.title : (request.customDocumentName || 'Document');
      const title = status === 'Rejected' ? 'Document Request Rejected' : 'Document Request Approved';
      const message = status === 'Rejected' 
        ? `Your request for ${docName} has been rejected by the admin.` 
        : `Your request for ${docName} has been approved.`;
      
      await Notification.create({
        recipient: request.employee,
        title,
        message,
        type: status === 'Rejected' ? 'alert' : 'success',
        icon: status === 'Rejected' ? 'error' : 'check_circle',
        route: '/dashboard/profile'
      });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  issueDocument,
  getMyDocuments,
  getAllIssuedDocuments,
  requestDocument,
  getMyRequests,
  getAllRequests,
  updateRequestStatus
};

