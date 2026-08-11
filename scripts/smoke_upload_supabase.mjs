import { readFileSync, writeFileSync } from 'node:fs';
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
const anonKey = env.SUPABASE_ANON_KEY;

// 1x1 transparent PNG, base64
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const upload = async (bucket, path, buf, mimeType = 'image/png') => {
  const form = new Blob([buf], { type: mimeType });
  const r = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: form,
  });
  return { bucket, path, status: r.status, body: await r.text() };
};

const results = [];
const stamp = Date.now();
results.push(await upload('ecclesia', `smoke-test/${stamp}-e.png`, png));
results.push(await upload('church-media', `smoke-test/${stamp}-c.png`, png));

for (const r of results) {
  console.log(JSON.stringify(r));
}
