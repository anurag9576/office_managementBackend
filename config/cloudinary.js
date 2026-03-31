const cloudinary = require('cloudinary').v2;

// Cloudinary SDK automatically picks up CLOUDINARY_URL from process.env
// if it is formatted correctly.
cloudinary.config();

if (cloudinary.config().api_key) {
  console.log('Cloudinary Configured Successfully');
} else {
  console.error('Cloudinary Configuration Failed! Check CLOUDINARY_URL in .env');
}

module.exports = cloudinary;
