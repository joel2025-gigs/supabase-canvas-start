-- Add asset_id column to clients table to link clients to assets
ALTER TABLE public.clients 
ADD COLUMN asset_id uuid REFERENCES public.assets(id);

-- Create index for faster lookups
CREATE INDEX idx_clients_asset_id ON public.clients(asset_id);

-- Create a function to auto-create a pending loan when a client is linked to an asset
CREATE OR REPLACE FUNCTION public.auto_create_loan_for_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  asset_price NUMERIC;
  loan_num TEXT;
  new_loan_id UUID;
BEGIN
  -- Only trigger if asset_id is set and this is an insert or asset_id changed
  IF NEW.asset_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.asset_id IS DISTINCT FROM NEW.asset_id) THEN
    -- Get the asset selling price
    SELECT selling_price INTO asset_price FROM assets WHERE id = NEW.asset_id;
    
    -- Generate loan number
    SELECT generate_loan_number() INTO loan_num;
    
    -- Create a pending loan with initial values
    INSERT INTO loans (
      loan_number,
      client_id,
      asset_id,
      branch_id,
      principal_amount,
      interest_rate,
      total_amount,
      down_payment,
      loan_balance,
      repayment_frequency,
      installment_amount,
      total_installments,
      start_date,
      end_date,
      status,
      created_by
    ) VALUES (
      loan_num,
      NEW.id,
      NEW.asset_id,
      NEW.branch_id,
      asset_price,
      30.00, -- Default 30% interest
      asset_price * 1.30, -- Principal + 30% interest
      0,
      asset_price * 1.30,
      'daily',
      0, -- To be updated later
      0, -- To be updated later
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 year', -- Default 1 year end date
      'pending',
      NEW.registered_by
    ) RETURNING id INTO new_loan_id;
    
    -- Update asset status to assigned
    UPDATE assets SET status = 'assigned' WHERE id = NEW.asset_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto loan creation
DROP TRIGGER IF EXISTS trigger_auto_create_loan ON clients;
CREATE TRIGGER trigger_auto_create_loan
  AFTER INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_loan_for_client();