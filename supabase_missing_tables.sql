-- Run this in the SQL Editor of your NEW Supabase Project to add the missing tables

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    invoice_number VARCHAR NOT NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    quote_number VARCHAR,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR NOT NULL,
    customer_phone VARCHAR NOT NULL,
    customer_email VARCHAR,
    billing_address TEXT,
    invoice_type VARCHAR DEFAULT 'deposit',
    subtotal NUMERIC NOT NULL,
    vat_amount NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    amount_paid NUMERIC DEFAULT 0,
    balance_due NUMERIC NOT NULL,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    pdf_storage_path TEXT,
    UNIQUE(business_id, invoice_number)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their invoices" ON invoices
    FOR ALL USING (business_id = get_user_business_id());

-- Let's also add the pending_quotes table from the old DB since it seems it was used
CREATE TABLE pending_quotes (
    id BIGSERIAL PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    chat_id TEXT UNIQUE,
    quote_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pending_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their pending_quotes" ON pending_quotes
    FOR ALL USING (business_id = get_user_business_id());
