const UploadService = require('../../services/common/UploadService');

const getCloudinarySignature = (req, res) => {
  try {
    const data = UploadService.getCloudinarySignature(req.body.folder);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const uploadFile = async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file provided. Ensure your form field name is "file".' 
      });
    }

    const folder = req.body.folder || 'office-management/general';
    const result = await UploadService.uploadFile(req.file.buffer, folder);

    console.log(`[Timer] Total upload process took: ${Date.now() - startTime}ms`);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Backend Upload Error:', error);
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
};

module.exports = { getCloudinarySignature, uploadFile };
