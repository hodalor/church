import { createClient } from '@supabase/supabase-js';
import env from '../config/env.js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
const DEFAULT_BUCKET = 'church-media';

export const uploadBufferToSupabase = async ({
  bucket = DEFAULT_BUCKET,
  path,
  buffer,
  contentType = 'application/octet-stream',
}) => {
  if (!path || !buffer) {
    throw new Error('Both path and buffer are required for Supabase uploads.');
  }

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export default supabase;
