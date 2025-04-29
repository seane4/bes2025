-- Add foreign key constraints and ensure consistent price tracking
DO $$
BEGIN
    -- Add foreign keys if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_order_items_order'
    ) THEN
        ALTER TABLE order_items
            ADD CONSTRAINT fk_order_items_order
            FOREIGN KEY (order_id) REFERENCES orders(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_hotel_bookings_order'
    ) THEN
        ALTER TABLE hotel_bookings
            ADD CONSTRAINT fk_hotel_bookings_order
            FOREIGN KEY (order_id) REFERENCES orders(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_hotel_bookings_order_item'
    ) THEN
        ALTER TABLE hotel_bookings
            ADD CONSTRAINT fk_hotel_bookings_order_item
            FOREIGN KEY (order_item_id) REFERENCES order_items(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_hotel_bookings_accommodation'
    ) THEN
        ALTER TABLE hotel_bookings
            ADD CONSTRAINT fk_hotel_bookings_accommodation
            FOREIGN KEY (accommodation_id) REFERENCES accommodations(id);
    END IF;

    -- Add price consistency check
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_booking_prices'
    ) THEN
        ALTER TABLE hotel_bookings
            ADD CONSTRAINT valid_booking_prices 
            CHECK (total_price_cents = price_per_night_cents * number_of_nights);
    END IF;

    -- Add status enum type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'booking_status'
    ) THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
        
        -- Add status column with default
        ALTER TABLE hotel_bookings
            ADD COLUMN IF NOT EXISTS status booking_status NOT NULL DEFAULT 'pending';
    END IF;
END $$;

-- Add helpful comments
COMMENT ON CONSTRAINT fk_hotel_bookings_order ON hotel_bookings IS 'Links booking to order';
COMMENT ON CONSTRAINT fk_hotel_bookings_accommodation ON hotel_bookings IS 'Links booking to accommodation type';
COMMENT ON CONSTRAINT valid_booking_prices ON hotel_bookings IS 'Ensures total price matches per-night price times number of nights'; 