BEGIN;

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (char_length(comment) BETWEEN 3 AND 2000),
  media_urls text[] NOT NULL DEFAULT '{}',
  verified_purchase boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_reviews_one_per_order UNIQUE (order_id, product_id, user_id),
  CONSTRAINT product_reviews_media_limit CHECK (cardinality(media_urls) <= 5)
);

CREATE INDEX IF NOT EXISTS product_reviews_product_idx
  ON public.product_reviews (product_id, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS product_reviews_user_idx
  ON public.product_reviews (user_id, created_at DESC);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.product_reviews TO anon, authenticated;
GRANT ALL ON public.product_reviews TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.product_reviews FROM anon, authenticated;

DROP POLICY IF EXISTS "Published reviews are public" ON public.product_reviews;
CREATE POLICY "Published reviews are public" ON public.product_reviews
  FOR SELECT TO anon, authenticated
  USING (is_published);

DROP POLICY IF EXISTS "Customers read their reviews" ON public.product_reviews;
CREATE POLICY "Customers read their reviews" ON public.product_reviews
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage reviews" ON public.product_reviews;
CREATE POLICY "Admins manage reviews" ON public.product_reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS product_reviews_set_updated_at ON public.product_reviews;
CREATE TRIGGER product_reviews_set_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-media',
  'review-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read review media" ON storage.objects;
CREATE POLICY "Public read review media" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'review-media');

DROP POLICY IF EXISTS "Users upload their review media" ON storage.objects;
CREATE POLICY "Users upload their review media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'review-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete their review media" ON storage.objects;
CREATE POLICY "Users delete their review media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'review-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMIT;
