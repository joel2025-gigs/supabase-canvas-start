-- Fix 1: Update handle_updated_at function to set search_path (fixes function_search_path_mutable)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix 2: Add DELETE policy for credit_applications (fixes missing RLS)
CREATE POLICY "Only admins can delete applications"
ON public.credit_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Fix 3: Create contact_messages table (fixes contact form issue)
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'unread',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit contact messages
CREATE POLICY "Anyone can submit messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Only admins can view contact messages
CREATE POLICY "Only admins can view messages"
ON public.contact_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can update message status
CREATE POLICY "Only admins can update messages"
ON public.contact_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete messages
CREATE POLICY "Only admins can delete messages"
ON public.contact_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at on contact_messages
CREATE TRIGGER update_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();