# Supabase Database Schema
## Glass Quote Bot Database Design

---

## Overview

The database is designed to support:
- Customer management
- Product/glass type catalog with SANS compliance rules
- Quote generation and tracking
- Invoice and payment management
- Conversation history for AI context
- Reminder scheduling

---

## Schema Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   customers     │────<│     quotes      │────<│  quote_items    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               │
                        ┌──────┴──────┐
                        │             │
                        ▼             ▼
               ┌─────────────┐  ┌─────────────┐
               │  invoices   │  │  payments   │
               └─────────────┘  └─────────────┘

┌─────────────────┐     ┌─────────────────┐
│    products     │     │ conversations   │
│  (glass types)  │     │   (AI context)  │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│   reminders     │     │  company_config │
└─────────────────┘     └─────────────────┘
```

---

## Complete SQL Schema

```sql
-- ============================================
-- GLASS QUOTE BOT DATABASE SCHEMA
-- Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255),
    address TEXT,
    suburb VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Johannesburg',
    province VARCHAR(50) DEFAULT 'Gauteng',
    postal_code VARCHAR(10),
    
    -- WhatsApp specific
    whatsapp_name VARCHAR(255),
    whatsapp_profile_pic TEXT,
    
    -- Preferences
    preferred_contact VARCHAR(20) DEFAULT 'whatsapp', -- whatsapp, email, phone
    language VARCHAR(10) DEFAULT 'en',
    
    -- Stats
    total_quotes INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_contact_at TIMESTAMPTZ,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================
-- 2. PRODUCTS (GLASS TYPES) TABLE
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- float, toughened, laminated, double_glazed, mirror
    
    -- Specifications
    thickness_mm DECIMAL(5, 2) NOT NULL, -- 4, 5, 6, 8, 10, 12 etc
    glass_type VARCHAR(50), -- clear, tinted, frosted, patterned, low-e
    tint_color VARCHAR(50), -- bronze, grey, green, blue (if tinted)
    
    -- Pricing (per square meter)
    price_per_sqm DECIMAL(10, 2) NOT NULL,
    min_charge DECIMAL(10, 2) DEFAULT 0, -- Minimum charge per piece
    
    -- SANS Compliance
    is_safety_glass BOOLEAN DEFAULT FALSE,
    sans_approved_for JSONB DEFAULT '[]'::JSONB, -- ["shower", "door", "balustrade", "low_level"]
    
    -- Availability
    in_stock BOOLEAN DEFAULT TRUE,
    lead_time_days INTEGER DEFAULT 5,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_safety ON products(is_safety_glass);

-- ============================================
-- 3. QUOTES TABLE
-- ============================================
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Customer reference
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    
    -- Quote details
    project_description TEXT,
    installation_address TEXT,
    installation_type VARCHAR(50), -- window, door, shower, shopfront, other
    
    -- Safety compliance
    requires_safety_glass BOOLEAN DEFAULT FALSE,
    safety_reason TEXT, -- Why safety glass is required
    
    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL,
    vat_rate DECIMAL(5, 2) DEFAULT 15.00,
    vat_amount DECIMAL(10, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    
    -- Deposit
    deposit_required DECIMAL(5, 2) DEFAULT 50.00, -- Percentage
    deposit_amount DECIMAL(10, 2),
    deposit_paid DECIMAL(10, 2) DEFAULT 0,
    deposit_paid_at TIMESTAMPTZ,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'draft', 
    -- draft, sent, viewed, accepted, paid, in_production, completed, expired, cancelled
    
    -- Dates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    
    -- PDF storage
    pdf_url TEXT,
    pdf_storage_path TEXT,
    
    -- Source tracking
    source VARCHAR(50) DEFAULT 'whatsapp', -- whatsapp, website, phone, walk-in
    conversation_id UUID,
    
    -- Reminders
    reminder_24h_sent BOOLEAN DEFAULT FALSE,
    reminder_3d_sent BOOLEAN DEFAULT FALSE,
    reminder_expiry_sent BOOLEAN DEFAULT FALSE,
    
    -- Notes
    internal_notes TEXT,
    customer_notes TEXT
);

CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_phone ON quotes(customer_phone);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created ON quotes(created_at);
CREATE INDEX idx_quotes_expiry ON quotes(expiry_date);

