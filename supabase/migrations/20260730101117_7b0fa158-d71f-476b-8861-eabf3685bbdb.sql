ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sold_out boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.product_notify_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  name text,
  email text,
  phone text,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.product_notify_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_notify_requests TO authenticated;
GRANT ALL ON public.product_notify_requests TO service_role;

ALTER TABLE public.product_notify_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request a restock alert"
  ON public.product_notify_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view restock alerts"
  ON public.product_notify_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update restock alerts"
  ON public.product_notify_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete restock alerts"
  ON public.product_notify_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_product_notify_requests_updated_at
  BEFORE UPDATE ON public.product_notify_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();