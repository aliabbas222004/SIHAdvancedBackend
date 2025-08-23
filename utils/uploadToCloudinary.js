// utils/uploadToCloudinary.js
const cloudinary = require('./cloudinary');
const path = require('path');

const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw', // because PDF is not image/video
      folder: 'bills',
    });
    return result.secure_url;
  } catch (err) {
    throw new Error(`Cloudinary upload failed: ${err.message}`);
  }
};

module.exports = uploadToCloudinary;
