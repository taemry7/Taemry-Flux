/**
 * TAEMRY FLUX - Screenshot & File Upload Middleware (Phase 4)
 * Uses multer with memoryStorage to accept image screenshots (jpg, png, jpeg, max 5MB).
 * Uploads to Firebase Storage in folder screenshots/{userId}/{timestamp}.jpg,
 * or provides a resilient base64 fallback when storage bucket credentials are not provided.
 */

import multer from 'multer';
import { admin, isFirebaseAdminConfigured } from '../firebaseAdmin.js';

// Configure multer memory storage
const storage = multer.memoryStorage();

// File filter: only allow images (jpeg, jpg, png, webp)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and WEBP image formats are accepted.'), false);
  }
};

// 5MB max file size limit
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes
  },
  fileFilter,
});

/**
 * Uploads a screenshot file buffer to Firebase Storage or generates a verified base64 URL fallback.
 * @param {Object} file - The file object provided by multer (file.buffer, file.mimetype, file.originalname)
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<string>} The public download URL or stored asset URL
 */
export async function uploadScreenshotToStorage(file, userId) {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const timestamp = Date.now();
  const fileExt = file.originalname ? file.originalname.split('.').pop() : 'jpg';
  const filePath = `screenshots/${userId}/${timestamp}.${fileExt}`;
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

  // Try real Firebase Storage bucket if configured
  if (isFirebaseAdminConfigured() && admin && admin.storage && bucketName) {
    try {
      const bucket = admin.storage().bucket(bucketName);
      const blob = bucket.file(filePath);
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (error) => {
          console.warn('Firebase Storage stream error, using fallback:', error.message);
          const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          resolve(base64Data);
        });

        blobStream.on('finish', async () => {
          try {
            // Attempt to make public or generate signed URL
            await blob.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve(publicUrl);
          } catch (pubErr) {
            // Signed download URL for 10 years
            const [signedUrl] = await blob.getSignedUrl({
              action: 'read',
              expires: '03-01-2036',
            });
            resolve(signedUrl);
          }
        });

        blobStream.end(file.buffer);
      });
    } catch (storageError) {
      console.warn('Firebase Storage upload exception, falling back to base64:', storageError.message);
    }
  }

  // Resilient fallback for preview/sandbox when no live bucket is set in env
  const base64Url = `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`;
  return base64Url;
}