-- ============================================
-- 4. QUOTE ITEMS TABLE
-- ============================================
CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    
    -- Product reference (optional - can be custom)
    product_id UUID REFERENCES products(id),
    
    -- Item details
    description VARCHAR(500) NOT NULL,
    glass_type VARCHAR(100),
    thickness_mm DECIMAL(5, 2),
    
    -- Dimensions (in mm)
    width_mm INTEGER NOT NULL,
    height_mm INTEGER NOT NULL,
    
    -- Calculated area
    area_sqm DECIMAL(10, 4) GENERATED ALWAYS AS (
        (width_mm::DECIMAL / 1000) * (height_mm::DECIMAL / 1000)
    ) STORED,
    
    -- Quantity
    quantity INTEGER DEFAULT 1,
    
    -- Pricing
    unit_price DECIMAL(10, 2) NOT NULL, -- Price per piece
    line_total DECIMAL(10, 2) NOT NULL,
    
    -- Processing
    has_edging BOOLEAN DEFAULT FALSE,
    edging_type VARCHAR(50), -- polished, beveled, pencil
    has_holes BOOLEAN DEFAULT FALSE,
    hole_count INTEGER DEFAULT 0,
    has_cutouts BOOLEAN DEFAULT FALSE,
    cutout_description TEXT,
    
    -- Shape
    is_irregular BOOLEAN DEFAULT FALSE,
    shape_surcharge_percent DECIMAL(5, 2) DEFAULT 0,
    
    -- Safety
    is_safety_glass BOOLEAN DEFAULT FALSE,
    safety_reason TEXT,
    
    -- Order in quote
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);

-- ============================================
-- 5. INVOICES TABLE
-- ============================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Quote reference
    quote_id UUID REFERENCES quotes(id),
    quote_number VARCHAR(50),
    
    -- Customer
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    billing_address TEXT,
    
    -- Invoice type
    invoice_type VARCHAR(20) DEFAULT 'deposit', -- deposit, final, full
    
    -- Amounts
    subtotal DECIMAL(10, 2) NOT NULL,
    vat_amount DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    balance_due DECIMAL(10, 2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, partial, overdue, cancelled
    
    -- Dates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- PDF
    pdf_url TEXT,
    pdf_storage_path TEXT
);

CREATE INDEX idx_invoices_quote ON invoices(quote_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ============================================
-- 6. PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    invoice_id UUID REFERENCES invoices(id),
    quote_id UUID REFERENCES quotes(id),
    customer_id UUID REFERENCES customers(id),
    
    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- card, eft, cash, snapsan
    
    -- PayFast specific
    payfast_payment_id VARCHAR(100),
    payfast_request_id VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
    
    -- Metadata
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Response data
    gateway_response JSONB
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_quote ON payments(quote_id);
CREATE INDEX idx_payments_payfast ON payments(payfast_payment_id);

-- ============================================
-- 7. CONVERSATIONS TABLE (AI Context)
-- ============================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    phone VARCHAR(20) NOT NULL,
    
    -- Conversation state
    state VARCHAR(50) DEFAULT 'welcome', 
    -- welcome, collecting_type, collecting_measurements, confirming, quoting, payment, completed
    
    -- Context for AI
    context JSONB DEFAULT '{}'::JSONB,
    -- Stores: glass_type, location, measurements[], requires_safety, etc.
    
    -- Current quote being built
    current_quote_id UUID REFERENCES quotes(id),
    
    -- AI mode
    ai_mode BOOLEAN DEFAULT FALSE, -- True when in AI chat mode
    
    -- Session tracking
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Message count
    message_count INTEGER DEFAULT 0
);

CREATE INDEX idx_conversations_phone ON conversations(phone);
CREATE INDEX idx_conversations_state ON conversations(state);

-- ============================================
-- 8. CONVERSATION MESSAGES TABLE
-- ============================================
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Message details
    direction VARCHAR(10) NOT NULL, -- inbound, outbound
    message_type VARCHAR(20) NOT NULL, -- text, image, button, flow_response
    content TEXT,
    
    -- Media
    media_url TEXT,
    media_type VARCHAR(50),
    
    -- AI processing
    ai_processed BOOLEAN DEFAULT FALSE,
    ai_response TEXT,
    ai_extracted_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- BotSailor reference
    external_message_id VARCHAR(100)
);

CREATE INDEX idx_conv_messages_conv ON conversation_messages(conversation_id);
CREATE INDEX idx_conv_messages_created ON conversation_messages(created_at);

