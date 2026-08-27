-- Shipment records stay private. Only authenticated users whose role is
-- independently verified as admin may read or modify them from the admin UI.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_shipments'
      AND policyname = 'Admins can manage order shipments'
  ) THEN
    CREATE POLICY "Admins can manage order shipments"
      ON public.order_shipments
      FOR ALL
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;
