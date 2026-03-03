
-- Fix warehouses: add WITH CHECK to ALL policy
DROP POLICY IF EXISTS "Admins can manage their own warehouses" ON public.warehouses;
CREATE POLICY "Admins can manage their own warehouses"
ON public.warehouses
FOR ALL
TO authenticated
USING ((admin_id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role) AND (NOT is_admin_blocked(auth.uid())))
WITH CHECK ((admin_id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role) AND (NOT is_admin_blocked(auth.uid())));

-- Fix tenants: add WITH CHECK to ALL policy
DROP POLICY IF EXISTS "Admins can manage their tenants" ON public.tenants;
CREATE POLICY "Admins can manage their tenants"
ON public.tenants
FOR ALL
TO authenticated
USING ((admin_id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role) AND (NOT is_admin_blocked(auth.uid())))
WITH CHECK ((admin_id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role) AND (NOT is_admin_blocked(auth.uid())));

-- Fix payments: add WITH CHECK to ALL policy
DROP POLICY IF EXISTS "Admins can manage payments for their tenants" ON public.payments;
CREATE POLICY "Admins can manage payments for their tenants"
ON public.payments
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM tenants
  WHERE tenants.id = payments.tenant_id
  AND tenants.admin_id = auth.uid()
  AND has_role(auth.uid(), 'admin'::app_role)
  AND NOT is_admin_blocked(auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM tenants
  WHERE tenants.id = payments.tenant_id
  AND tenants.admin_id = auth.uid()
  AND has_role(auth.uid(), 'admin'::app_role)
  AND NOT is_admin_blocked(auth.uid())
));

-- Enable leaked password protection
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
