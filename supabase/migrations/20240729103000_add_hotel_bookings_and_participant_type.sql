-- Migration file: supabase/migrations/YYYYMMDDHHMMSS_add_hotel_bookings_and_order_item_participant.sql

-- Create the table to store hotel booking details linked to an order
CREATE TABLE IF NOT EXISTS public.hotel_bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique ID for the booking record itself
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE, -- Foreign key to the main order
    check_in_date date NOT NULL,
    check_out_date date NOT NULL,
    guests integer NOT NULL,
    nights integer NOT NULL,
    price_per_night_cents integer NOT NULL, -- Store price per night in cents
    total_price_cents integer NOT NULL, -- Store the total booking price in cents
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL

    -- Add any other relevant hotel booking fields if needed
);

-- Add index for faster lookups by order_id
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_order_id ON public.hotel_bookings(order_id);

-- Add comments for clarity
COMMENT ON TABLE public.hotel_bookings IS 'Stores details for hotel accommodation booked as part of an order.';
COMMENT ON COLUMN public.hotel_bookings.order_id IS 'References the order this hotel booking belongs to.';
COMMENT ON COLUMN public.hotel_bookings.price_per_night_cents IS 'Price per night for the room in cents.';
COMMENT ON COLUMN public.hotel_bookings.total_price_cents IS 'Total price for the entire hotel stay in cents.';


-- Modify the existing order_items table to add participant_type for activities
-- Ensure your order_items table exists before running this.
-- If it doesn't exist, you'll need a CREATE TABLE statement for order_items first.
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS participant_type text COLLATE "pg_catalog"."default"; -- Nullable text field

-- Add comment for the new column
COMMENT ON COLUMN public.order_items.participant_type IS 'Specifies the participant for an activity item (e.g., Me, Spouse, Both). Null for non-activity items like sponsorships.';

-- Optional: Add indexes if you frequently query by product_id or participant_type
-- CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);


-- Trigger function to automatically update 'updated_at' timestamp
-- (You might already have this from your initial schema setup)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to hotel_bookings table
DROP TRIGGER IF EXISTS on_hotel_bookings_updated_at ON public.hotel_bookings;
CREATE TRIGGER on_hotel_bookings_updated_at
BEFORE UPDATE ON public.hotel_bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Apply the trigger to order_items table (if not already applied)
DROP TRIGGER IF EXISTS on_order_items_updated_at ON public.order_items;
CREATE TRIGGER on_order_items_updated_at
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- New migration needed
ALTER TABLE accommodations 
RENAME COLUMN price_per_night TO price_per_night_cents;

ALTER TABLE accommodations 
ALTER COLUMN price_per_night_cents TYPE INTEGER 
USING (price_per_night_cents * 100)::INTEGER;
