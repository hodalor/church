import { createClient } from '@supabase/supabase-js';
import api from '../api/axios.js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
export const DEFAULT_SUPABASE_BUCKET =
  process.env.REACT_APP_SUPABASE_BUCKET || 'ecclesia';

const hasConfiguredSupabase =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-supabase-anon-key';

if (!hasConfiguredSupabase) {
  console.warn('Supabase env vars are missing. Uploads will fail until they are configured.');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
);

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
    mimeType: file.type || undefined,
    fileB64: dataUrl,
  });
  return resp?.data?.data?.publicUrl || resp?.data?.publicUrl;
};

export const supabaseUpload = async (file, bucketName, customPath) => {
  if (!file) {
    throw new Error('A file is required for upload.');
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
  } catch (backendError) {
    const backendFriendly = buildUploadErrorMessage(backendError, resolvedBucket);
    if (/401|403|Authorization|auth|policy|row-level|violates|bucket not found|does not exist/i.test(backendFriendly)) {
      throw new Error(backendFriendly);
    }
    console.warn('Backend storage upload failed, falling back to Supabase direct upload:', backendFriendly);
  }

  if (!hasConfiguredSupabase) {
    throw new Error(
      'File upload is not configured yet. Add valid REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in frontend/.env, then restart the frontend.',
    );
  }

  const { error } = await supabase.storage.from(resolvedBucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(buildUploadErrorMessage(error, resolvedBucket));
  }

  const { data } = supabase.storage.from(resolvedBucket).getPublicUrl(filePath);
  return data.publicUrl;
};

export default supabaseUpload;
