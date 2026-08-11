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
const H = () => ({
  Authorization: `Bearer ${key}`,
  apikey: key,
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

const GET = (p) => fetch(`${url}${p}`, { method: 'GET', headers: H() }).then(async (r) => ({ p, s: r.status, b: await r.text() }));
const POST = (p, body) => fetch(`${url}${p}`, { method: 'POST', headers: H(), body: JSON.stringify(body) }).then(async (r) => ({ p, s: r.status, b: await r.text() }));
const PUT = (p, body) => fetch(`${url}${p}`, { method: 'PUT', headers: H(), body: JSON.stringify(body) }).then(async (r) => ({ p, s: r.status, b: await r.text() }));
const DELETE = (p) => fetch(`${url}${p}`, { method: 'DELETE', headers: H() }).then(async (r) => ({ p, s: r.status, b: await r.text() }));

console.log('--- GET storage/v1/policies (list storage policies via storage admin API) ---');
console.log(await GET('/storage/v1/policies'));
console.log('--- GET storage/v1/buckets detail ---');
console.log(await GET('/storage/v1/bucket'));

// Try the SQL endpoint path: some Supabase deployments expose /query SQL executor under a project-only secret
console.log('--- Try SQL through PostgREST using a direct CREATE FUNCTION is not possible ---');
console.log('Instead, let us try the Supabase "storage policies" REST endpoint:');

const policies = [
  {
    name: 'Ecclesia anon read',
    definition: `bucket_id = 'ecclesia'`,
    table: 'objects',
    roles: ['anon'],
    command: 'SELECT',
  },
  {
    name: 'Ecclesia anon insert',
    definition: `bucket_id = 'ecclesia'`,
    table: 'objects',
    roles: ['anon'],
    command: 'INSERT',
  },
  {
    name: 'Ecclesia auth select',
    definition: `bucket_id = 'ecclesia'`,
    table: 'objects',
    roles: ['authenticated'],
    command: 'SELECT',
  },
  {
    name: 'Ecclesia auth insert',
    definition: `bucket_id = 'ecclesia'`,
    table: 'objects',
    roles: ['authenticated'],
    command: 'INSERT',
  },
  {
    name: 'Ecclesia auth update',
    definition: `bucket_id = 'ecclesia'`,
    table: 'objects',
    roles: ['authenticated'],
    command: 'UPDATE',
  },
  {
    name: 'Ecclesia auth delete',
    definition: `bucket_id = 'ecclesia'`,
    table: 'objects',
    roles: ['authenticated'],
    command: 'DELETE',
  },
  {
    name: 'Church-media anon read',
    definition: `bucket_id = 'church-media'`,
    table: 'objects',
    roles: ['anon'],
    command: 'SELECT',
  },
  {
    name: 'Church-media anon insert',
    definition: `bucket_id = 'church-media'`,
    table: 'objects',
    roles: ['anon'],
    command: 'INSERT',
  },
  {
    name: 'Church-media auth select',
    definition: `bucket_id = 'church-media'`,
    table: 'objects',
    roles: ['authenticated'],
    command: 'SELECT',
  },
  {
    name: 'Church-media auth insert',
    definition: `bucket_id = 'church-media'`,
    table: 'objects',
    roles: ['authenticated'],
    command: 'INSERT',
  },
  {
    name: 'Church-media auth update',
    definition: `bucket_id = 'church-media'`,
    table: 'objects',
    roles: ['authenticated'],
    command: 'UPDATE',
  },
  {
    name: 'Church-media auth delete',
    definition: `bucket_id = 'church-media'`,
    table: 'objects',
    roles: ['authenticated'],
    command: 'DELETE',
  },
];

for (const pol of policies) {
  console.log(`\n--- policy ${pol.name} ${pol.command} ---`);
  console.log(await POST('/storage/v1/policies', pol));
}

console.log('\n--- final policies list ---');
console.log(await GET('/storage/v1/policies'));
