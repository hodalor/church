import api from '../api/axios.js';

export const DEFAULT_SUPABASE_BUCKET =
  process.env.REACT_APP_SUPABASE_BUCKET || 'ecclesia';

const BUCKET_SETUP_HELP =
  'Open https://supabase.com/dashboard, select your project, go to SQL Editor, paste the SQL from supabase/migrations/create_church_media_bucket.sql, then click Run.';

const buildUploadErrorMessage = (error, bucketName) => {
  const rawMessage = String(error?.message || 'Upload failed.');
  const status = Number(error?.status ?? error?.statusCode ?? error?.response?.status ?? 0);
  const responseMessage = String(error?.response?.data?.message || '');
  const combined = responseMessage ? `${rawMessage} ${responseMessage}`.trim() : rawMessage;

  const looksLikeBucketMissing =
    /bucket not found/i.test(combined) ||
    /does not exist/i.test(combined) ||
    (status === 400 && /bucket/i.test(combined)) ||
    status === 404;

  if (looksLikeBucketMissing) {
    return `Storage bucket "${bucketName}" is missing in Supabase. ${BUCKET_SETUP_HELP}`;
  }

  if (status === 403 || /policy|permission|denied|row-level security|violates/i.test(combined)) {
    return `Upload refused by Supabase policies for bucket "${bucketName}". ${BUCKET_SETUP_HELP}`;
  }

  return combined;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Unable to read file.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });

const uploadViaBackend = async ({ file, bucketName, customPath }) => {
  const dataUrl = await readFileAsDataUrl(file);
  const resp = await api.post('/storage/upload', {
    bucketName,
    path: customPath || undefined,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileB64: dataUrl,
  });
  return resp?.data?.data?.publicUrl || resp?.data?.publicUrl;
};

const ACCEPTED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/vnd.microsoft.icon',
  'image/x-icon',
  'image/tiff',
  'image/tif',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/svg+xml',
  'application/pdf',
];

const isAcceptedImage = (file) => {
  if (!file) return false;
  if (!file.type) return true;
  if (file.type.startsWith('image/')) return true;
  const nameLower = String(file.name || '').toLowerCase();
  const hasImageExt = /\.(jpe?g|png|gif|webp|bmp|ico|tiff?|heic|heif|avif|svg|pdf)$/i.test(nameLower);
  if (hasImageExt) return true;
  if (file.type.toLowerCase() === 'application/pdf') return true;
  return ACCEPTED_IMAGE_MIMES.includes(file.type.toLowerCase());
};

export const supabaseUpload = async (file, bucketName, customPath) => {
  if (!file) {
    throw new Error('A file is required for upload.');
  }

  if (!isAcceptedImage(file)) {
    throw new Error(
      'Unsupported file type. Accepted formats: JPEG, PNG, GIF, WEBP, BMP, TIFF, HEIC, HEIF, AVIF, SVG, ICO, PDF.',
    );
  }

  const resolvedBucket = bucketName || DEFAULT_SUPABASE_BUCKET;
  const filePath =
    customPath || `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;

  try {
    const url = await uploadViaBackend({
      file,
      bucketName: resolvedBucket,
      customPath: filePath,
    });
    if (url) {
      return url;
    }
    throw new Error('Backend upload did not return a public URL.');
  } catch (backendError) {
    throw new Error(buildUploadErrorMessage(backendError, resolvedBucket));
  }
};

export default supabaseUpload;
