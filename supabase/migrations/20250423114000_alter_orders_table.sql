-- Migration file: supabase/migrations/YYYYMMDDHHMMSS_alter_orders_table.sql
-- Purpose: Update the orders table structure for Stripe integration and normalization.

-- Add columns if they don't exist
DO $$ 
BEGIN
    -- Add amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'amount'
    ) THEN
        ALTER TABLE orders ADD COLUMN amount numeric(10,0);
    END IF;

    -- Add currency column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE orders ADD COLUMN currency text DEFAULT 'usd';
    END IF;

    -- Add stripe_payment_intent_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'stripe_payment_intent_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN stripe_payment_intent_id text;
    END IF;

    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'orders_stripe_payment_intent_id_key'
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders
        ADD CONSTRAINT orders_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);
    END IF;
END $$;

-- Add any indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'orders'
        AND indexname = 'idx_orders_stripe_payment_intent_id'
    ) THEN
        CREATE INDEX idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);
    END IF;
END $$;

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
