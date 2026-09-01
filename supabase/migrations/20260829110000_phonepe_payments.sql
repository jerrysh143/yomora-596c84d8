CREATE TABLE IF NOT EXISTS public.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'phonepe' CHECK (provider IN ('phonepe')),
  merchant_order_id text NOT NULL UNIQUE,
  provider_order_id text,
  transaction_id text,
  amount integer NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_mode text,
  error_code text,
  provider_response jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_payments_status_idx ON public.order_payments(status);

DROP TRIGGER IF EXISTS order_payments_set_updated_at ON public.order_payments;
CREATE TRIGGER order_payments_set_updated_at
  BEFORE UPDATE ON public.order_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.order_payments FROM anon, authenticated;
GRANT ALL ON TABLE public.order_payments TO service_role;

COMMENT ON TABLE public.order_payments IS 'Server-managed PhonePe payment state. Never writable from the browser.';
