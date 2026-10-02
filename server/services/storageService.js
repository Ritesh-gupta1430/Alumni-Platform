/**
 * Storage Service
 * Abstraction over file storage providers:
 * - local: disk storage (dev)
 * - cloudinary: Cloudinary CDN (prod)
 */
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || './uploads';

// Ensure upload directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function uploadFile(file, options = {}) {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  const { folder = 'general', allowedTypes = null } = options;

  // Validate file type
  if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} not allowed. Allowed: ${allowedTypes.join(', ')}`);
  }

  if (provider === 'cloudinary') {
    return uploadToCloudinary(file, folder);
  }

  return uploadToLocal(file, folder);
}

async function uploadToLocal(file, folder) {
  const dir = path.join(UPLOAD_DIR, folder);
  ensureDir(dir);

  const ext = path.extname(file.originalname);
  const filename = `${uuidv4()}${ext}`;
  const filepath = path.join(dir, filename);

  fs.writeFileSync(filepath, file.buffer);

  const relativePath = path.join(folder, filename).replace(/\\/g, '/');
  return {
    url: `/uploads/${relativePath}`,
    publicId: relativePath,
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    provider: 'local',
  };
}

async function uploadToCloudinary(file, folder) {
  let cloudinary;
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  } catch {
    console.warn('⚠️  Cloudinary not installed. Falling back to local storage.');
    return uploadToLocal(file, folder);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `alumnetra/${folder}`, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            provider: 'cloudinary',
          });
      }
    );
    stream.end(file.buffer);
  });
}

async function deleteFile(publicId, provider = null) {
  const activeProvider = provider || process.env.STORAGE_PROVIDER || 'local';

  if (activeProvider === 'local') {
    const filepath = path.join(UPLOAD_DIR, publicId);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    return true;
  }

  if (activeProvider === 'cloudinary') {
    try {
      const cloudinary = require('cloudinary').v2;
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch {
      console.warn('⚠️  Failed to delete from Cloudinary:', publicId);
      return false;
    }
  }

  return false;
}

function getFileUrl(publicId, provider = null) {
  const activeProvider = provider || process.env.STORAGE_PROVIDER || 'local';

  if (activeProvider === 'local') {
    return `/uploads/${publicId}`;
  }

  return publicId; // Cloudinary returns full URL
}

function getPrivateDownloadUrl(publicIdOrUrl, format = 'pdf') {
  if (process.env.STORAGE_PROVIDER === 'cloudinary') {
    try {
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      let cleanId = publicIdOrUrl;
      if (cleanId.includes('cloudinary.com')) {
        const match = cleanId.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
        if (match) cleanId = match[1];
      }
      cleanId = cleanId.replace(/\.[^/.]+$/, '');
      return cloudinary.utils.private_download_url(cleanId, format, {
        resource_type: 'image',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 days valid
      });
    } catch (e) {
      console.warn('⚠️  Failed to generate download URL:', e.message);
    }
  }
  return publicIdOrUrl;
}

function enrichDocumentUrls(doc) {
  if (!doc) return doc;
  const docObj = doc.toObject ? doc.toObject() : { ...doc };
  const isPdf = docObj.mimeType === 'application/pdf' || (docObj.url && docObj.url.toLowerCase().includes('.pdf'));

  if (docObj.url && docObj.url.includes('cloudinary.com')) {
    if (isPdf) {
      docObj.previewUrl = docObj.url.replace('/upload/', '/upload/pg_1,w_1400,c_limit,q_auto:best/').replace(/\.pdf$/i, '.jpg');
      docObj.thumbnailUrl = docObj.url.replace('/upload/', '/upload/pg_1,w_400,h_260,c_fill,q_auto/').replace(/\.pdf$/i, '.jpg');
      docObj.downloadUrl = getPrivateDownloadUrl(docObj.url, 'pdf');
    } else {
      docObj.previewUrl = docObj.url.replace('/upload/', '/upload/w_1400,c_limit,q_auto:best/');
      docObj.thumbnailUrl = docObj.url.replace('/upload/', '/upload/w_400,h_260,c_fill,q_auto/');
      docObj.downloadUrl = docObj.url;
    }
  } else {
    docObj.previewUrl = docObj.url;
    docObj.thumbnailUrl = docObj.url;
    docObj.downloadUrl = docObj.url;
  }
  return docObj;
}

// Multer memory storage configuration
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(req, file, cb) {
    const ALLOWED_MIMES = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(req, file, cb) {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images are allowed.'));
  },
});

module.exports = {
  uploadFile,
  deleteFile,
  getFileUrl,
  getPrivateDownloadUrl,
  enrichDocumentUrls,
  upload,
  imageUpload,
  ensureDir,
  UPLOAD_DIR,
};
