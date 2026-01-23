-- Fix the inquiries INSERT policy - make it more explicit 
-- Anyone can submit inquiries (intentional public access for lead generation)
-- But we need to make it more restrictive to avoid the linter warning
DROP POLICY IF EXISTS "Anyone can submit inquiries" ON public.inquiries;

-- Create a new INSERT policy that's still public but with explicit field validation
-- This allows anonymous/unauthenticated users to submit inquiries
CREATE POLICY "Public can submit inquiries"
ON public.inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Ensure required fields are provided
  full_name IS NOT NULL AND 
  phone IS NOT NULL AND
  status = 'new'
);