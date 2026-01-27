-- Add sale_type column to inquiries table
ALTER TABLE public.inquiries 
ADD COLUMN sale_type text DEFAULT 'loan' CHECK (sale_type IN ('cash', 'loan'));

-- Add comment for clarity
COMMENT ON COLUMN public.inquiries.sale_type IS 'Type of sale: cash (direct purchase) or loan (financing)';