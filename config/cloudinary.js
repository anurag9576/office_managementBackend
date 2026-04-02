const cloudinary = require('cloudinary').v2;

cloudinary.config();

if (cloudinary.config().api_key) {
  console.log('Cloudinary Configured Successfully');
} else {
  console.error('Cloudinary Configuration Failed! Check CLOUDINARY_URL in .env');
}

module.exports = cloudinary;
