-- Migration to refine the activities table (price to cents, add stripe_price_id)

-- Rename and convert price column to price_cents (INTEGER)
DO $$
BEGIN
    -- Check if the column exists and is not integer
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'price' AND data_type != 'integer'
    ) THEN
        -- Ensure no NULL values before converting if the column allows NULLs
        -- UPDATE public.activities SET price = 0 WHERE price IS NULL;
        ALTER TABLE public.activities ALTER COLUMN price TYPE INTEGER USING (price * 100)::INTEGER;
        ALTER TABLE public.activities RENAME COLUMN price TO price_cents;
    -- Check if the column is already integer but named 'price'
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'price' AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.activities RENAME COLUMN price TO price_cents;
    END IF;

    -- Add the positive price constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'activities_positive_price' AND conrelid = 'public.activities'::regclass
    ) THEN
         -- Ensure the column exists before adding constraint
         IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'price_cents') THEN
            ALTER TABLE public.activities ADD CONSTRAINT activities_positive_price CHECK (price_cents >= 0);
         END IF;
    END IF;
END $$;

-- Add stripe_price_id column if it doesn't exist
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS stripe_price_id text UNIQUE; -- Ensure uniqueness

-- Add comments
COMMENT ON COLUMN public.activities.price_cents IS 'Price of the activity in cents.';
COMMENT ON COLUMN public.activities.stripe_price_id IS 'Optional: Stripe Price ID for this activity.';

-- Remove participant_type column if it exists (should be in order_items metadata)
-- Check if the column exists before attempting to drop it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'participant_type') THEN
        ALTER TABLE public.activities DROP COLUMN participant_type;
    END IF;
END $$;

-- Refine activities table structure
ALTER TABLE activities
    -- Ensure price is in cents
    ALTER COLUMN price_cents SET NOT NULL,
    ADD CONSTRAINT positive_activity_price CHECK (price_cents > 0);

-- Add metadata columns
ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS max_participants INTEGER,
    ADD COLUMN IF NOT EXISTS available_dates DATERANGE[],
    ADD COLUMN IF NOT EXISTS stripe_product_id TEXT UNIQUE;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_activities_price ON activities(price_cents);
CREATE INDEX IF NOT EXISTS idx_activities_dates ON activities USING GIST (available_dates);

-- Add comments
COMMENT ON TABLE activities IS 'Available activities for booking';
COMMENT ON COLUMN activities.price_cents IS 'Price per person in cents';
COMMENT ON COLUMN activities.participant_type IS 'Who can participate (e.g., single, spouse, both)'; 