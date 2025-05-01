-- Drop the redundant order_items table if it exists
DROP TABLE IF EXISTS order_items;

-- Create the consolidated order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('activity', 'accommodation', 'sponsorship')),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  line_item_total_cents INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id); 