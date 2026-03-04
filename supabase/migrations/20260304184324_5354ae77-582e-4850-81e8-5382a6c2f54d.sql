
-- =============================================
-- Fix ALL RLS policies: RESTRICTIVE -> PERMISSIVE
-- and ensure WITH CHECK clauses exist
-- =============================================

-- ========== WAREHOUSES ==========
DROP POLICY IF EXISTS "Owner can view all warehouses" ON public.warehouses;
CREATE POLICY "Owner can view all warehouses"
ON public.warehouses FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can view their own warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Admins can manage their own warehouses" ON public.warehouses;
CREATE POLICY "Admins can manage their own warehouses"
ON public.warehouses FOR ALL TO authenticated
USING ((admin_id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role) AND (NOT is_admin_blocked(auth.uid())))
WITH CHECK ((admin_id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role) AND (NOT is_admin_blocked(auth.uid())));

-- ========== TENANTS ==========
DROP POLICY IF EXISTS "Owner can view all tenants" ON public.tenants;
CREATE POLICY "Owner can view all tenants"
ON public.tenants FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can view their tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can manage their tenants" ON public.tenants;
CREATE POLICY "Admins can manage their tenants"
ON public.tenants FOR ALL TO authenticated
USING ((admin_id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role) AND (NOT is_admin_blocked(auth.uid())))
WITH CHECK ((admin_id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role) AND (NOT is_admin_blocked(auth.uid())));

-- ========== PAYMENTS ==========
DROP POLICY IF EXISTS "Owner can view all payments" ON public.payments;
CREATE POLICY "Owner can view all payments"
ON public.payments FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can view payments for their tenants" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage payments for their tenants" ON public.payments;
CREATE POLICY "Admins can manage payments for their tenants"
ON public.payments FOR ALL TO authenticated
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

-- ========== NOTIFICATIONS ==========
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK ((auth.uid() IS NOT NULL) AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

-- ========== PROFILES ==========
DROP POLICY IF EXISTS "Owner can view all profiles" ON public.profiles;
CREATE POLICY "Owner can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- ========== USER_ROLES ==========
DROP POLICY IF EXISTS "Owner can manage all roles" ON public.user_roles;
CREATE POLICY "Owner can manage all roles"
ON public.user_roles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- ========== ADMIN_STATUS ==========
DROP POLICY IF EXISTS "Owner can manage admin status" ON public.admin_status;
CREATE POLICY "Owner can manage admin status"
ON public.admin_status FOR ALL TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

DROP POLICY IF EXISTS "Admins can view their own status" ON public.admin_status;
CREATE POLICY "Admins can view their own status"
ON public.admin_status FOR SELECT TO authenticated
USING (admin_id = auth.uid());
