-- Migration file: supabase/migrations/YYYYMMDDHHMMSS_alter_orders_table.sql
-- Purpose: Update the orders table structure for Stripe integration and normalization.

-- Add new columns required for Stripe integration and revised structure
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS amount INTEGER, -- Total amount in cents
ADD COLUMN IF NOT EXISTS currency VARCHAR(3), -- Currency code (e.g., 'usd')
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255); -- Link to Stripe Payment Intent

-- Add a unique constraint to stripe_payment_intent_id if desired (recommended)
-- Note: This might fail if you have duplicate NULLs and your Postgres version doesn't support NULLS NOT DISTINCT
-- Consider adding this constraint after ensuring initial data population or handling potential errors.
-- ALTER TABLE public.orders
-- ADD CONSTRAINT orders_stripe_payment_intent_id_unique UNIQUE NULLS NOT DISTINCT (stripe_payment_intent_id);
-- Simpler unique constraint (allows multiple NULLs):
ALTER TABLE public.orders
ADD CONSTRAINT orders_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);


-- Add index for the new stripe_payment_intent_id column
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON public.orders (stripe_payment_intent_id);

-- Drop old/redundant columns
-- Check if columns exist before dropping to make the script idempotent
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_id') THEN
        ALTER TABLE public.orders DROP COLUMN order_id;
    END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'subtotal') THEN
        ALTER TABLE public.orders DROP COLUMN subtotal;
    END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total') THEN
        ALTER TABLE public.orders DROP COLUMN total;
    END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_met') THEN -- Assuming 'payment_met' was the column name from your image
        ALTER TABLE public.orders DROP COLUMN payment_met;
    END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'transaction_id') THEN
        ALTER TABLE public.orders DROP COLUMN transaction_id;
    END IF;
    -- Add checks for any other columns you intend to remove (like 'tax' if it existed)
END $$;

-- Drop the index associated with the old order_id column if it exists
DROP INDEX IF EXISTS idx_orders_order_id;

-- Update comments for clarity (Optional but recommended)
COMMENT ON COLUMN public.orders.amount IS 'Total order amount in the smallest currency unit (e.g., cents). Set by webhook.';
COMMENT ON COLUMN public.orders.currency IS 'ISO currency code (e.g., usd). Set by webhook.';
COMMENT ON COLUMN public.orders.stripe_payment_intent_id IS 'Unique identifier for the payment intent from Stripe. Set by webhook.';
COMMENT ON COLUMN public.orders.customer_id IS 'Foreign key referencing the customer who placed the order.';
