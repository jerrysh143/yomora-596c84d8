BEGIN;

-- Keep anonymous product-page reads independent from admin-only functions.
-- Separate policies are combined by PostgreSQL without asking anonymous users
-- to execute public.has_role().
DROP POLICY IF EXISTS "Published reviews are public" ON public.product_reviews;
CREATE POLICY "Published reviews are public" ON public.product_reviews
  FOR SELECT TO anon, authenticated
  USING (is_published);

DROP POLICY IF EXISTS "Customers read their reviews" ON public.product_reviews;
CREATE POLICY "Customers read their reviews" ON public.product_reviews
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

COMMIT;