-- ============================================
-- 9. REMINDERS TABLE
-- ============================================
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference
    quote_id UUID REFERENCES quotes(id),
    customer_id UUID REFERENCES customers(id),
    phone VARCHAR(20) NOT NULL,
    
    -- Reminder details
    reminder_type VARCHAR(50) NOT NULL, -- quote_24h, quote_3d, quote_expiry, payment_due, feedback
    scheduled_for TIMESTAMPTZ NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, cancelled, failed
    sent_at TIMESTAMPTZ,
    
    -- Message
    message_template TEXT,
    message_sent TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_for);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_reminders_quote ON reminders(quote_id);

-- ============================================
-- 10. COMPANY CONFIG TABLE
-- ============================================
CREATE TABLE company_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO company_config (key, value, description) VALUES
('company_info', '{
    "name": "Your Glass Company",
    "phone": "011 XXX XXXX",
    "email": "info@yourcompany.co.za",
    "address": "123 Main Road, Sandton, Gauteng",
    "vat_number": "4XXXXXXXXX",
    "registration_number": "2024/XXXXXX/07"
}'::JSONB, 'Company information for quotes and invoices'),

('quote_settings', '{
    "validity_days": 7,
    "deposit_percentage": 50,
    "vat_rate": 15,
    "expansion_gap_mm": 3,
    "irregular_shape_surcharge_percent": 20,
    "min_order_value": 500
}'::JSONB, 'Quote generation settings'),

('reminder_settings', '{
    "enabled": true,
    "first_reminder_hours": 24,
    "second_reminder_hours": 72,
    "expiry_warning_hours": 24,
    "quiet_hours_start": 20,
    "quiet_hours_end": 8
}'::JSONB, 'Reminder scheduling settings'),

('safety_glass_locations', '{
    "locations": ["shower", "door", "sidelight", "low_level_window", "balustrade", "overhead"],
    "low_level_height_mm": 800,
    "door_proximity_mm": 300
}'::JSONB, 'SANS 10400-N safety glass requirements');

-- ============================================
-- 11. SEED DATA: GLASS PRODUCTS
-- ============================================
INSERT INTO products (product_code, name, description, category, thickness_mm, glass_type, price_per_sqm, is_safety_glass, sans_approved_for) VALUES
-- Clear Float Glass
('CLR-4MM', '4mm Clear Float', 'Standard 4mm clear float glass', 'float', 4, 'clear', 200.00, FALSE, '[]'),
('CLR-5MM', '5mm Clear Float', 'Standard 5mm clear float glass', 'float', 5, 'clear', 240.00, FALSE, '[]'),
('CLR-6MM', '6mm Clear Float', 'Standard 6mm clear float glass', 'float', 6, 'clear', 280.00, FALSE, '[]'),

-- Toughened Clear Glass (Safety)
('TGH-6MM-CLR', '6mm Toughened Clear', 'Safety toughened 6mm clear glass', 'toughened', 6, 'clear', 500.00, TRUE, '["shower", "door", "sidelight", "low_level_window", "balustrade"]'),
('TGH-8MM-CLR', '8mm Toughened Clear', 'Safety toughened 8mm clear glass', 'toughened', 8, 'clear', 620.00, TRUE, '["shower", "door", "sidelight", "low_level_window", "balustrade"]'),
('TGH-10MM-CLR', '10mm Toughened Clear', 'Safety toughened 10mm clear glass', 'toughened', 10, 'clear', 750.00, TRUE, '["shower", "door", "sidelight", "low_level_window", "balustrade"]'),
('TGH-12MM-CLR', '12mm Toughened Clear', 'Heavy duty toughened 12mm clear glass', 'toughened', 12, 'clear', 900.00, TRUE, '["shower", "door", "balustrade"]'),

-- Toughened Tinted Glass
('TGH-6MM-BRZ', '6mm Toughened Bronze', 'Safety toughened 6mm bronze tinted', 'toughened', 6, 'tinted', 580.00, TRUE, '["shower", "door", "sidelight"]'),
('TGH-6MM-GRY', '6mm Toughened Grey', 'Safety toughened 6mm grey tinted', 'toughened', 6, 'tinted', 580.00, TRUE, '["shower", "door", "sidelight"]'),

-- Laminated Safety Glass
('LAM-6.38MM-CLR', '6.38mm Laminated Clear', 'Laminated safety glass', 'laminated', 6.38, 'clear', 600.00, TRUE, '["overhead", "balustrade", "door"]'),

