const DocumentService = require('../../services/common/DocumentService');

const getTemplates = async (req, res) => {
  try {
    const templates = await DocumentService.getTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const template = await DocumentService.createTemplate(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const issueDocument = async (req, res) => {
  try {
    const document = await DocumentService.issueDocument(req.body, req.user._id);
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const documents = await DocumentService.getMyDocuments(req.user._id);
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllIssuedDocuments = async (req, res) => {
    try {
      const documents = await DocumentService.getAllIssuedDocuments();
      res.json({ success: true, data: documents });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

const requestDocument = async (req, res) => {
  try {
    const request = await DocumentService.requestDocument(req.user._id, req.user, req.body);
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    const statusCode = error.message.includes('provide') ? 400 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await DocumentService.getMyRequests(req.user._id);
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const requests = await DocumentService.getAllRequests();
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const request = await DocumentService.updateRequestStatus(req.params.id, req.body.status);
    res.json({ success: true, data: request });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
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

