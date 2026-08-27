-- Table privileges are evaluated before RLS. Grant the authenticated role only
-- the operations used by the admin shipment workflow; the existing RLS policy
-- still limits every row to users verified by public.has_role(..., 'admin').
REVOKE ALL ON TABLE public.order_shipments FROM authenticated;
REVOKE ALL ON TABLE public.order_shipments FROM anon;

GRANT SELECT, INSERT, UPDATE ON TABLE public.order_shipments TO authenticated;
