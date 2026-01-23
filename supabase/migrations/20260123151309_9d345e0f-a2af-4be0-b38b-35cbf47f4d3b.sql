-- Create product status enum
CREATE TYPE public.product_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected');

-- Create products catalog table for public website
CREATE TABLE public.product_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL DEFAULT 'motorcycle',
  price NUMERIC NOT NULL,
  down_payment_percent NUMERIC NOT NULL DEFAULT 20,
  image_url TEXT,
  features TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  status public.product_status NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin (super_admin or admin)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- Create function to check if user is staff (field_officer or accountant)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('super_admin', 'admin', 'field_officer', 'accountant')
  )
$$;

-- RLS Policies for product_catalog

-- Public can view approved products only
CREATE POLICY "Public can view approved products"
ON public.product_catalog
FOR SELECT
TO anon, authenticated
USING (status = 'approved' AND deleted_at IS NULL);

-- Staff can view all non-deleted products
CREATE POLICY "Staff can view all products"
ON public.product_catalog
FOR SELECT
TO authenticated
USING (is_staff(auth.uid()) AND deleted_at IS NULL);

-- Staff can create products (defaults to draft)
CREATE POLICY "Staff can create products"
ON public.product_catalog
FOR INSERT
TO authenticated
WITH CHECK (is_staff(auth.uid()));

-- Staff can update their own draft products OR admins can update any
CREATE POLICY "Staff can update drafts or admins can update any"
ON public.product_catalog
FOR UPDATE
TO authenticated
USING (
  (is_admin(auth.uid())) OR 
  (is_staff(auth.uid()) AND created_by = auth.uid() AND status = 'draft')
);

-- Only admins can delete products (soft delete)
CREATE POLICY "Admins can delete products"
ON public.product_catalog
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Create audit log trigger for products
CREATE OR REPLACE FUNCTION public.handle_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_product_catalog_updated_at
BEFORE UPDATE ON public.product_catalog
FOR EACH ROW
EXECUTE FUNCTION public.handle_product_updated_at();

-- Add index for faster queries
CREATE INDEX idx_product_catalog_status ON public.product_catalog(status);
CREATE INDEX idx_product_catalog_created_by ON public.product_catalog(created_by);
CREATE INDEX idx_product_catalog_display_order ON public.product_catalog(display_order);

-- Insert seed data for existing motorcycles (as approved products)
INSERT INTO public.product_catalog (name, brand, model, asset_type, price, down_payment_percent, features, status, display_order)
VALUES 
  ('Bajaj Boxer', 'Bajaj', 'Boxer 150cc', 'motorcycle', 9000000, 20, ARRAY['Fuel efficient', 'Durable engine', 'Easy maintenance', '2-year warranty'], 'approved', 1),
  ('Bajaj CT', 'Bajaj', 'CT 150cc', 'motorcycle', 20000000, 20, ARRAY['Powerful performance', 'Digital display', 'Disc brakes', '2-year warranty'], 'approved', 2),
  ('Haojue Xpress', 'Haojue', 'Xpress 125cc', 'motorcycle', 6000000, 20, ARRAY['Compact design', 'Low fuel consumption', 'Reliable', '2-year warranty'], 'approved', 3),
  ('ZongZhen', 'ZongZhen', 'ZS150', 'motorcycle', 13000000, 20, ARRAY['Sporty design', 'High power', 'Comfortable ride', '2-year warranty'], 'approved', 4),
  ('Evakuga', 'Evakuga', 'EV200', 'motorcycle', 8000000, 20, ARRAY['Modern styling', 'Efficient engine', 'Low maintenance', '2-year warranty'], 'approved', 5),
  ('Haojue Xpress Plus', 'Haojue', 'Xpress Plus 150cc', 'motorcycle', 12500000, 20, ARRAY['Enhanced features', 'Better mileage', 'Premium build', '2-year warranty'], 'approved', 6),
  ('Haojue TR300', 'Haojue', 'TR300', 'motorcycle', 15000000, 20, ARRAY['Heavy duty', 'Long range', 'Commercial grade', '2-year warranty'], 'approved', 7);