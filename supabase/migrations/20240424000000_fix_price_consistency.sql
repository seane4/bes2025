-- First migration should alter tables to ensure price columns are numeric
ALTER TABLE activities 
    ALTER COLUMN price_cents TYPE numeric(10,0),
    ADD CONSTRAINT positive_price_cents CHECK (price_cents >= 0);

ALTER TABLE accommodations
    ALTER COLUMN price_per_night_cents TYPE numeric(10,0),
    ADD CONSTRAINT positive_price_per_night CHECK (price_per_night_cents >= 0);

ALTER TABLE sponsorships
    ALTER COLUMN price_cents TYPE numeric(10,0),
    ADD CONSTRAINT positive_sponsorship_price CHECK (price_cents >= 0);

-- Convert all prices to cents (INTEGER)
ALTER TABLE order_items
ALTER COLUMN price TYPE INTEGER USING (price * 100)::INTEGER,
ALTER COLUMN total TYPE INTEGER USING (total * 100)::INTEGER;

-- Add check constraints to ensure positive prices
ALTER TABLE order_items
ADD CONSTRAINT positive_price CHECK (price >= 0),
ADD CONSTRAINT positive_total CHECK (total >= 0); 