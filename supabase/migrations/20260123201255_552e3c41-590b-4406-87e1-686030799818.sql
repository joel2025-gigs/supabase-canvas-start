-- Add new loan workflow statuses to support the disbursement process
-- Workflow: pending → under_review (Credit) → awaiting_asset (Operations) → awaiting_approval (Credit) → active

ALTER TYPE public.loan_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.loan_status ADD VALUE IF NOT EXISTS 'awaiting_asset';
ALTER TYPE public.loan_status ADD VALUE IF NOT EXISTS 'awaiting_approval';