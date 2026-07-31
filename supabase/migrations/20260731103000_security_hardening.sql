BEGIN;

-- The current storefront does not create database orders. Keep order writes
-- admin-only until a verified server-side checkout and payment webhook exist.
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
REVOKE INSERT ON public.orders FROM anon;

-- Restock alerts remain public, but direct table inserts make it too easy to
-- bypass validation and flood the database. Route them through one validated,
-- rate-limited function that only the server's service role can call.
ALTER TABLE public.product_notify_requests
  ADD COLUMN IF NOT EXISTS request_fingerprint text;

CREATE INDEX IF NOT EXISTS product_notify_requests_rate_limit_idx
  ON public.product_notify_requests (request_fingerprint, created_at DESC);

DROP POLICY IF EXISTS "Anyone can request a restock alert"
  ON public.product_notify_requests;
REVOKE INSERT ON public.product_notify_requests FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_product_notify_request(
  _product_id text,
  _name text,
  _email text,
  _phone text,
  _request_fingerprint text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_name text := NULLIF(btrim(_name), '');
  normalized_email text := NULLIF(lower(btrim(_email)), '');
  normalized_phone text := NULLIF(btrim(_phone), '');
BEGIN
  IF _product_id IS NULL OR _product_id !~ '^[a-z0-9-]{1,80}$' THEN
    RAISE EXCEPTION 'Invalid product';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = _product_id) THEN
    RAISE EXCEPTION 'Invalid product';
  END IF;

  IF normalized_name IS NOT NULL AND length(normalized_name) > 120 THEN
    RAISE EXCEPTION 'Name is too long';
  END IF;

  IF normalized_email IS NOT NULL AND (
    length(normalized_email) > 200
    OR normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  ) THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;

  IF normalized_phone IS NOT NULL AND (
    length(normalized_phone) < 6
    OR length(normalized_phone) > 30
    OR normalized_phone !~ '^[0-9+()[:space:]-]+$'
  ) THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;

  IF normalized_email IS NULL AND normalized_phone IS NULL THEN
    RAISE EXCEPTION 'Enter an email or phone number';
  END IF;

  IF _request_fingerprint IS NULL OR _request_fingerprint !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid request';
  END IF;

  -- Serialize requests from one fingerprint so parallel submissions cannot
  -- race past the rate-limit check.
  PERFORM pg_advisory_xact_lock(hashtextextended(_request_fingerprint, 0));

  IF (
    SELECT count(*)
    FROM public.product_notify_requests
    WHERE request_fingerprint = _request_fingerprint
      AND created_at > now() - interval '1 hour'
  ) >= 5 THEN
    RAISE EXCEPTION 'Too many requests. Please try again later.';
  END IF;

  -- Treat an identical request as successful without storing duplicate PII.
  IF EXISTS (
    SELECT 1
    FROM public.product_notify_requests
    WHERE product_id = _product_id
      AND created_at > now() - interval '24 hours'
      AND coalesce(lower(email), '') = coalesce(normalized_email, '')
      AND coalesce(phone, '') = coalesce(normalized_phone, '')
  ) THEN
    RETURN true;
  END IF;

  INSERT INTO public.product_notify_requests (
    product_id,
    name,
    email,
    phone,
    notified,
    request_fingerprint
  ) VALUES (
    _product_id,
    normalized_name,
    normalized_email,
    normalized_phone,
    false,
    _request_fingerprint
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.create_product_notify_request(text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_product_notify_request(text, text, text, text, text)
  TO service_role;

COMMIT;
