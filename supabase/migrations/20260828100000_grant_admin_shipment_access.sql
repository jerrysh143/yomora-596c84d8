-- Table privileges are evaluated before RLS. Grant the authenticated role only
-- the operations used by the admin shipment workflow; the existing RLS policy
-- still limits every row to users verified by public.has_role(..., 'admin').
GRANT SELECT, INSERT, UPDATE ON TABLE public.order_shipments TO authenticated;

REVOKE ALL ON TABLE public.order_shipments FROM anon;
