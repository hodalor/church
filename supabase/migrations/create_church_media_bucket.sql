INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'church-media',
  'church-media',
  TRUE,
  FALSE,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "church-media anon uploads" ON storage.objects;
DROP POLICY IF EXISTS "church-media anon reads" ON storage.objects;
DROP POLICY IF EXISTS "church-media authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "church-media authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "church-media authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "church-media authenticated deletes" ON storage.objects;

CREATE POLICY "church-media anon uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'church-media');

CREATE POLICY "church-media anon reads"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'church-media');

CREATE POLICY "church-media authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'church-media');

CREATE POLICY "church-media authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'church-media');

CREATE POLICY "church-media authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'church-media');

CREATE POLICY "church-media authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'church-media');
