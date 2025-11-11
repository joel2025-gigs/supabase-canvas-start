-- Create jobs table for career postings
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  requirements text,
  location text,
  employment_type text, -- full-time, part-time, contract
  salary_range text,
  published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Anyone can view published jobs
CREATE POLICY "Anyone can view published jobs"
ON public.jobs
FOR SELECT
USING (published = true OR has_role(auth.uid(), 'admin'));

-- Only admins can manage jobs
CREATE POLICY "Only admins can insert jobs"
ON public.jobs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update jobs"
ON public.jobs
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete jobs"
ON public.jobs
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();