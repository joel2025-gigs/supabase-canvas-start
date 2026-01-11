-- Drop existing tables to start fresh (soft approach - only if exists)
DROP TABLE IF EXISTS public.installments CASCADE;
DROP TABLE IF EXISTS public.installment_plans CASCADE;
DROP TABLE IF EXISTS public.credit_applications CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Drop existing user management (keep auth structure)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.application_status CASCADE;
DROP TYPE IF EXISTS public.payment_type CASCADE;

-- =============================================
-- NAWAP ASSET FINANCING SYSTEM - COMPLETE SCHEMA
-- =============================================

-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'field_officer', 'accountant', 'client');
CREATE TYPE public.loan_status AS ENUM ('pending', 'approved', 'active', 'completed', 'defaulted', 'recovered');
CREATE TYPE public.payment_status AS ENUM ('pending', 'confirmed', 'rejected', 'reconciled');
CREATE TYPE public.payment_method AS ENUM ('mtn_momo', 'airtel_money', 'bank_transfer', 'cash');
CREATE TYPE public.asset_status AS ENUM ('available', 'assigned', 'recovered', 'transferred', 'maintenance');
CREATE TYPE public.repayment_frequency AS ENUM ('daily', 'weekly');
CREATE TYPE public.sync_status AS ENUM ('pending', 'synced', 'conflict');

-- =============================================
-- BRANCHES TABLE
-- =============================================
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  location TEXT,
  district TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES TABLE (Extended for NAWAP)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  national_id TEXT,
  address TEXT,
  district TEXT,
  avatar_url TEXT,
  branch_id UUID REFERENCES public.branches(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER ROLES TABLE (Separate for security)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CLIENTS TABLE (Borrowers - separate from auth users)
-- =============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Optional link to auth
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_secondary TEXT,
  national_id TEXT,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  village TEXT,
  next_of_kin_name TEXT,
  next_of_kin_phone TEXT,
  occupation TEXT,
  monthly_income NUMERIC(12,2),
  photo_url TEXT,
  id_photo_url TEXT,
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  registered_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ, -- Soft delete
  sync_status sync_status DEFAULT 'synced',
  local_id TEXT -- For offline-first support
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ASSETS TABLE (Motorcycles & Tricycles)
-- =============================================
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('motorcycle', 'tricycle')),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  chassis_number TEXT UNIQUE NOT NULL,
  engine_number TEXT,
  registration_number TEXT,
  color TEXT,
  purchase_price NUMERIC(12,2) NOT NULL,
  selling_price NUMERIC(12,2) NOT NULL,
  status asset_status DEFAULT 'available',
  gps_device_id TEXT,
  gps_status TEXT DEFAULT 'not_installed',
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  photo_urls TEXT[],
  notes TEXT,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ, -- Soft delete
  sync_status sync_status DEFAULT 'synced',
  local_id TEXT
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- =============================================
-- LOANS TABLE
-- =============================================
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_number TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  asset_id UUID NOT NULL REFERENCES public.assets(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  
  -- Loan terms
  principal_amount NUMERIC(12,2) NOT NULL, -- Asset selling price
  interest_rate NUMERIC(5,2) DEFAULT 30.00, -- Fixed 30%
  total_amount NUMERIC(12,2) NOT NULL, -- Principal + Interest
  down_payment NUMERIC(12,2) DEFAULT 0,
  loan_balance NUMERIC(12,2) NOT NULL, -- Remaining balance
  
  -- Repayment structure
  repayment_frequency repayment_frequency NOT NULL,
  installment_amount NUMERIC(12,2) NOT NULL, -- Per period amount
  total_installments INTEGER NOT NULL,
  installments_paid INTEGER DEFAULT 0,
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  next_payment_date DATE,
  last_payment_date DATE,
  
  -- Status tracking
  status loan_status DEFAULT 'pending',
  missed_payments INTEGER DEFAULT 0,
  consecutive_missed INTEGER DEFAULT 0,
  penalty_amount NUMERIC(12,2) DEFAULT 0,
  
  -- Approval workflow
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Recovery
  recovery_initiated_at TIMESTAMPTZ,
  recovery_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  sync_status sync_status DEFAULT 'synced',
  local_id TEXT
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- =============================================
-- REPAYMENT SCHEDULE TABLE
-- =============================================
CREATE TABLE public.repayment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id),
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount_due NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  penalty_amount NUMERIC(12,2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  is_overdue BOOLEAN DEFAULT false,
  days_overdue INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(loan_id, installment_number)
);

ALTER TABLE public.repayment_schedule ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference TEXT UNIQUE NOT NULL,
  loan_id UUID NOT NULL REFERENCES public.loans(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  amount NUMERIC(12,2) NOT NULL,
  payment_method payment_method NOT NULL,
  transaction_id TEXT, -- External reference (MoMo, Bank)
  phone_number TEXT, -- For mobile money
  
  status payment_status DEFAULT 'pending',
  received_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users(id),
  
  -- Reconciliation
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES auth.users(id),
  reconciliation_notes TEXT,
  
  -- For manual overrides
  is_manual_override BOOLEAN DEFAULT false,
  override_reason TEXT,
  
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  received_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  sync_status sync_status DEFAULT 'synced',
  local_id TEXT
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  branch_id UUID REFERENCES public.branches(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- OFFLINE SYNC QUEUE TABLE
-- =============================================
CREATE TABLE public.sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  local_id TEXT NOT NULL,
  record_data JSONB NOT NULL,
  synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- Get user's branch
CREATE OR REPLACE FUNCTION public.get_user_branch(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.profiles WHERE id = _user_id
$$;

-- =============================================
-- AUTO-UPDATE TIMESTAMPS TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to all tables
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_repayment_schedule_updated_at BEFORE UPDATE ON public.repayment_schedule FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- NEW USER HANDLER
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email
  );
  
  -- Default role is client
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- LOAN NUMBER GENERATOR
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_loan_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  year_part TEXT;
  seq_part INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(loan_number FROM 5) AS INTEGER)), 0) + 1
  INTO seq_part
  FROM public.loans
  WHERE loan_number LIKE 'NWP' || year_part || '%';
  
  new_number := 'NWP' || year_part || LPAD(seq_part::TEXT, 6, '0');
  RETURN new_number;
