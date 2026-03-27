const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getCloudinarySignature, uploadFile } = require('../../controllers/common/uploadController');
const { protect } = require('../../middleware/authMiddleware');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Endpoint for backend-mediated upload (Easier frontend integration)
 * POST /api/upload
 * FormData: { "file": [BINARY], "folder": "office-management/avatars" }
 */
router.post('/', protect, upload.single('file'), uploadFile);

/**
 * Endpoint for direct secure uploads (Maximum performance)
 * POST /api/upload/signature
 */
router.post('/signature', protect, getCloudinarySignature);

module.exports = router;
