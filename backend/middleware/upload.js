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

  const base64Url = `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`;
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'taemry-flux.firebasestorage.app';

  // Try real Firebase Storage bucket if configured
  if (isFirebaseAdminConfigured() && admin && admin.storage && bucketName) {
    try {
      const timestamp = Date.now();
      const fileExt = file.originalname ? file.originalname.split('.').pop() : 'jpg';
      const filePath = `screenshots/${userId}/${timestamp}.${fileExt}`;
      const bucket = admin.storage().bucket(bucketName);
      const blob = bucket.file(filePath);

      const storagePromise = new Promise((resolve) => {
        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype,
            metadata: {
              uploadedBy: userId,
              uploadedAt: new Date().toISOString(),
            },
          },
          resumable: false,
        });

        blobStream.on('error', (error) => {
          console.warn('Firebase Storage stream error, using base64 fallback:', error.message);
          resolve(base64Url);
        });

        blobStream.on('finish', async () => {
          try {
            await blob.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve(publicUrl);
          } catch (pubErr) {
            try {
              const [signedUrl] = await blob.getSignedUrl({
                action: 'read',
                expires: '03-01-2036',
              });
              resolve(signedUrl);
            } catch (signErr) {
              resolve(base64Url);
            }
          }
        });

        blobStream.end(file.buffer);
      });

      // Strict 3.5s timeout on external cloud storage so API never hangs
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => {
          console.warn('Firebase Storage took >3.5s, using base64 fallback');
          resolve(base64Url);
        }, 3500)
      );

      return await Promise.race([storagePromise, timeoutPromise]);
    } catch (storageError) {
      console.warn('Firebase Storage upload exception, falling back to base64:', storageError.message);
      return base64Url;
    }
  }

  // Resilient fallback for preview/sandbox when no live bucket is set in env
  return base64Url;
}
