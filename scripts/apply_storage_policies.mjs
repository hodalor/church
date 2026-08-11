import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', 'backend', '.env');

const rawEnv = readFileSync(envPath, 'utf8');
const env = {};
for (const line of rawEnv.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq < 0) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

const sqlStatements = `
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'ecclesia',
  'ecclesia',
  TRUE,
  FALSE,
  52428800,
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = now();

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'church-media',
  'church-media',
  TRUE,
  FALSE,
  52428800,
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = now();
`;

const policies = [
  { name: 'ecclesia anon reads',     cmd: 'CREATE POLICY IF NOT EXISTS "ecclesia anon reads"     ON storage.objects FOR SELECT TO anon           USING     (bucket_id = \'ecclesia\');' },
  { name: 'ecclesia anon uploads',   cmd: 'CREATE POLICY IF NOT EXISTS "ecclesia anon uploads"   ON storage.objects FOR INSERT TO anon           WITH CHECK (bucket_id = \'ecclesia\');' },
  { name: 'ecclesia auth reads',     cmd: 'CREATE POLICY IF NOT EXISTS "ecclesia auth reads"     ON storage.objects FOR SELECT TO authenticated USING     (bucket_id = \'ecclesia\');' },
  { name: 'ecclesia auth uploads',   cmd: 'CREATE POLICY IF NOT EXISTS "ecclesia auth uploads"   ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = \'ecclesia\');' },
  { name: 'ecclesia auth updates',   cmd: 'CREATE POLICY IF NOT EXISTS "ecclesia auth updates"   ON storage.objects FOR UPDATE TO authenticated USING     (bucket_id = \'ecclesia\');' },
  { name: 'ecclesia auth deletes',   cmd: 'CREATE POLICY IF NOT EXISTS "ecclesia auth deletes"   ON storage.objects FOR DELETE TO authenticated USING     (bucket_id = \'ecclesia\');' },

  { name: 'church-media anon reads',   cmd: 'CREATE POLICY IF NOT EXISTS "church-media anon reads"   ON storage.objects FOR SELECT TO anon           USING     (bucket_id = \'church-media\');' },
  { name: 'church-media anon uploads', cmd: 'CREATE POLICY IF NOT EXISTS "church-media anon uploads" ON storage.objects FOR INSERT TO anon           WITH CHECK (bucket_id = \'church-media\');' },
  { name: 'church-media auth reads',   cmd: 'CREATE POLICY IF NOT EXISTS "church-media auth reads"   ON storage.objects FOR SELECT TO authenticated USING     (bucket_id = \'church-media\');' },
  { name: 'church-media auth uploads', cmd: 'CREATE POLICY IF NOT EXISTS "church-media auth uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = \'church-media\');' },
  { name: 'church-media auth updates', cmd: 'CREATE POLICY IF NOT EXISTS "church-media auth updates" ON storage.objects FOR UPDATE TO authenticated USING     (bucket_id = \'church-media\');' },
  { name: 'church-media auth deletes', cmd: 'CREATE POLICY IF NOT EXISTS "church-media auth deletes" ON storage.objects FOR DELETE TO authenticated USING     (bucket_id = \'church-media\');' },
];

const allSql = sqlStatements + '\n' + policies.map((p) => p.cmd).join('\n') + '\n';

const res = await fetch(`${url}/rest/v1/rpc/pg_sleep`, { method: 'GET' });
// use SQL endpoint
const sqlResp = await fetch(`${url}/rest/v1/`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    apikey: key,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Prefer: 'return=representation',
  },
  body: JSON.stringify({ query: allSql }),
});
console.log('rest/v1/ POST status:', sqlResp.status);
console.log(await sqlResp.text());
