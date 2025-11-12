-- Create supply_orders table
CREATE TABLE IF NOT EXISTS supply_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  invoice_number VARCHAR(255),
  supply_date DATE NOT NULL,
  expected_payment_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'received', 'cancelled'
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supply_order_items table
CREATE TABLE IF NOT EXISTS supply_order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supply_order_id UUID REFERENCES supply_orders(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supplier_payments table
CREATE TABLE IF NOT EXISTS supplier_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL, -- 'cash', 'bank_transfer', 'cheque', 'upi'
  reference VARCHAR(255),
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supply_orders_supplier_id ON supply_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supply_orders_status ON supply_orders(status);
CREATE INDEX IF NOT EXISTS idx_supply_orders_supply_date ON supply_orders(supply_date);
CREATE INDEX IF NOT EXISTS idx_supply_order_items_supply_order_id ON supply_order_items(supply_order_id);
CREATE INDEX IF NOT EXISTS idx_supply_order_items_book_id ON supply_order_items(book_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_payment_date ON supplier_payments(payment_date);

-- Enable RLS on new tables
ALTER TABLE supply_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supply_orders
CREATE POLICY "Authenticated users can view supply orders" ON supply_orders
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create supply orders" ON supply_orders
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage supply orders" ON supply_orders
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- RLS Policies for supply_order_items
CREATE POLICY "Authenticated users can view supply order items" ON supply_order_items
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create supply order items" ON supply_order_items
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage supply order items" ON supply_order_items
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- RLS Policies for supplier_payments
CREATE POLICY "Authenticated users can view supplier payments" ON supplier_payments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create supplier payments" ON supplier_payments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage supplier payments" ON supplier_payments
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

