import api from '../api/axios.js';

export const DEFAULT_SUPABASE_BUCKET =
  process.env.REACT_APP_SUPABASE_BUCKET || 'ecclesia';

const MAX_FILE_SIZE_BYTES = 60 * 1024 * 1024; // 60MB original file upload cap (hard)
const COMPRESS_MAX_SIDE_PX = 2560;
const COMPRESS_JPEG_QUALITY = 0.82;
const COMPRESS_IF_OVER_BYTES = 1.2 * 1024 * 1024; // auto-compress anything > 1.2MB

const BUCKET_SETUP_HELP =
  'Open https://supabase.com/dashboard, select your project, go to SQL Editor, paste the SQL from supabase/migrations/create_church_media_bucket.sql, then click Run.';

const buildUploadErrorMessage = (error, bucketName) => {
  const rawMessage = String(error?.message || 'Upload failed.');
  const status = Number(error?.status ?? error?.statusCode ?? error?.response?.status ?? 0);
  const responseMessage = String(error?.response?.data?.message || '');
  const combined = responseMessage ? `${rawMessage} ${responseMessage}`.trim() : rawMessage;

  if (status === 413) {
    return `Uploaded file is too large for the server (413). The photo will be auto-compressed on next attempt — try a smaller crop or retake.`;
  }

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

const fileFromBlob = (blob, fallbackName, fallbackType) => {
  try {
    return new File([blob], fallbackName, {
      type: blob.type || fallbackType || 'application/octet-stream',
      lastModified: Date.now(),
    });
  } catch (_) {
    // Safari 10 fallback for File constructor with Blob
    const fall = blob;
    fall.name = fallbackName;
    fall.lastModified = Date.now();
    return fall;
  }
};

const compressImageIfNeeded = async (file) => {
  if (!file || !file.type) return file;
  const type = String(file.type).toLowerCase();
  const isPdf = type === 'application/pdf';
  const isSvg = type === 'image/svg+xml' || /\.svg$/i.test(file.name || '');
  if (isPdf || isSvg) return file;

  if (file.size && file.size <= COMPRESS_IF_OVER_BYTES && /image\/(jpe?g|png|webp)$/i.test(type)) {
    return file;
  }

  if (typeof window === 'undefined') return file;

  let image;
  try {
    if (typeof createImageBitmap === 'function' && typeof Blob !== 'undefined' && file instanceof Blob) {
      try {
        image = await createImageBitmap(file);
      } catch (_) {
        image = null;
      }
    }
  } catch (_) {
    image = null;
  }

  if (!image) {
    const dataUrl = await readFileAsDataUrl(file);
    image = await new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Unable to decode this image.'));
      img.onload = () => resolve(img);
      img.src = dataUrl;
    });
  }

  const srcWidth = Number(image.width) || 0;
  const srcHeight = Number(image.height) || 0;
  if (!srcWidth || !srcHeight) return file;

  const scale = Math.min(1, COMPRESS_MAX_SIDE_PX / Math.max(srcWidth, srcHeight));
  const outW = Math.max(1, Math.round(srcWidth * scale));
  const outH = Math.max(1, Math.round(srcHeight * scale));

  let canvas;
  if (typeof document !== 'undefined' && document.createElement) {
    canvas = document.createElement('canvas');
  } else if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(outW, outH);
  } else {
    return file;
  }

  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(image, 0, 0, outW, outH);
  if (typeof image.close === 'function') {
    try { image.close(); } catch (_) {}
  }

  const prefersJpeg = /image\/(jpe?g|bmp|tiff?|heic|heif)$/i.test(type) || !/image\/(png|webp|avif)$/i.test(type);
  const outType = prefersJpeg ? 'image/jpeg' : 'image/png';
  const outQuality = prefersJpeg ? COMPRESS_JPEG_QUALITY : undefined;

  let outBlob;
  if (typeof canvas.toBlob === 'function') {
    outBlob = await new Promise((resolve, reject) => {
      try {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas produced no blob.'))), outType, outQuality);
      } catch (err) {
        reject(err);
      }
    });
  } else if (typeof canvas.convertToBlob === 'function') {
    outBlob = await canvas.convertToBlob({ type: outType, quality: outQuality });
  } else {
    return file;
  }

  if (!outBlob || outBlob.size === 0) return file;

  const originalName = String(file.name || 'upload').replace(/\s+/g, '-').toLowerCase();
  const extPrefersJpeg = prefersJpeg && !/\.(jpe?g|png)$/i.test(originalName);
  const newName = extPrefersJpeg
    ? `${originalName.replace(/\.[^.]+$/, '') || 'upload'}.jpg`
    : originalName;

  const newType = outBlob.type || outType;
  const newFile = fileFromBlob(outBlob, newName, newType);
  if (newFile.size > file.size) {
    return file;
  }
  return newFile;
};

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

  if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(`File is too large (${mb} MB). Max file size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`);
  }

  const resolvedBucket = bucketName || DEFAULT_SUPABASE_BUCKET;
  const filePath =
    customPath || `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;

  let processed = file;
  try {
    processed = await compressImageIfNeeded(file);
  } catch {
    processed = file;
  }

  try {
    const url = await uploadViaBackend({
      file: processed,
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