END;
$$;

-- =============================================
-- PAYMENT REFERENCE GENERATOR
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_payment_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_ref TEXT;
BEGIN
  new_ref := 'PAY' || TO_CHAR(NOW(), 'YYMMDD') || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6));
  RETURN new_ref;
END;
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- BRANCHES: Super admins can do all, others can view
CREATE POLICY "Super admins manage branches" ON public.branches
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));
  
CREATE POLICY "Staff can view active branches" ON public.branches
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- PROFILES: Users see own, admins see branch, super admins see all
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins view branch profiles" ON public.profiles
  FOR SELECT USING (
    has_any_role(auth.uid(), ARRAY['super_admin', 'admin']::app_role[]) 
    AND (
      has_role(auth.uid(), 'super_admin') 
      OR branch_id = get_user_branch(auth.uid())
    )
  );

-- USER ROLES: Only super admins can manage
CREATE POLICY "Super admins manage roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- CLIENTS: Branch-scoped access
CREATE POLICY "Field officers manage branch clients" ON public.clients
  FOR ALL USING (
    has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'field_officer']::app_role[])
    AND (
      has_role(auth.uid(), 'super_admin')
      OR branch_id = get_user_branch(auth.uid())
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Accountants view branch clients" ON public.clients
  FOR SELECT USING (
    has_role(auth.uid(), 'accountant')
    AND branch_id = get_user_branch(auth.uid())
    AND deleted_at IS NULL
  );

-- ASSETS: Branch-scoped access
CREATE POLICY "Staff manage branch assets" ON public.assets
  FOR ALL USING (
    has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'field_officer']::app_role[])
    AND (
      has_role(auth.uid(), 'super_admin')
      OR branch_id = get_user_branch(auth.uid())
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Accountants view branch assets" ON public.assets
  FOR SELECT USING (
    has_role(auth.uid(), 'accountant')
    AND branch_id = get_user_branch(auth.uid())
    AND deleted_at IS NULL
  );

-- LOANS: Branch-scoped, clients see own
CREATE POLICY "Staff manage branch loans" ON public.loans
  FOR ALL USING (
    has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'field_officer']::app_role[])
    AND (
      has_role(auth.uid(), 'super_admin')
      OR branch_id = get_user_branch(auth.uid())
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Accountants view branch loans" ON public.loans
  FOR SELECT USING (
    has_role(auth.uid(), 'accountant')
    AND branch_id = get_user_branch(auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Clients view own loans" ON public.loans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = loans.client_id
      AND c.user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- REPAYMENT SCHEDULE: Via loan access
CREATE POLICY "Staff view branch schedules" ON public.repayment_schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.id = repayment_schedule.loan_id
      AND (
        has_role(auth.uid(), 'super_admin')
        OR l.branch_id = get_user_branch(auth.uid())
      )
    )
  );

CREATE POLICY "Clients view own schedule" ON public.repayment_schedule
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loans l
      JOIN public.clients c ON c.id = l.client_id
      WHERE l.id = repayment_schedule.loan_id
      AND c.user_id = auth.uid()
    )
  );

-- PAYMENTS: Branch-scoped
CREATE POLICY "Staff manage branch payments" ON public.payments
  FOR ALL USING (
    has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'field_officer', 'accountant']::app_role[])
    AND (
      has_role(auth.uid(), 'super_admin')
      OR branch_id = get_user_branch(auth.uid())
    )
  );

CREATE POLICY "Clients view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = payments.client_id
      AND c.user_id = auth.uid()
    )
  );

-- AUDIT LOGS: Super admins and accountants
CREATE POLICY "Admins view audit logs" ON public.audit_logs
  FOR SELECT USING (
    has_any_role(auth.uid(), ARRAY['super_admin', 'admin', 'accountant']::app_role[])
    AND (
      has_role(auth.uid(), 'super_admin')
      OR branch_id = get_user_branch(auth.uid())
    )
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- SYNC QUEUE: Users manage own
CREATE POLICY "Users manage own sync queue" ON public.sync_queue
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_clients_branch ON public.clients(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_phone ON public.clients(phone);
CREATE INDEX idx_assets_branch ON public.assets(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_status ON public.assets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_loans_client ON public.loans(client_id);
CREATE INDEX idx_loans_branch ON public.loans(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_loans_status ON public.loans(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_repayment_schedule_loan ON public.repayment_schedule(loan_id);
CREATE INDEX idx_repayment_schedule_due_date ON public.repayment_schedule(due_date) WHERE is_paid = false;
CREATE INDEX idx_payments_loan ON public.payments(loan_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_sync_queue_user ON public.sync_queue(user_id) WHERE synced = false;