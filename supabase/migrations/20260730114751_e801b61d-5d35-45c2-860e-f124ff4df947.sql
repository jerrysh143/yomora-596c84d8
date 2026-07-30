DROP POLICY IF EXISTS "Anyone can request a restock alert" ON public.product_notify_requests;

CREATE POLICY "Anyone can request a restock alert"
ON public.product_notify_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  notified = false
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id)
  AND (
    (email IS NOT NULL AND length(btrim(email)) BETWEEN 5 AND 200 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
    OR (phone IS NOT NULL AND length(btrim(phone)) BETWEEN 6 AND 30 AND phone ~ '^[0-9+()\-\s]+$')
  )
  AND (name IS NULL OR length(name) <= 120)
  AND (email IS NULL OR length(email) <= 200)
  AND (phone IS NULL OR length(phone) <= 30)
);