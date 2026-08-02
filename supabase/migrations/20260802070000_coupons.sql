CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  minimum_order integer NOT NULL DEFAULT 0 CHECK (minimum_order >= 0),
  maximum_discount integer CHECK (maximum_discount IS NULL OR maximum_discount > 0),
  member_only boolean NOT NULL DEFAULT false,
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  per_customer_limit integer NOT NULL DEFAULT 1 CHECK (per_customer_limit > 0),
  times_used integer NOT NULL DEFAULT 0 CHECK (times_used >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_percentage_value CHECK (
    discount_type <> 'percentage' OR discount_value <= 100
  )
);

CREATE UNIQUE INDEX coupons_code_upper_idx ON public.coupons (upper(code));

ALTER TABLE public.orders
  ADD COLUMN subtotal integer NOT NULL DEFAULT 0,
  ADD COLUMN discount_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN coupon_code text;

UPDATE public.orders
SET subtotal = total
WHERE subtotal = 0;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_discount_amount_nonnegative CHECK (discount_amount >= 0),
  ADD CONSTRAINT orders_subtotal_nonnegative CHECK (subtotal >= 0);

CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  discount_amount integer NOT NULL CHECK (discount_amount > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX coupon_redemptions_coupon_idx ON public.coupon_redemptions(coupon_id);
CREATE INDEX coupon_redemptions_customer_idx ON public.coupon_redemptions(coupon_id, lower(customer_email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
GRANT SELECT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view coupon redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER coupons_set_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Applies a coupon and records its use in one transaction. This function is
-- service-role only so customers cannot forge totals or redemption counters.
CREATE OR REPLACE FUNCTION public.redeem_coupon_for_order(
  _order_id uuid,
  _coupon_code text,
  _user_id uuid DEFAULT NULL
)
RETURNS TABLE(total integer, discount_amount integer, coupon_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_coupon public.coupons%ROWTYPE;
  selected_order public.orders%ROWTYPE;
  calculated_discount integer;
  customer_uses integer;
  active_member boolean;
BEGIN
  SELECT * INTO selected_order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  SELECT * INTO selected_coupon
  FROM public.coupons
  WHERE upper(code) = upper(trim(_coupon_code))
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid coupon code'; END IF;
  IF NOT selected_coupon.is_active THEN RAISE EXCEPTION 'This coupon is inactive'; END IF;
  IF selected_coupon.starts_at IS NOT NULL AND selected_coupon.starts_at > now() THEN
    RAISE EXCEPTION 'This coupon is not active yet';
  END IF;
  IF selected_coupon.expires_at IS NOT NULL AND selected_coupon.expires_at < now() THEN
    RAISE EXCEPTION 'This coupon has expired';
  END IF;
  IF selected_coupon.usage_limit IS NOT NULL AND selected_coupon.times_used >= selected_coupon.usage_limit THEN
    RAISE EXCEPTION 'This coupon has reached its usage limit';
  END IF;
  IF selected_order.subtotal < selected_coupon.minimum_order THEN
    RAISE EXCEPTION 'Minimum order amount for this coupon is %', selected_coupon.minimum_order;
  END IF;

  IF selected_coupon.member_only THEN
    IF _user_id IS NULL THEN RAISE EXCEPTION 'Sign in to use this membership coupon'; END IF;
    SELECT EXISTS (
      SELECT 1 FROM public.memberships
      WHERE user_id = _user_id
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at >= now())
    ) INTO active_member;
    IF NOT active_member THEN RAISE EXCEPTION 'An active membership is required for this coupon'; END IF;
  END IF;

  SELECT count(*) INTO customer_uses
  FROM public.coupon_redemptions
  WHERE coupon_id = selected_coupon.id
    AND (
      (_user_id IS NOT NULL AND user_id = _user_id)
      OR lower(customer_email) = lower(selected_order.customer_email)
    );
  IF customer_uses >= selected_coupon.per_customer_limit THEN
    RAISE EXCEPTION 'You have already used this coupon';
  END IF;

  IF selected_coupon.discount_type = 'percentage' THEN
    calculated_discount := floor(selected_order.subtotal * selected_coupon.discount_value / 100.0);
    IF selected_coupon.maximum_discount IS NOT NULL THEN
      calculated_discount := least(calculated_discount, selected_coupon.maximum_discount);
    END IF;
  ELSE
    calculated_discount := selected_coupon.discount_value;
  END IF;
  calculated_discount := least(calculated_discount, selected_order.subtotal);
  IF calculated_discount <= 0 THEN RAISE EXCEPTION 'This coupon does not apply to this order'; END IF;

  UPDATE public.orders
  SET total = selected_order.subtotal - calculated_discount,
      discount_amount = calculated_discount,
      coupon_code = upper(selected_coupon.code)
  WHERE id = selected_order.id;

  INSERT INTO public.coupon_redemptions (
    coupon_id, order_id, user_id, customer_email, discount_amount
  ) VALUES (
    selected_coupon.id, selected_order.id, _user_id,
    lower(selected_order.customer_email), calculated_discount
  );

  UPDATE public.coupons
  SET times_used = times_used + 1
  WHERE id = selected_coupon.id;

  RETURN QUERY SELECT
    selected_order.subtotal - calculated_discount,
    calculated_discount,
    upper(selected_coupon.code);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_coupon_for_order(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon_for_order(uuid, text, uuid) TO service_role;
