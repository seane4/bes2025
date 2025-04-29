-- First ensure the set_updated_at function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'set_updated_at' 
        AND pronamespace = 'public'::regnamespace
    ) THEN
        CREATE OR REPLACE FUNCTION public.set_updated_at()
        RETURNS TRIGGER AS $BODY$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $BODY$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Migration to create and refine the accommodations table
DO $$
BEGIN
    -- Create accommodations table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'accommodations'
    ) THEN
        CREATE TABLE public.accommodations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            price_per_night_cents INTEGER NOT NULL CHECK (price_per_night_cents >= 0),
            room_type TEXT NOT NULL,
            max_guests INTEGER NOT NULL DEFAULT 2,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            active BOOLEAN NOT NULL DEFAULT true,
            image_url TEXT
        );

        -- Add comment
        COMMENT ON TABLE public.accommodations IS 'Hotel room accommodations available for booking';

        -- Create updated_at trigger (function already exists from utility migration)
        CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.accommodations
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at();

        -- Insert initial room types
        INSERT INTO public.accommodations (
            name,
            description,
            price_per_night_cents,
            room_type,
            max_guests
        ) VALUES 
        (
            'Standard Room',
            'Elegant room with mountain views, featuring either one king or two queen beds.',
            80000, -- $800.00
            'Standard',
            2
        ),
        (
            'Deluxe Room',
            'Spacious room with premium views and upgraded amenities.',
            100000, -- $1,000.00
            'Deluxe',
            2
        ),
        (
            'Junior Suite',
            'Luxurious suite with separate living area and premium amenities.',
            120000, -- $1,200.00
            'Junior Suite',
            3
        ),
        (
            'Executive Suite',
            'Our finest accommodation with panoramic views and full luxury amenities.',
            150000, -- $1,500.00
            'Executive',
            4
        );
    ELSE
        -- If table exists, check if we need to convert price_per_night to cents
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'accommodations' 
            AND column_name = 'price_per_night'
        ) THEN
            -- Convert price_per_night to cents (separate statements)
            ALTER TABLE public.accommodations 
                ALTER COLUMN price_per_night TYPE INTEGER USING (price_per_night * 100)::INTEGER;
            
            ALTER TABLE public.accommodations 
                RENAME COLUMN price_per_night TO price_per_night_cents;
        END IF;

        -- Add constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'accommodations_positive_price'
        ) THEN
            ALTER TABLE public.accommodations 
                ADD CONSTRAINT accommodations_positive_price 
                CHECK (price_per_night_cents >= 0);
        END IF;
    END IF;

    -- Ensure the updated_at trigger exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_updated_at' 
        AND tgrelid = 'public.accommodations'::regclass
    ) THEN
        CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.accommodations
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

-- Add stripe_price_id column if it doesn't exist (Recommended)
ALTER TABLE public.accommodations
ADD COLUMN IF NOT EXISTS stripe_price_id text UNIQUE; -- Ensure uniqueness

-- Add comments
COMMENT ON COLUMN public.accommodations.price_per_night_cents IS 'Price per night for the room in cents.';
COMMENT ON COLUMN public.accommodations.stripe_price_id IS 'Optional: Stripe Price ID for this accommodation type.';

-- Update accommodations table to ensure price consistency
ALTER TABLE public.accommodations
    ALTER COLUMN price_per_night_cents SET NOT NULL,
    ADD CONSTRAINT positive_price CHECK (price_per_night_cents > 0);

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_accommodations_room_type ON public.accommodations(room_type);
CREATE INDEX IF NOT EXISTS idx_accommodations_price ON public.accommodations(price_per_night_cents);

-- Add metadata columns if needed
ALTER TABLE public.accommodations
    ADD COLUMN IF NOT EXISTS max_occupancy INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS amenities TEXT[],
    ADD COLUMN IF NOT EXISTS stripe_product_id TEXT UNIQUE; 