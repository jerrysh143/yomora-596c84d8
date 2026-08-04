CREATE TABLE public.customer_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_type text NOT NULL CHECK (inquiry_type IN ('contact','custom_jewellery','newsletter')),
  name text,
  email text NOT NULL,
  phone text,
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','handled')),
  request_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_inquiries_created_at_idx ON public.customer_inquiries(created_at DESC);
CREATE INDEX customer_inquiries_email_idx ON public.customer_inquiries(lower(email));
ALTER TABLE public.customer_inquiries ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE, DELETE ON public.customer_inquiries TO authenticated;
GRANT ALL ON public.customer_inquiries TO service_role;

CREATE POLICY "Admins manage customer inquiries" ON public.customer_inquiries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
