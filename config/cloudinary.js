const cloudinary = require('cloudinary').v2;

// Cloudinary SDK automatically picks up CLOUDINARY_URL from process.env
// if it is formatted correctly.
cloudinary.config();

module.exports = cloudinary;
