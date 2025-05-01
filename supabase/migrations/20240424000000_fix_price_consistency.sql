-- First ensure all price columns are numeric and have constraints
DO $$ 
BEGIN
    -- Drop existing constraints if they exist to avoid conflicts
    ALTER TABLE activities DROP CONSTRAINT IF EXISTS positive_price;
    ALTER TABLE activities DROP CONSTRAINT IF EXISTS positive_price_cents;
    ALTER TABLE order_items DROP CONSTRAINT IF EXISTS positive_price;
    ALTER TABLE order_items DROP CONSTRAINT IF EXISTS positive_total;
    ALTER TABLE accommodations DROP CONSTRAINT IF EXISTS positive_price_per_night;
    ALTER TABLE sponsorships DROP CONSTRAINT IF EXISTS positive_sponsorship_price;
END $$;

-- Update activities table
ALTER TABLE activities 
    ALTER COLUMN price_cents TYPE numeric(10,0),
    ADD CONSTRAINT positive_price_cents CHECK (price_cents >= 0);

-- Update accommodations table
ALTER TABLE accommodations
    ALTER COLUMN price_per_night_cents TYPE numeric(10,0),
    ADD CONSTRAINT positive_price_per_night CHECK (price_per_night_cents >= 0);

-- Update sponsorships table
ALTER TABLE sponsorships
    ALTER COLUMN price_cents TYPE numeric(10,0),
    ADD CONSTRAINT positive_sponsorship_price CHECK (price_cents >= 0);

-- Update order_items table
ALTER TABLE order_items
    ALTER COLUMN price TYPE numeric(10,0),
    ALTER COLUMN total TYPE numeric(10,0),
    ADD CONSTRAINT positive_price CHECK (price >= 0),
    ADD CONSTRAINT positive_total CHECK (total >= 0); 