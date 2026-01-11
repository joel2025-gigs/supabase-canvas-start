-- Fix function search_path for loan number and payment reference generators
CREATE OR REPLACE FUNCTION public.generate_loan_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.generate_payment_reference()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_ref TEXT;
BEGIN
  new_ref := 'PAY' || TO_CHAR(NOW(), 'YYMMDD') || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6));
  RETURN new_ref;
END;
$$;

-- Insert initial branch for testing
INSERT INTO public.branches (name, code, location, district)
VALUES ('Kampala Main', 'KLA001', 'Kampala Central', 'Kampala')
ON CONFLICT DO NOTHING;