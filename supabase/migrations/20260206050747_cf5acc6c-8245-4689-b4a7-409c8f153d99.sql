-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create a more restrictive INSERT policy (owner and admin can create notifications)
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);