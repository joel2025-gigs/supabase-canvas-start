-- Add GPS coordinates columns to clients table for customer location tracking
ALTER TABLE public.clients
ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL,
ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL;

-- Add index for spatial queries (if needed in the future)
CREATE INDEX idx_clients_coordinates ON public.clients (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN public.clients.latitude IS 'Customer location latitude for GPS tracking';
COMMENT ON COLUMN public.clients.longitude IS 'Customer location longitude for GPS tracking';