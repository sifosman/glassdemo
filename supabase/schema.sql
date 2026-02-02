-- Create customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  subtotal DECIMAL(10,2) NOT NULL,
  surcharge DECIMAL(10,2) DEFAULT 0,
  glazing_certificate_fee DECIMAL(10,2) NOT NULL DEFAULT 368.49,
  vat DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' -- pending, accepted, rejected, expired
);

-- Create quote_items table
CREATE TABLE quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  width_mm INTEGER NOT NULL,
  height_mm INTEGER NOT NULL,
  type TEXT NOT NULL, -- window, door
  glass_type TEXT NOT NULL,
  frame_color TEXT NOT NULL,
  area_m2 DECIMAL(8,4) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_quotes_reference_number ON quotes(reference_number);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_customers_email ON customers(email);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Create policies for customers table
CREATE POLICY "Customers can view their own data" ON customers
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own customer data" ON customers
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own customer data" ON customers
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for quotes table
CREATE POLICY "Users can view quotes for their customers" ON quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = quotes.customer_id 
      AND auth.uid()::text = customers.id::text
    )
  );

CREATE POLICY "Users can insert quotes for their customers" ON quotes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = quotes.customer_id 
      AND auth.uid()::text = customers.id::text
    )
  );

-- Create policies for quote_items table
CREATE POLICY "Users can view quote items for their quotes" ON quote_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = quote_items.quote_id
      AND EXISTS (
        SELECT 1 FROM customers 
        WHERE customers.id = quotes.customer_id 
        AND auth.uid()::text = customers.id::text
      )
    )
  );

CREATE POLICY "Users can insert quote items for their quotes" ON quote_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = quote_items.quote_id
      AND EXISTS (
        SELECT 1 FROM customers 
        WHERE customers.id = quotes.customer_id 
        AND auth.uid()::text = customers.id::text
      )
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for customers table
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
