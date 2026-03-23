const express = require('express');
const router = express.Router();
const { 
  getTemplates, 
  createTemplate, 
  issueDocument, 
  getMyDocuments,
  getAllIssuedDocuments,
  requestDocument,
  getMyRequests,
  getAllRequests,
  updateRequestStatus
} = require('../../controllers/admin/documentController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Get/Create Templates - Admin Only
router.get('/templates', protect, authorize('admin'), getTemplates);
router.post('/templates', protect, authorize('admin'), createTemplate);

// Issue Document - Admin Only
router.post('/issue', protect, authorize('admin'), issueDocument);

// Get All Issued Documents - Admin Only
router.get('/issued-all', protect, authorize('admin'), getAllIssuedDocuments);

// Get My Documents - Private for Employee/User
router.get('/my', protect, getMyDocuments);

// Document Requests
router.post('/request', protect, requestDocument);
router.get('/my-requests', protect, getMyRequests);
router.get('/requests-all', protect, authorize('admin'), getAllRequests);
router.put('/request/:id', protect, authorize('admin'), updateRequestStatus);

module.exports = router;
