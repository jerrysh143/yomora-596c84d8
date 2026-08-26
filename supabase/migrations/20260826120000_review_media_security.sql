BEGIN;

-- Review media must pass the server-side completed-order and file validation
-- checks in /api/review-media. Prevent authenticated clients from bypassing it
-- by writing directly to Storage with the public Supabase key.
DROP POLICY IF EXISTS "Users upload their review media" ON storage.objects;
DROP POLICY IF EXISTS "Users delete their review media" ON storage.objects;

-- A smaller bucket-level ceiling limits damage if a future upload path forgets
-- its own check. Videos remain supported up to 50 MB.
UPDATE storage.buckets
SET file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime'
    ]
WHERE id = 'review-media';

COMMIT;
