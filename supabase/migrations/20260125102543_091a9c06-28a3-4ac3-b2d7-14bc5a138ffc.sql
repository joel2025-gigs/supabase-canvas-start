-- Make user_id nullable for department_officers since officers are added by phone first
-- and linked to auth.users later when they sign in with OTP
ALTER TABLE public.department_officers ALTER COLUMN user_id DROP NOT NULL;