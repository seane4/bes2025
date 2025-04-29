-- Migration to link hotel_bookings table to the consolidated order_items table

-- Add the new foreign key column referencing order_items
-- Ensure order_items table exists before adding the constraint
ALTER TABLE public.hotel_bookings
ADD COLUMN IF NOT EXISTS order_item_id uuid;

-- Add the foreign key constraint separately after ensuring the column exists
-- This might fail if order_items doesn't exist yet, ensure migration order
ALTER TABLE public.hotel_bookings
ADD CONSTRAINT hotel_bookings_order_item_id_fkey
FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;

-- Add an index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_order_item_id ON public.hotel_bookings(order_item_id);

-- Make the original order_id column nullable, as the primary link is now order_item_id
-- We keep it for potential historical data or easier querying directly from orders if needed.
ALTER TABLE public.hotel_bookings
ALTER COLUMN order_id DROP NOT NULL;

-- Add comments
COMMENT ON COLUMN public.hotel_bookings.order_item_id IS 'References the specific order item this hotel booking corresponds to.';
COMMENT ON COLUMN public.hotel_bookings.order_id IS 'DEPRECATED: References the order this booking belongs to. Use order_item_id for primary link.';

-- Note: You might need to populate the order_item_id for existing hotel_bookings
-- if you have data from before this change. This would require a more complex script
-- to find the corresponding order_item based on the order_id and product details.

-- Create hotel_bookings table with proper structure
CREATE TABLE IF NOT EXISTS hotel_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    order_item_id UUID, -- Allow NULL initially for migration
    accommodation_id UUID NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_nights INTEGER NOT NULL,
    number_of_guests INTEGER NOT NULL,
    price_per_night_cents INTEGER NOT NULL,
    total_price_cents INTEGER NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create booking_status enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
    END IF;
END$$;

-- Add date validation
ALTER TABLE hotel_bookings
    ADD CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
    ADD CONSTRAINT valid_nights CHECK (
        number_of_nights = 
        EXTRACT(DAY FROM check_out_date::timestamp - check_in_date::timestamp)
    ),
    ADD CONSTRAINT valid_booking_prices 
    CHECK (total_price_cents = price_per_night_cents * number_of_nights);

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON hotel_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Add helpful comments
COMMENT ON TABLE hotel_bookings IS 'Records of hotel room bookings';
COMMENT ON COLUMN hotel_bookings.order_item_id IS 'References the specific order item this hotel booking corresponds to';
COMMENT ON COLUMN hotel_bookings.price_per_night_cents IS 'Price per night in cents at time of booking';
COMMENT ON COLUMN hotel_bookings.total_price_cents IS 'Total price for entire stay in cents'; 