-- Step 1: Create department enum
CREATE TYPE public.department AS ENUM ('sales', 'credit_collection', 'recovery', 'operations');

-- Step 2: Add new role values to existing enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'credit_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'credit_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recovery_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recovery_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';

-- Step 3: Add department column to profiles for staff assignment
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department public.department;