import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
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

export const supabaseUpload = async (file, bucketName, customPath) => {
  if (!file || !bucketName) {
    throw new Error('Both file and bucketName are required for upload.');
  }

  if (!hasConfiguredSupabase) {
    throw new Error(
      'File upload is not configured yet. Add valid REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in frontend/.env, then restart the frontend.',
    );
  }

  const filePath =
    customPath || `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
  const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(error.message || 'Upload failed.');
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
};

export default supabaseUpload;
