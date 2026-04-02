const cloudinary = require('../../config/cloudinary');
const { Readable } = require('stream');

class UploadService {
  /**
   * Get signature for direct frontend to cloudinary upload
   */
  getCloudinarySignature(folder = 'office-management/general') {
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const paramsToSign = {
      timestamp: timestamp,
      folder: folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      cloudinary.config().api_secret
    );

    return {
      signature,
      timestamp,
      cloudName: cloudinary.config().cloud_name,
      apiKey: cloudinary.config().api_key,
      folder: paramsToSign.folder
    };
  }

  /**
   * Upload file from backend to cloudinary using streams
   */
  async uploadFile(fileBuffer, folder = 'office-management/general') {
    const uploadStream = (buffer) => {
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

        Readable.from(buffer).pipe(cld_upload_stream);
      });
    };

    const result = await uploadStream(fileBuffer);
    return {
      url: result.secure_url,
      path: result.secure_url,
      public_id: result.public_id
    };
  }
}

module.exports = new UploadService();
