ALTER TABLE public.order_payments
  DROP CONSTRAINT IF EXISTS order_payments_provider_check;

ALTER TABLE public.order_payments
  ADD CONSTRAINT order_payments_provider_check
  CHECK (provider IN ('phonepe', 'manual_phonepe'));

ALTER TABLE public.order_payments
  DROP CONSTRAINT IF EXISTS order_payments_status_check;

ALTER TABLE public.order_payments
  ADD CONSTRAINT order_payments_status_check
  CHECK (status IN ('pending', 'proof_submitted', 'completed', 'failed', 'cancelled', 'rejected'));

ALTER TABLE public.order_payments
  ADD COLUMN IF NOT EXISTS verification_code text,
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS order_payments_verification_code_idx
  ON public.order_payments(verification_code)
  WHERE verification_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('payment_submitted', 'payment_received', 'payment_rejected', 'order_accepted', 'order_update')),
  title text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_notifications_user_created_idx
  ON public.customer_notifications(user_id, created_at DESC);

ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.customer_notifications FROM anon;
GRANT SELECT, UPDATE ON TABLE public.customer_notifications TO authenticated;
GRANT ALL ON TABLE public.customer_notifications TO service_role;

DROP POLICY IF EXISTS "Customers can read their notifications" ON public.customer_notifications;
CREATE POLICY "Customers can read their notifications"
  ON public.customer_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can mark their notifications read" ON public.customer_notifications;
CREATE POLICY "Customers can mark their notifications read"
  ON public.customer_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.customer_notifications IS 'In-app notifications created by trusted server workflows.';
