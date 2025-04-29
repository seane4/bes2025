-- Check and convert prices to cents safely
DO $$ 
BEGIN
    -- Check if 'price' column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'price'
    ) THEN
        -- Convert and rename if 'price' exists
        ALTER TABLE activities 
            ALTER COLUMN price TYPE INTEGER USING (price * 100)::INTEGER;
        
        ALTER TABLE activities 
            RENAME COLUMN price TO price_cents;
    END IF;

    -- Check if price_cents exists but needs conversion
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'price_cents'
    ) THEN
        -- Update existing prices if they look like they're in dollars
        UPDATE activities
        SET price_cents = CASE 
            WHEN price_cents < 1000 THEN price_cents * 100  -- Convert if looks like dollars
            ELSE price_cents  -- Leave alone if already in cents
        END
        WHERE price_cents IS NOT NULL;

        -- Add constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.constraint_column_usage
            WHERE table_name = 'activities' AND constraint_name = 'positive_price'
        ) THEN
            ALTER TABLE activities
                ADD CONSTRAINT positive_price CHECK (price_cents >= 0);
        END IF;
    END IF;

    -- Verify all activities have valid prices
    IF EXISTS (
        SELECT 1 
        FROM activities 
        WHERE price_cents IS NULL OR price_cents < 0
    ) THEN
        RAISE EXCEPTION 'Invalid prices found in activities table';
    END IF;
END $$; 