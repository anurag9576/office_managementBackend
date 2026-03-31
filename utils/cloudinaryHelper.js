const cloudinary = require('../config/cloudinary');

/**
 * Extracts Cloudinary public_id from a URL
 * Handles formats: https://res.cloudinary.com/cloud_name/image/upload/v12345/folder/public_id.jpg
 * @param {string} url 
 * @returns {string|null}
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Cloudinary URLs usually follow: .../upload/v[version]/[public_id].[extension]
    // The public_id starts AFTER the version segment (which starts with 'v')
    let startIndex = uploadIndex + 1;
    if (parts[startIndex].startsWith('v') && !isNaN(parts[startIndex].substring(1))) {
      startIndex++;
    }
    
    const pathParts = parts.slice(startIndex);
    const lastPart = pathParts[pathParts.length - 1];
    const fileNameWithoutExt = lastPart.split('.')[0];
    
    pathParts[pathParts.length - 1] = fileNameWithoutExt;
    return pathParts.join('/');
  } catch (err) {
    console.error('Error parsing Cloudinary URL:', err);
    return null;
  }
};

/**
 * Deletes a file from Cloudinary given its URL
 * @param {string} url 
 */
const deleteFromCloudinary = async (url) => {
  if (!url) return;
  
  console.log('--- Cloudinary Delete Request ---');
  console.log('Original URL:', url);
  
  const publicId = getPublicIdFromUrl(url);
  console.log('Extracted Public ID:', publicId);

  if (!publicId) {
    console.warn('Could not extract Public ID from URL.');
    return;
  }

  try {
    let resourceType = 'image';
    if (url.toLowerCase().includes('/raw/upload/')) resourceType = 'raw';
    if (url.toLowerCase().includes('/video/upload/')) resourceType = 'video';
    
    console.log('Using Resource Type:', resourceType);

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log('Cloudinary Destroy Result:', result);
    
    if (result.result === 'not found' && resourceType === 'image') {
       console.log('File not found as image, trying as raw...');
       const rawResult = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
       console.log('Cloudinary Destroy (Raw) Result:', rawResult);
    }
    console.log('---------------------------------');
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    console.log('---------------------------------');
  }
};

module.exports = { deleteFromCloudinary, getPublicIdFromUrl };
