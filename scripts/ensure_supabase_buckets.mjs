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
const headers = {
  Authorization: `Bearer ${key}`,
  apikey: key,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const buckets = ['ecclesia', 'church-media'];

const get = async (path) => {
  const r = await fetch(`${url}${path}`, { method: 'GET', headers });
  return { ok: r.ok, status: r.status, body: await r.text() };
};

const post = async (path, body) => {
  const r = await fetch(`${url}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return { ok: r.ok, status: r.status, body: await r.text() };
};

console.log('--- list existing buckets ---');
const list = await get('/storage/v1/bucket');
console.log(list.status, list.body);

for (const bucketId of buckets) {
  console.log(`\n--- ensure storage.buckets row: ${bucketId} ---`);
  const upsert = await post('/rest/v1/storage.buckets', {
    id: bucketId,
    name: bucketId,
    public: true,
    avif_autodetection: false,
    file_size_limit: 52428800,
    allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  console.log(upsert.status, upsert.body);
}

console.log('\n--- verify both buckets readable via storage API ---');
for (const bucketId of buckets) {
  const r = await get(`/storage/v1/bucket/${bucketId}`);
  console.log(bucketId, r.status, r.body);
}
