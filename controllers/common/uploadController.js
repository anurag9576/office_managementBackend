const cloudinary = require('../../config/cloudinary');
const { Readable } = require('stream');

/**
 * @desc    Get Cloudinary Signature (For Direct Frontend -> Cloudinary Upload)
 * @route   POST /api/upload/signature
 * @access  Private
 */
const getCloudinarySignature = (req, res) => {
  try {
    const { folder } = req.body;
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const paramsToSign = {
      timestamp: timestamp,
      folder: folder || 'office-management/general',
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      cloudinary.config().api_secret
    );

    res.status(200).json({
      success: true,
      data: {
        signature,
        timestamp,
        cloudName: cloudinary.config().cloud_name,
        apiKey: cloudinary.config().api_key,
        folder: paramsToSign.folder
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Upload File to Cloudinary via Backend (The "Dedicated" API)
 * @route   POST /api/upload
 * @access  Private
 */
const uploadFile = async (req, res) => {
  const startTime = Date.now();
  try {
    console.log('--- Incoming Upload Request ---');
    console.log('Headers:', req.headers['content-type']);
    console.log('Body Keys:', Object.keys(req.body));
    
    if (!req.file) {
      console.warn('Upload Attempt Failed: No file found in request. Check if multipart/form-data field name is "file".');
      return res.status(400).json({ 
        success: false, 
        message: 'No file provided. Ensure your form field name is "file".',
        receivedBody: Object.keys(req.body) 
      });
    }

    const folder = req.body.folder || 'office-management/general';
    console.log(`[Timer] File received by server in: ${Date.now() - startTime}ms`);

    // OPTIMIZATION: Use Native Node 'Readable' stream instead of external library
    const uploadStream = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const cld_upload_stream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );

        // Native stream pipe
        Readable.from(fileBuffer).pipe(cld_upload_stream);
      });
    };

    const uploadStart = Date.now();
    const result = await uploadStream(req.file.buffer);
    console.log(`[Timer] Cloudinary upload finished in: ${Date.now() - uploadStart}ms`);
    console.log(`[Timer] Total process took: ${Date.now() - startTime}ms`);

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        path: result.secure_url,
        public_id: result.public_id
      }
    });
  } catch (error) {
    console.error('Backend Upload Error:', error);
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
};

module.exports = { getCloudinarySignature, uploadFile };
