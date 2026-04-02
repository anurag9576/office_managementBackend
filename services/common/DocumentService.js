const DocumentTemplate = require('../../models/DocumentTemplate');
const EmployeeDocument = require('../../models/EmployeeDocument');
const Employee = require('../../models/Employee');
const DocumentRequest = require('../../models/DocumentRequest');
const NotificationService = require('./NotificationService');

class DocumentService {
  async getTemplates() {
    return await DocumentTemplate.find({});
  }

  async createTemplate(data) {
    return await DocumentTemplate.create(data);
  }

  async issueDocument(data, adminId) {
    const { employeeId, templateId, requestId } = data;

    const employee = await Employee.findById(employeeId).populate('department', 'name');
    const template = await DocumentTemplate.findById(templateId);

    if (!employee || !template) {
      throw new Error('Employee or Template not found');
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
      issuedBy: adminId,
      template: template._id,
      documentTitle: template.title,
      generatedContent: finalContent,
    });

    // Notify employee
    await NotificationService.createNotification({
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

    return document;
  }

  async getMyDocuments(userId) {
    return await EmployeeDocument.find({ employee: userId })
      .populate('issuedBy', 'firstName lastName')
      .sort('-issuedDate');
  }

  async getAllIssuedDocuments() {
    return await EmployeeDocument.find({})
      .populate('employee', 'firstName lastName employeeId email')
      .populate('issuedBy', 'firstName lastName')
      .sort('-issuedDate');
  }

  async requestDocument(userId, userInfo, data) {
    const { templateId, customDocumentName, message } = data;
    
    if (!templateId && !customDocumentName) {
      throw new Error('Please provide a document type or name');
    }

    const requestData = {
      employee: userId,
      message
    };

    if (templateId) requestData.template = templateId;
    if (customDocumentName) requestData.customDocumentName = customDocumentName;

    const request = await DocumentRequest.create(requestData);

    // Notify admins
    const admins = await Employee.find({ role: { $in: ['Admin', 'HR Manager'] } });
    const templateNameStr = templateId ? 'a document' : `the custom document "${customDocumentName}"`;
    
    if (admins.length > 0) {
      for (const admin of admins) {
        await NotificationService.createNotification({
          recipient: admin._id,
          title: 'New Document Request',
          message: `${userInfo.firstName} ${userInfo.lastName} requested ${templateNameStr}.`,
          type: 'request',
          icon: 'file_present',
          route: '/dashboard/documents-admin?tab=requests'
        });
      }
    }

    return request;
  }

  async getMyRequests(userId) {
    return await DocumentRequest.find({ employee: userId })
      .populate('template', 'name title')
      .sort('-createdAt');
  }

  async getAllRequests() {
    return await DocumentRequest.find({})
      .populate('employee', 'firstName lastName employeeId')
      .populate('template', 'name title')
      .sort('-createdAt');
  }

  async updateRequestStatus(id, status) {
    const request = await DocumentRequest.findById(id).populate('template', 'title');
    if (!request) {
      throw new Error('Request not found');
    }

    request.status = status;
    await request.save();

    // Notify employee
    if (status === 'Rejected' || status === 'Approved') {
      const docName = request.template ? request.template.title : (request.customDocumentName || 'Document');
      const title = status === 'Rejected' ? 'Document Request Rejected' : 'Document Request Approved';
      const message = status === 'Rejected' 
        ? `Your request for ${docName} has been rejected by the admin.` 
        : `Your request for ${docName} has been approved.`;
      
      await NotificationService.createNotification({
        recipient: request.employee,
        title,
        message,
        type: status === 'Rejected' ? 'alert' : 'success',
        icon: status === 'Rejected' ? 'error' : 'check_circle',
        route: '/dashboard/profile'
      });
    }

    return request;
  }
}

module.exports = new DocumentService();
