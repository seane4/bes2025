-- Convert prices to cents in activities table
ALTER TABLE activities
ALTER COLUMN price TYPE INTEGER USING (price * 100)::INTEGER;

-- Add check constraints
ALTER TABLE activities ADD CONSTRAINT positive_price CHECK (price >= 0);

-- Rename columns for clarity
ALTER TABLE activities RENAME COLUMN price TO price_cents;

-- Remove the duplicate constraint if it exists
DO $$ 
BEGIN
    -- Check if constraint exists before trying to add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'positive_price' 
        AND table_name = 'order_items'
    ) THEN
        -- Only add if it doesn't exist
        ALTER TABLE order_items ADD CONSTRAINT positive_price CHECK (price >= 0);
    END IF;
END $$;

-- Add any other necessary price-related changes
ALTER TABLE order_items
    ALTER COLUMN price TYPE numeric(10,0),
    ALTER COLUMN total TYPE numeric(10,0);

-- Rename columns for clarity
ALTER TABLE order_items RENAME COLUMN price TO unit_price_cents;
ALTER TABLE order_items RENAME COLUMN total TO total_cents; 