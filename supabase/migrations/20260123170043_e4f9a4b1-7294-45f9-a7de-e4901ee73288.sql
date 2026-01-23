-- Add loan-related fields to product_catalog
ALTER TABLE public.product_catalog
ADD COLUMN IF NOT EXISTS loan_duration_months integer DEFAULT 18,
ADD COLUMN IF NOT EXISTS interest_rate numeric DEFAULT 30.00;

-- Add comments for documentation
COMMENT ON COLUMN public.product_catalog.loan_duration_months IS 'Loan duration in months for financing calculation';
COMMENT ON COLUMN public.product_catalog.interest_rate IS 'Interest rate percentage for loan calculation';