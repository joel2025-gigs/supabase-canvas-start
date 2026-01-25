-- ===========================================
-- CRITICAL SECURITY FIX: Block anonymous access to all sensitive tables
-- ===========================================

-- 1. Block anonymous access to profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. Block anonymous access to clients  
CREATE POLICY "Deny anonymous access to clients"
ON public.clients FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. Block anonymous SELECT to inquiries (INSERT is intentionally public)
CREATE POLICY "Deny anonymous read to inquiries"
ON public.inquiries FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4. Block anonymous access to loans
CREATE POLICY "Deny anonymous access to loans"
ON public.loans FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 5. Block anonymous access to payments
CREATE POLICY "Deny anonymous access to payments"
ON public.payments FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 6. Block anonymous access to repayment_schedule
CREATE POLICY "Deny anonymous access to repayment_schedule"
ON public.repayment_schedule FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 7. Block anonymous access to assets
CREATE POLICY "Deny anonymous access to assets"
ON public.assets FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 8. Block anonymous access to audit_logs
CREATE POLICY "Deny anonymous access to audit_logs"
ON public.audit_logs FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 9. Block anonymous access to sync_queue
CREATE POLICY "Deny anonymous access to sync_queue"
ON public.sync_queue FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 10. Block anonymous access to department_officers
CREATE POLICY "Deny anonymous access to department_officers"
ON public.department_officers FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 11. Block anonymous access to department_performance
CREATE POLICY "Deny anonymous access to department_performance"
ON public.department_performance FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 12. Block anonymous access to department_targets
CREATE POLICY "Deny anonymous access to department_targets"
ON public.department_targets FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 13. Block anonymous access to user_roles
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles FOR SELECT
USING (auth.uid() IS NOT NULL);