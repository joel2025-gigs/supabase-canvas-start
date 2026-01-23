-- Fix audit_logs INSERT policy - restrict to authenticated staff only
-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create a new INSERT policy that restricts to authenticated staff members
-- Audit logs should only be created by staff members or via triggers
CREATE POLICY "Staff can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (is_staff(auth.uid()));