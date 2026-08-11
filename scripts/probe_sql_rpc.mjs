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
const H = (extra = {}) => ({
  Authorization: `Bearer ${key}`,
  apikey: key,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  ...extra,
});

const GET = (p) => fetch(`${url}${p}`, { method: 'GET', headers: H() }).then(async (r) => ({ path: p, status: r.status, body: await r.text() }));
const POST = (p, body, extra = {}) =>
  fetch(`${url}${p}`, {
    method: 'POST',
    headers: H(extra),
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(async (r) => ({ path: p, status: r.status, body: await r.text() }));

console.log('--- probe SQL execution via rpc/execute_sql if exists ---');
console.log(await POST('/rest/v1/rpc/pg_execute_sql', { query: 'SELECT 1 AS x;' }));
console.log(await POST('/rest/v1/rpc/sql', { query: 'SELECT 1 AS x;' }));
console.log(await POST('/rest/v1/rpc/exec_sql', { sql: 'SELECT 1 AS x;' }));

console.log('--- list existing policies via storage.objects RLS if accessible ---');
console.log(await GET('/rest/v1/pg_policies?select=*&limit=20'));

console.log('--- try creating a reusable exec_sql rpc so we can run policy SQL once ---');
const createRpc = `
CREATE OR REPLACE FUNCTION public.exec_sql(p_sql text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_out text := 'ok';
BEGIN
  EXECUTE p_sql;
  RETURN v_out;
EXCEPTION WHEN OTHERS THEN
  RETURN 'ERR: ' || SQLERRM;
END;
$$;
`;
console.log(await POST('/rest/v1/query', { query: createRpc }, { Prefer: 'return=minimal' }));
console.log(await POST('/rest/v1/rpc/exec_sql', { p_sql: 'SELECT 1;' }));
