-- Create order_items table with proper structure
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    product_type TEXT NOT NULL, -- 'activity', 'accommodation', 'sponsorship'
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    metadata JSONB, -- Store additional details like participant_type, dates, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_order_item_total CHECK (total_cents = unit_price_cents * quantity)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id, product_type);

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE order_items IS 'Individual items within an order';
COMMENT ON COLUMN order_items.metadata IS 'Additional item-specific details (JSON)'; 