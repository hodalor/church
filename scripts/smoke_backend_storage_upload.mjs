import { uploadBufferToSupabase } from '../backend/src/utils/supabaseStorage.js';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const stamp = Date.now();

async function main() {
  for (const bucket of ['ecclesia', 'church-media']) {
    const path = `smoke-test/backend-${stamp}-${bucket}.png`;
    try {
      const url = await uploadBufferToSupabase({
        bucket,
        path,
        buffer: png,
        contentType: 'image/png',
      });
      console.log(`SUCCESS bucket=${bucket} path=${path} url=${url}`);
    } catch (err) {
      console.log(`FAIL bucket=${bucket}:`, err.message || String(err), err.statusCode || '');
    }
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
