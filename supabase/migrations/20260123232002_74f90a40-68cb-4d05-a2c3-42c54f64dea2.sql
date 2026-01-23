-- Update helper functions for new role structure

-- Function to check if user is a department admin
CREATE OR REPLACE FUNCTION public.is_department_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('sales_admin', 'credit_admin', 'recovery_admin', 'operations_admin')
  )
$$;

-- Function to check if user is a department officer
CREATE OR REPLACE FUNCTION public.is_department_officer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('sales_officer', 'credit_officer', 'recovery_officer', 'operations_officer')
  )
$$;

-- Function to get user's department
CREATE OR REPLACE FUNCTION public.get_user_department(_user_id uuid)
RETURNS public.department
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department FROM public.profiles WHERE id = _user_id
$$;

-- Function to check if user can approve loans (only super_admin and credit_admin)
CREATE OR REPLACE FUNCTION public.can_approve_loans(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('super_admin', 'credit_admin')
  )
$$;

-- Update is_staff function to include new roles
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN (
      'super_admin', 'admin', 'accountant',
      'sales_admin', 'sales_officer',
      'credit_admin', 'credit_officer',
      'recovery_admin', 'recovery_officer',
      'operations_admin', 'operations_officer',
      'staff'
    )
  )
$$;

-- Update is_admin function (super_admin and admin only)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('super_admin', 'admin')
  )
$$;

-- Function to check if user can edit operations
CREATE OR REPLACE FUNCTION public.can_edit_operations(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('super_admin', 'admin', 'operations_admin')
  )
$$;

-- Function to check if user can view loans
CREATE OR REPLACE FUNCTION public.can_view_loans(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN (
      'super_admin', 'admin', 'accountant', 'operations_admin',
      'credit_admin', 'credit_officer', 'recovery_admin', 'recovery_officer'
    )
  )
$$;