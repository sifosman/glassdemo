-- MULTI-TENANT SAAS SCHEMA FOR GLASS QUOTE APP
-- Run this in the SQL Editor of your NEW Supabase Project

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIER 1: DISTRIBUTORS
CREATE TABLE distributors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TIER 2: BUSINESSES (Linked to Distributor)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distributor_id UUID REFERENCES distributors(id) ON DELETE SET NULL,
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,
    
    -- WhatsApp & BotSailor Credentials
    botsailor_api_token TEXT,
    botsailor_phone_number_id TEXT,
    whatsapp_phone_number VARCHAR,
    
    -- PayFast Credentials for this specific business
    payfast_merchant_id TEXT,
    payfast_merchant_key TEXT,
    payfast_passphrase TEXT,
    
    -- Webhook Security
    webhook_secret TEXT DEFAULT uuid_generate_v4()::text,
    
    -- Subscription Status
    is_active BOOLEAN DEFAULT true,
    subscription_expires_at TIMESTAMPTZ,
    
    -- Branding
    logo_url TEXT,
    primary_color VARCHAR DEFAULT '#3b82f6',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BUSINESS USERS (RBAC)
CREATE TABLE business_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    email VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'admin', -- admin, staff
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. EXISTING TABLES (Upgraded with business_id)

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    phone VARCHAR NOT NULL,
    name VARCHAR,
    email VARCHAR,
    address TEXT,
    suburb VARCHAR,
    city VARCHAR DEFAULT 'Johannesburg',
    province VARCHAR DEFAULT 'Gauteng',
    postal_code VARCHAR,
    whatsapp_name VARCHAR,
    whatsapp_profile_pic TEXT,
    preferred_contact VARCHAR DEFAULT 'whatsapp',
    language VARCHAR DEFAULT 'en',
    total_quotes INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_contact_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(business_id, phone) -- Crucial: prevents cross-contamination
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    product_code VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR NOT NULL,
    thickness_mm NUMERIC NOT NULL,
    glass_type VARCHAR,
    tint_color VARCHAR,
    price_per_sqm NUMERIC NOT NULL,
    min_charge NUMERIC DEFAULT 0,
    is_safety_glass BOOLEAN DEFAULT false,
    sans_approved_for JSONB DEFAULT '[]'::jsonb,
    in_stock BOOLEAN DEFAULT true,
    lead_time_days INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(business_id, product_code)
);

CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    quote_number VARCHAR NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR NOT NULL,
    customer_phone VARCHAR NOT NULL,
    customer_email VARCHAR,
    project_description TEXT,
    installation_address TEXT,
    installation_type VARCHAR,
    requires_safety_glass BOOLEAN DEFAULT false,
    safety_reason TEXT,
    subtotal NUMERIC NOT NULL,
    vat_rate NUMERIC DEFAULT 15.00,
    vat_amount NUMERIC NOT NULL,
    discount_percent NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    deposit_required NUMERIC DEFAULT 50.00,
    deposit_amount NUMERIC,
    deposit_paid NUMERIC DEFAULT 0,
    deposit_paid_at TIMESTAMPTZ,
    status VARCHAR DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    pdf_url TEXT,
    pdf_storage_path TEXT,
    source VARCHAR DEFAULT 'whatsapp',
    conversation_id UUID,
    reminder_24h_sent BOOLEAN DEFAULT false,
    reminder_3d_sent BOOLEAN DEFAULT false,
    reminder_expiry_sent BOOLEAN DEFAULT false,
    internal_notes TEXT,
    customer_notes TEXT,
    UNIQUE(business_id, quote_number)
);

CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    width_mm NUMERIC NOT NULL,
    height_mm NUMERIC NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE repair_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    reference_number TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_location TEXT,
    customer_latitude NUMERIC,
    customer_longitude NUMERIC,
    system_type TEXT,
    glass_type TEXT,
    frame_finish TEXT,
    hardware_damage TEXT,
    expert_advice TEXT,
    safety_upgrade_required BOOLEAN DEFAULT false,
    safety_note TEXT,
    distance_km NUMERIC,
    duration TEXT,
    base_call_out_fee NUMERIC DEFAULT 350.00,
    cost_per_km NUMERIC DEFAULT 6.50,
    calculated_call_out_fee NUMERIC,
    materials_fitting NUMERIC DEFAULT 1850.00,
    total_price NUMERIC,
    status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'completed', 'cancelled')),
    payment_method TEXT,
    payment_reference TEXT,
    paid_at TIMESTAMPTZ,
    team_notified BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, reference_number)
);

CREATE TABLE payfast_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    repair_request_id UUID REFERENCES repair_requests(id) ON DELETE SET NULL,
    pf_payment_id TEXT,
    payment_status TEXT,
    amount_gross NUMERIC,
    amount_fee NUMERIC,
    amount_net NUMERIC,
    payfast_signature TEXT,
    merchant_id TEXT,
    signature_match BOOLEAN,
    received_at TIMESTAMPTZ DEFAULT now(),
    raw_payload JSONB
);

-- 6. ROW LEVEL SECURITY (RLS) SETUP

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payfast_payments ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's business_id
CREATE OR REPLACE FUNCTION get_user_business_id()
RETURNS UUID AS $$
    SELECT business_id FROM business_users WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Create Policies (Users can only see data for their business)
CREATE POLICY "Users can access their business" ON businesses
    FOR ALL USING (id = get_user_business_id());

CREATE POLICY "Users can access their customers" ON customers
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY "Users can access their products" ON products
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY "Users can access their quotes" ON quotes
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY "Users can access their quote items" ON quote_items
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY "Users can access their repair requests" ON repair_requests
    FOR ALL USING (business_id = get_user_business_id());

CREATE POLICY "Users can access their payments" ON payfast_payments
    FOR ALL USING (business_id = get_user_business_id());
