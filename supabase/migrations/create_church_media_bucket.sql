INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'church-media',
  'church-media',
  TRUE,
  FALSE,
  209715200,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'ecclesia',
  'ecclesia',
  TRUE,
  FALSE,
  209715200,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "church-media anon uploads" ON storage.objects;
DROP POLICY IF EXISTS "church-media anon reads" ON storage.objects;
DROP POLICY IF EXISTS "church-media authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "church-media authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "church-media authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "church-media authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "ecclesia anon uploads" ON storage.objects;
DROP POLICY IF EXISTS "ecclesia anon reads" ON storage.objects;
DROP POLICY IF EXISTS "ecclesia authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "ecclesia authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "ecclesia authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "ecclesia authenticated deletes" ON storage.objects;

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

CREATE POLICY "ecclesia anon uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'ecclesia');

CREATE POLICY "ecclesia anon reads"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'ecclesia');

CREATE POLICY "ecclesia authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ecclesia');

CREATE POLICY "ecclesia authenticated reads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'ecclesia');

CREATE POLICY "ecclesia authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'ecclesia');

CREATE POLICY "ecclesia authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'ecclesia');
