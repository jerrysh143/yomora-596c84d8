CREATE TABLE IF NOT EXISTS public.order_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method text NOT NULL DEFAULT 'PREPAID' CHECK (payment_method IN ('COD', 'PREPAID')),
  address_line text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  pincode text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending_sync',
  sub_status text,
  velocity_order_id text,
  shipment_id text UNIQUE,
  awb_code text UNIQUE,
  carrier_id text,
  carrier_name text,
  tracking_url text,
  label_url text,
  estimated_delivery_date timestamptz,
  delivered_at timestamptz,
  tracking_activities jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_error text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_shipments_awb_idx ON public.order_shipments(awb_code);
CREATE INDEX IF NOT EXISTS order_shipments_status_idx ON public.order_shipments(status);

DROP TRIGGER IF EXISTS order_shipments_set_updated_at ON public.order_shipments;
CREATE TRIGGER order_shipments_set_updated_at
  BEFORE UPDATE ON public.order_shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.order_shipments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.velocity_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  shipment_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL
);

ALTER TABLE public.velocity_webhook_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.order_shipments IS 'Velocity shipment state kept separate from customer orders so shipping failures never corrupt checkout data.';
COMMENT ON TABLE public.velocity_webhook_events IS 'Idempotency ledger for verified Velocity webhook deliveries.';
