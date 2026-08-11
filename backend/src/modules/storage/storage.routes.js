import { Router } from 'express';
import { body } from 'express-validator';
import auth from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';
import { success } from '../../utils/apiResponse.js';
import { createHttpError } from '../../utils/httpError.js';
import { uploadBufferToSupabase } from '../../utils/supabaseStorage.js';
import env from '../../config/env.js';

const storageRouter = Router();

const MAX_BASE64_BYTES = 60 * 1024 * 1024; // 60MB decoded

const BUCKET_SETUP_HELP =
  'Open the Supabase dashboard for this project, open SQL Editor, then paste the SQL from supabase/migrations/create_church_media_bucket.sql and click Run.';

storageRouter.post(
  '/upload',
  auth,
  [
    body('bucketName')
      .optional({ values: 'falsy' })
      .isString()
      .trim()
      .isLength({ max: 120 })
      .withMessage('Bucket name is too long.'),
    body('path')
      .optional({ values: 'falsy' })
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Storage path is too long.'),
    body('fileName')
      .optional({ values: 'falsy' })
      .isString()
      .trim()
      .isLength({ max: 255 })
      .withMessage('File name is too long.'),
    body('mimeType')
      .optional({ values: 'falsy' })
      .isString()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Mime type invalid.'),
    body('fileB64')
      .exists()
      .withMessage('file payload is required.')
      .isString()
      .withMessage('File payload must be a base64 string.')
      .custom((value) => {
        // Allow optional data URL style or pure base64; reject obviously invalid characters
        if (typeof value !== 'string') return false;
        const raw = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
        if (raw.length === 0) return false;
        const approxBytes = (raw.length * 3) / 4;
        if (approxBytes > MAX_BASE64_BYTES) return false;
        return /^[A-Za-z0-9+/=\s]+$/.test(raw);
      })
      .withMessage(`File must be valid base64 and smaller than ${Math.round(MAX_BASE64_BYTES / 1024 / 1024)}MB.`),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = req.user || {};
      const tenantId = req.headers['x-tenant-id'] || user.tenantId || env.SUPER_ADMIN_TENANT_ID || 'master';
      if (!tenantId) {
        throw createHttpError(400, 'Tenant context is required for uploads.');
      }

      const rawB64 = String(req.body.fileB64 || '');
      const cleanB64 = rawB64.includes(',') ? rawB64.slice(rawB64.indexOf(',') + 1) : rawB64;
      const buffer = Buffer.from(cleanB64, 'base64');

      const mimeType =
        String(req.body.mimeType || '').trim() || inferMimeFromName(String(req.body.fileName || ''));

      const preferredBucket = String(req.body.bucketName || env.SUPABASE_BUCKET_NAME || 'ecclesia').trim();

      let finalBucket = preferredBucket || 'ecclesia';
      let finalPath = String(req.body.path || '').trim();

      if (!finalPath) {
        const safeName = String(req.body.fileName || `upload-${Date.now()}.bin`).replace(/\s+/g, '-').toLowerCase();
        finalPath = `uploads/${tenantId}/${Date.now()}-${safeName}`;
      }

      const publicUrl = await uploadBufferToSupabase({
        bucket: finalBucket,
        path: finalPath,
        buffer,
        contentType: mimeType || 'application/octet-stream',
      });

      return success(res, {
        publicUrl,
        bucket: finalBucket,
        path: finalPath,
        size: buffer.length,
        mimeType: mimeType || 'application/octet-stream',
      }, 'File uploaded successfully.');
    } catch (err) {
      const msg = String(err?.message || 'Upload failed.');
      const statusCode = Number(err?.statusCode || 500);
      const finalMessage = /Bucket not found|does not exist|storage bucket/i.test(msg) ? `${msg} ${BUCKET_SETUP_HELP}` : msg;
      return next(createHttpError(statusCode, finalMessage));
    }
  },
);

const inferMimeFromName = (name) => {
  const lower = String(name || '').toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return '';
};

export default storageRouter;
