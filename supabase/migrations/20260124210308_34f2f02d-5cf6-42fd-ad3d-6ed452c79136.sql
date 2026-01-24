-- Create department_officers table to track officers by department
CREATE TABLE public.department_officers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department public.department NOT NULL,
  phone TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, department)
);

-- Create department_performance table for tracking performance metrics
CREATE TABLE public.department_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department public.department NOT NULL,
  officer_id UUID REFERENCES public.department_officers(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  -- Sales metrics
  cash_sales_count INTEGER DEFAULT 0,
  loan_sales_count INTEGER DEFAULT 0,
  total_sales_amount NUMERIC DEFAULT 0,
  -- Credit metrics
  amount_disbursed NUMERIC DEFAULT 0,
  collection_rate NUMERIC DEFAULT 0,
  default_rate NUMERIC DEFAULT 0,
  -- Recovery metrics
  at_risk_loans_count INTEGER DEFAULT 0,
  total_recovered_amount NUMERIC DEFAULT 0,
  recovery_rate NUMERIC DEFAULT 0,
  -- Targets
  target_value NUMERIC DEFAULT 0,
  actual_value NUMERIC DEFAULT 0,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create department_targets table for setting weekly/monthly targets
CREATE TABLE public.department_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department public.department NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'weekly', -- weekly, monthly
  target_value NUMERIC NOT NULL DEFAULT 0,
  max_officers INTEGER DEFAULT 10,
  per_officer_target NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(department, target_type)
);

-- Enable RLS
ALTER TABLE public.department_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_targets ENABLE ROW LEVEL SECURITY;

-- RLS policies for department_officers
CREATE POLICY "Staff can view department officers"
  ON public.department_officers FOR SELECT
  USING (is_staff(auth.uid()));

CREATE POLICY "Department admins can manage officers"
  ON public.department_officers FOR ALL
  USING (
    is_admin(auth.uid()) OR
    (is_department_admin(auth.uid()) AND department = get_user_department(auth.uid()))
  );

-- RLS policies for department_performance
CREATE POLICY "Staff can view department performance"
  ON public.department_performance FOR SELECT
  USING (is_staff(auth.uid()));

CREATE POLICY "Department admins can manage performance"
  ON public.department_performance FOR ALL
  USING (
    is_admin(auth.uid()) OR
    (is_department_admin(auth.uid()) AND department = get_user_department(auth.uid()))
  );

-- RLS policies for department_targets
CREATE POLICY "Staff can view department targets"
  ON public.department_targets FOR SELECT
  USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage department targets"
  ON public.department_targets FOR ALL
  USING (is_admin(auth.uid()));

-- Insert default targets
INSERT INTO public.department_targets (department, target_type, target_value, max_officers, per_officer_target)
VALUES 
  ('sales', 'weekly', 100, 4, 25),
  ('credit_collection', 'weekly', 75, 4, 18),
  ('recovery', 'weekly', 95, 4, 24);

-- Add updated_at trigger
CREATE TRIGGER update_department_officers_updated_at
  BEFORE UPDATE ON public.department_officers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_department_performance_updated_at
  BEFORE UPDATE ON public.department_performance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_department_targets_updated_at
  BEFORE UPDATE ON public.department_targets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();