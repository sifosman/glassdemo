import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generate unique reference number
function generateReferenceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REPAIR-${year}${month}${day}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['customer_phone', 'distance_km', 'calculated_call_out_fee', 'total_price', 'system_type', 'glass_type'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate reference number
    const referenceNumber = generateReferenceNumber();

    // Insert repair request into database
    const { data, error } = await supabase
      .from('repair_requests')
      .insert({
        reference_number: referenceNumber,
        customer_phone: body.customer_phone,
        customer_location: body.customer_location || null,
        customer_latitude: body.customer_latitude || null,
        customer_longitude: body.customer_longitude || null,
        
        // Glass analysis data
        system_type: body.system_type,
        glass_type: body.glass_type,
        frame_finish: body.frame_finish || null,
        hardware_damage: body.hardware_damage || null,
        expert_advice: body.expert_advice || null,
        safety_upgrade_required: body.safety_upgrade_required || false,
        safety_note: body.safety_note || null,
        
        // Pricing breakdown
        distance_km: body.distance_km,
        duration: body.duration || null,
        base_call_out_fee: body.base_call_out_fee || 350.00,
        cost_per_km: body.cost_per_km || 6.50,
        calculated_call_out_fee: body.calculated_call_out_fee,
        materials_fitting: body.materials_fitting || 1850.00,
        total_price: body.total_price,
        
        // Status
        status: 'pending_payment',
        team_notified: false,
        
        // Metadata
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create repair request', details: error.message },
        { status: 500 }
      );
    }

    // Generate checkout URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://glassdemo-1zl3.vercel.app';
    const checkoutUrl = `${baseUrl}/repair-checkout/${referenceNumber}`;

    return NextResponse.json({
      success: true,
      reference_number: referenceNumber,
      checkout_url: checkoutUrl,
      data: data
    }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve repair request by reference number
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference number is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('repair_requests')
      .select('*')
      .eq('reference_number', reference)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Repair request not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to retrieve repair request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
