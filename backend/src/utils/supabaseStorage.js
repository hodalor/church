import { createClient } from '@supabase/supabase-js';
import env from '../config/env.js';
import { createHttpError } from './httpError.js';

const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
const supabase = createClient(env.SUPABASE_URL, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const DEFAULT_BUCKET = env.SUPABASE_BUCKET_NAME || 'ecclesia';

const BUCKET_SETUP_HELP =
  'Open the Supabase dashboard, select this project, launch the SQL Editor, paste the SQL from supabase/migrations/create_church_media_bucket.sql, and click Run.';

const buildStorageError = (error, bucket) => {
  const rawMessage = String(error?.message || 'Upload failed.');
  const status = Number(error?.status ?? error?.statusCode ?? 0);
  const looksLikeBucketMissing =
    /bucket not found/i.test(rawMessage) ||
    /does not exist/i.test(rawMessage) ||
    (status === 400 && /bucket/i.test(rawMessage)) ||
    status === 404;

  if (looksLikeBucketMissing) {
    return createHttpError(
      500,
      `Storage bucket "${bucket}" is missing in Supabase. ${BUCKET_SETUP_HELP}`,
    );
  }

  if (status === 403 || /policy|permission|denied/i.test(rawMessage)) {
    return createHttpError(
      500,
      `Upload refused by Supabase policies for bucket "${bucket}". ${BUCKET_SETUP_HELP}`,
    );
  }

  return createHttpError(500, `Supabase upload failed: ${rawMessage}`);
};

export const uploadBufferToSupabase = async ({
  bucket = DEFAULT_BUCKET,
  path,
  buffer,
  contentType = 'application/octet-stream',
}) => {
  if (!path || !buffer) {
    throw createHttpError(400, 'Both path and buffer are required for Supabase uploads.');
  }

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw buildStorageError(error, bucket);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export default supabase;
