-- Fix admin account exposure vulnerability
-- Replace overly permissive policy with restricted access

DROP POLICY IF EXISTS "Anyone can view user roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));