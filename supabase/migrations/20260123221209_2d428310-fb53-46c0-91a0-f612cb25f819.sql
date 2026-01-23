-- Create job_postings table for career management
CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Full-time',
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  application_deadline DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Public can view active jobs that haven't expired
CREATE POLICY "Public can view active non-expired jobs"
ON public.job_postings
FOR SELECT
USING (is_active = true AND application_deadline >= CURRENT_DATE);

-- Staff can view all jobs
CREATE POLICY "Staff can view all jobs"
ON public.job_postings
FOR SELECT
USING (is_staff(auth.uid()));

-- Staff can manage jobs
CREATE POLICY "Staff can insert jobs"
ON public.job_postings
FOR INSERT
WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can update jobs"
ON public.job_postings
FOR UPDATE
USING (is_staff(auth.uid()));

CREATE POLICY "Admins can delete jobs"
ON public.job_postings
FOR DELETE
USING (is_admin(auth.uid()));

-- Trigger for updated_at using existing function
CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();