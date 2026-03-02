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

function generateSignature(data: Record<string, string>, passphrase: string): string {
  // Create parameter string
  const paramString = Object.keys(data)
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&');
  
  // Add passphrase
  const stringToHash = `${paramString}&passphrase=${passphrase}`;
  
  // Generate MD5 hash
  return crypto.createHash('md5').update(stringToHash).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference_number, amount, item_name, return_url, cancel_url } = body;

    if (!reference_number || !amount) {
      return NextResponse.json(
        { error: 'Reference number and amount are required' },
        { status: 400 }
      );
    }

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

    // Generate unique order ID
    const orderId = `${reference_number}-${Date.now()}`;

    // Prepare PayFast data
    const payfastData: Record<string, string> = {
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      return_url: return_url || `${process.env.NEXT_PUBLIC_BASE_URL}/repair-checkout/${reference_number}/success`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_BASE_URL}/repair-checkout/${reference_number}`,
      notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payfast-notify`,
      name_first: 'Customer',
      email_address: 'customer@example.com', // You might want to collect this
      m_payment_id: orderId,
      amount: amount.toFixed(2),
      item_name: item_name || `Glass Repair - ${reference_number}`,
      item_description: `Call-out fee for glass repair service - ${reference_number}`,
      custom_str1: reference_number,
      custom_str2: repairRequest.id,
    };

    // Generate signature
    if (PAYFAST_PASSPHRASE) {
      payfastData.signature = generateSignature(payfastData, PAYFAST_PASSPHRASE);
    }

    // Build checkout URL
    const checkoutUrl = `${PAYFAST_HOST}/eng/process?${new URLSearchParams(payfastData).toString()}`;

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
