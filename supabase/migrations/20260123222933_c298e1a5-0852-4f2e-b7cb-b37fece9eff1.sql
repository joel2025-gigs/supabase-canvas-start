-- Add asset_category column to distinguish Fixed Assets from Inventory
ALTER TABLE public.assets
ADD COLUMN asset_category text NOT NULL DEFAULT 'inventory';

-- Add a comment for clarity
COMMENT ON COLUMN public.assets.asset_category IS 'Category: inventory (motorcycles/tricycles for sale) or fixed_asset (office equipment, vehicles, furniture)';