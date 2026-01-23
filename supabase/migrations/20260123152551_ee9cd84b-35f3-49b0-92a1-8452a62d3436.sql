-- Create inquiries table for lead capture
CREATE TABLE public.inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  district TEXT,
  occupation TEXT,
  product_interest TEXT,
  monthly_income TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  followed_up_at TIMESTAMP WITH TIME ZONE,
  followed_up_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Public can submit inquiries (insert only)
CREATE POLICY "Anyone can submit inquiries"
ON public.inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Staff can view and manage all inquiries
CREATE POLICY "Staff can view all inquiries"
ON public.inquiries
FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

-- Staff can update inquiries
CREATE POLICY "Staff can update inquiries"
ON public.inquiries
FOR UPDATE
TO authenticated
USING (is_staff(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_inquiries_created_at ON public.inquiries(created_at DESC);