-- Obscure/Privacy Glass
('OBS-4MM-RAIN', '4mm Rain Pattern', 'Obscure rain pattern glass', 'float', 4, 'patterned', 260.00, FALSE, '[]'),
('TGH-6MM-FROST', '6mm Toughened Frosted', 'Safety frosted glass', 'toughened', 6, 'frosted', 560.00, TRUE, '["shower", "door"]'),

-- Double Glazed Units
('DGU-4-12-4', 'Double Glazed 4-12-4', '20mm double glazed unit', 'double_glazed', 20, 'clear', 800.00, FALSE, '[]'),
('DGU-6-12-6', 'Double Glazed 6-12-6', '24mm double glazed unit', 'double_glazed', 24, 'clear', 950.00, FALSE, '[]'),
('DGU-LOW-E', 'Low-E Double Glazed', '24mm Low-E double glazed unit', 'double_glazed', 24, 'low-e', 1400.00, FALSE, '[]'),

-- Mirrors
('MIR-4MM', '4mm Silver Mirror', 'Standard silver mirror', 'mirror', 4, 'mirror', 350.00, FALSE, '[]'),
('MIR-6MM', '6mm Silver Mirror', 'Thick silver mirror', 'mirror', 6, 'mirror', 450.00, FALSE, '[]');

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_timestamp BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_quotes_timestamp BEFORE UPDATE ON quotes
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_timestamp BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_timestamp BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate quote number
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
    year_code TEXT;
    seq_num INTEGER;
BEGIN
    year_code := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(quote_number FROM 'GLS-[0-9]{4}-([0-9]+)') AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM quotes
    WHERE quote_number LIKE 'GLS-' || year_code || '-%';
    
    NEW.quote_number := 'GLS-' || year_code || '-' || LPAD(seq_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_quote_number_trigger
BEFORE INSERT ON quotes
FOR EACH ROW
WHEN (NEW.quote_number IS NULL)
EXECUTE FUNCTION generate_quote_number();

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_code TEXT;
    seq_num INTEGER;
BEGIN
    year_code := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 'INV-[0-9]{4}-([0-9]+)') AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year_code || '-%';
    
    NEW.invoice_number := 'INV-' || year_code || '-' || LPAD(seq_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_invoice_number_trigger
BEFORE INSERT ON invoices
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL)
EXECUTE FUNCTION generate_invoice_number();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_config ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (full access)
CREATE POLICY "Service role full access on customers" ON customers
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on products" ON products
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on quotes" ON quotes
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on quote_items" ON quote_items
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on invoices" ON invoices
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on payments" ON payments
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on conversations" ON conversations
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on conversation_messages" ON conversation_messages
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on reminders" ON reminders
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on company_config" ON company_config
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public read access to products (for API)
CREATE POLICY "Public read access on products" ON products
FOR SELECT TO anon USING (is_active = true);
```

---

## Supabase Setup Steps

### 1. Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and anon key

### 2. Run Schema
1. Go to SQL Editor in Supabase dashboard
2. Copy and run the schema above
3. Verify tables are created

### 3. Configure Storage (for PDFs)
```sql
-- Create storage bucket for quote/invoice PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- Allow public read access
CREATE POLICY "Public read access on documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Allow authenticated upload
CREATE POLICY "Authenticated upload to documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

### 4. Get Connection Details
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (for server-side)
```

---

## Key Queries

### Get Quote with Items
```sql
SELECT 
    q.*,
    c.name as customer_name,
    c.email as customer_email,
    json_agg(qi.*) as items
FROM quotes q
JOIN customers c ON q.customer_id = c.id
LEFT JOIN quote_items qi ON qi.quote_id = q.id
WHERE q.id = 'quote-uuid'
GROUP BY q.id, c.id;
```

### Get Products for Safety Location
```sql
SELECT * FROM products
WHERE is_safety_glass = true
AND sans_approved_for ? 'shower'
AND is_active = true
ORDER BY price_per_sqm;
```

### Get Pending Reminders
```sql
SELECT r.*, q.quote_number, c.name
FROM reminders r
JOIN quotes q ON r.quote_id = q.id
JOIN customers c ON r.customer_id = c.id
WHERE r.status = 'pending'
AND r.scheduled_for <= NOW()
ORDER BY r.scheduled_for;
```
