CREATE TABLE public.subscription_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Zero Making Charges',
  tagline text NOT NULL DEFAULT 'Enjoy zero making charges on every piece',
  price integer NOT NULL DEFAULT 2500,
  duration_label text NOT NULL DEFAULT 'per year',
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_label text NOT NULL DEFAULT 'Subscribe Now',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscription_plan TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_plan TO authenticated;
GRANT ALL ON public.subscription_plan TO service_role;

ALTER TABLE public.subscription_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plan is viewable by everyone" ON public.subscription_plan
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert plan" ON public.subscription_plan
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update plan" ON public.subscription_plan
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete plan" ON public.subscription_plan
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_subscription_plan_updated_at
  BEFORE UPDATE ON public.subscription_plan
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.subscription_plan (name, tagline, price, duration_label, benefits, cta_label, is_active)
VALUES (
  'YOMORA Privilege',
  'Zero making charges on every piece, for a whole year',
  2500,
  'per year',
  '["Zero making charges on all 925 silver products","Priority access to new arrivals","Complimentary polish & cleaning","Free PAN India shipping","Exclusive member-only offers"]'::jsonb,
  'Subscribe Now',
  true
);
