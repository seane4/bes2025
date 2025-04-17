-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  shirt_size VARCHAR(10) NOT NULL,
  height VARCHAR(20), -- Added height for primary customer
  weight INTEGER,     -- Added weight for primary customer
  spouse_name VARCHAR(255),
  spouse_shirt_size VARCHAR(10),
  spouse_height VARCHAR(20), -- Added height for spouse (optional)
  spouse_weight INTEGER,     -- Added weight for spouse (optional)
  additional_guest_name VARCHAR(255),
  additional_guest_shirt_size VARCHAR(10),
  special_requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(100) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL, -- 'activity' or 'accommodation'
  item_id VARCHAR(100), -- Reference to the activity or accommodation
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create activities table for reference data
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  price DECIMAL(10, 2) NOT NULL,
  capacity INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  active BOOLEAN DEFAULT true, -- Added active column
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create accommodations table for reference data
CREATE TABLE accommodations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_type VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  price_per_night DECIMAL(10, 2) NOT NULL,
  capacity INTEGER NOT NULL,
  availability INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment_logs table for auditing and debugging
CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(100),
  transaction_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indices for performance
CREATE INDEX idx_customers_email ON customers (email);
CREATE INDEX idx_orders_order_id ON orders (order_id);
CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_payment_logs_order_id ON payment_logs (order_id);
CREATE INDEX idx_payment_logs_transaction_id ON payment_logs (transaction_id);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Create trigger functions for updating timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER set_timestamp_customers
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_orders
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_order_items
BEFORE UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_activities
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_accommodations
BEFORE UPDATE ON accommodations
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Create policies for access control

-- Admin can do everything
CREATE POLICY admin_all_access ON customers 
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_all_access ON orders 
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_all_access ON order_items 
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Activities and accommodations can be read by anyone
CREATE POLICY read_activities ON activities
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY read_accommodations ON accommodations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anonymous users to create orders and customer records (for checkout)
CREATE POLICY create_customers ON customers
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY create_orders ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY create_order_items ON order_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY create_payment_logs ON payment_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create a secure schema for admin functions
CREATE SCHEMA IF NOT EXISTS admin;

-- Create a function to get order details including customer and items
CREATE OR REPLACE FUNCTION admin.get_order_details(order_id_param TEXT)
RETURNS JSONB AS $$
DECLARE
  order_data JSONB;
BEGIN
  SELECT 
    jsonb_build_object(
      'order', jsonb_build_object(
        'id', o.id,
        'order_id', o.order_id,
        'subtotal', o.subtotal,
        'tax', o.tax,
        'total', o.total,
        'payment_method', o.payment_method,
        'transaction_id', o.transaction_id,
        'status', o.status,
        'created_at', o.created_at
      ),
      'customer', jsonb_build_object(
        'id', c.id,
        'email', c.email,
        'name', c.name,
        'phone', c.phone,
        'address_line1', c.address_line1,
        'address_line2', c.address_line2,
        'city', c.city,
        'state', c.state,
        'postal_code', c.postal_code,
        'country', c.country,
        'shirt_size', c.shirt_size,
        'height', c.height, -- Added height
        'weight', c.weight, -- Added weight
        'spouse_name', c.spouse_name,
        'spouse_shirt_size', c.spouse_shirt_size,
        'spouse_height', c.spouse_height, -- Added spouse_height
        'spouse_weight', c.spouse_weight, -- Added spouse_weight
        'additional_guest_name', c.additional_guest_name,
        'additional_guest_shirt_size', c.additional_guest_shirt_size,
        'special_requirements', c.special_requirements
      ),
      'items', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'item_type', oi.item_type,
            'item_id', oi.item_id,
            'item_name', oi.item_name,
            'quantity', oi.quantity,
            'price', oi.price,
            'total', oi.total
          )
        )
        FROM order_items oi
        WHERE oi.order_id = o.id
      )
    ) INTO order_data
  FROM orders o
  JOIN customers c ON o.customer_id = c.id
  WHERE o.order_id = order_id_param;
  
  RETURN order_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 