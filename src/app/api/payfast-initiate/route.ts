import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// PayFast configuration
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '';
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || '';
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';
const PAYFAST_SANDBOX = process.env.PAYFAST_SANDBOX === 'true';

// PayFast URLs
const PAYFAST_HOST = PAYFAST_SANDBOX 
  ? 'https://sandbox.payfast.co.za' 
  : 'https://www.payfast.co.za';

// PayFast required parameter order for signature generation
const PAYFAST_FIELD_ORDER = [
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'cell_number',
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
  'custom_int1',
  'custom_int2',
  'custom_int3',
  'custom_int4',
  'custom_int5',
  'custom_str1',
  'custom_str2',
  'custom_str3',
  'custom_str4',
  'custom_str5',
  'subscription_type',
  'billing_date',
  'frequency',
  'cycles',
  'subscription_notify_email',
  'subscription_notify_buyer',
];

function buildPayFastParamString(data: Record<string, string>): string {
  // Build param string in PayFast's required order (not alphabetical)
  const params: string[] = [];

  for (const key of PAYFAST_FIELD_ORDER) {
    const value = data[key];
    if (value !== undefined && value !== null && value !== '') {
      params.push(`${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`);
    }
  }

  return params.join('&');
}

function generateSignature(data: Record<string, string>, passphrase: string): string {
  let paramString = buildPayFastParamString(data);
  const normalizedPassphrase = passphrase.trim();

  if (normalizedPassphrase) {
    paramString += `&passphrase=${encodeURIComponent(normalizedPassphrase).replace(/%20/g, '+')}`;
  }

  return crypto.createHash('md5').update(paramString).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference_number, amount, item_name, return_url, cancel_url, payment_type = 'repair' } = body;

    if (!reference_number || !amount) {
      return NextResponse.json(
        { error: 'Reference number and amount are required' },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const orderId = `${reference_number}-${Date.now()}`;

    let payfastData: Record<string, string>;

    if (payment_type === 'quote') {
      const { data: quote, error: fetchError } = await supabase
        .from('quotes')
        .select('*')
        .eq('quote_number', reference_number)
        .single();

      if (fetchError || !quote) {
        return NextResponse.json(
          { error: 'Quote not found' },
          { status: 404 }
        );
      }

      if (Number(quote.deposit_paid || 0) >= Number(quote.deposit_amount || 0)) {
        return NextResponse.json(
          { error: 'This quote deposit has already been paid' },
          { status: 400 }
        );
      }

      payfastData = {
        merchant_id: PAYFAST_MERCHANT_ID,
        merchant_key: PAYFAST_MERCHANT_KEY,
        return_url: return_url || `${process.env.NEXT_PUBLIC_BASE_URL}/quote/${reference_number}/success`,
        cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_BASE_URL}/quote/${reference_number}`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payfast-notify`,
        name_first: quote.customer_name || 'Customer',
        email_address: quote.customer_email || 'customer@example.com',
        m_payment_id: orderId,
        amount: Number(amount).toFixed(2),
        item_name: item_name || `Quote Deposit - ${reference_number}`,
        item_description: `Deposit payment for glass quote - ${reference_number}`,
        custom_str1: reference_number,
        custom_str2: quote.id,
        custom_str3: 'quote',
        custom_str4: quote.customer_phone,
      };
    } else {
      // Fetch repair request to get customer details
      const { data: repairRequest, error: fetchError } = await supabase
        .from('repair_requests')
        .select('*')
        .eq('reference_number', reference_number)
        .single();

      if (fetchError || !repairRequest) {
        return NextResponse.json(
          { error: 'Repair request not found' },
          { status: 404 }
        );
      }

      // Check if already paid
      if (repairRequest.status === 'paid' || repairRequest.status === 'completed') {
        return NextResponse.json(
          { error: 'This repair request has already been paid' },
          { status: 400 }
        );
      }

      // Prepare PayFast data
      payfastData = {
        merchant_id: PAYFAST_MERCHANT_ID,
        merchant_key: PAYFAST_MERCHANT_KEY,
        return_url: return_url || `${process.env.NEXT_PUBLIC_BASE_URL}/repair-checkout/${reference_number}/success`,
        cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_BASE_URL}/repair-checkout/${reference_number}`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payfast-notify`,
        name_first: 'Customer',
        email_address: 'customer@example.com',
        m_payment_id: orderId,
        amount: Number(amount).toFixed(2),
        item_name: item_name || `Glass Repair - ${reference_number}`,
        item_description: `Call-out fee for glass repair service - ${reference_number}`,
        custom_str1: reference_number,
        custom_str2: repairRequest.id,
        custom_str3: 'repair',
      };
    }

    // Generate signature
    if (PAYFAST_PASSPHRASE) {
      payfastData.signature = generateSignature(payfastData, PAYFAST_PASSPHRASE);
    }

    // Build checkout URL
    const checkoutUrl = `${PAYFAST_HOST}/eng/process?${buildPayFastParamString(payfastData)}`;

    return NextResponse.json({
      success: true,
      checkout_url: checkoutUrl,
      order_id: orderId,
      data: payfastData
    });

  } catch (error) {
    console.error('PayFast initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
