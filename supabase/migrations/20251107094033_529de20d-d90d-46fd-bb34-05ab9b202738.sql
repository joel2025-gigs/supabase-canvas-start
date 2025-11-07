-- Fix profiles table RLS policy to prevent unauthorized access to customer data
DROP POLICY "Users can view all profiles" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins can view all profiles for customer management
CREATE POLICY "Admins can view all profiles" 
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));