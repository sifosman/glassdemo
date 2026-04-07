import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BotSailorService } from '@/services/botSailorService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

type ReminderType = '24h' | '72h' | '7d';

interface SendReminderRequest {
  repair_id: string;
  reminder_type: ReminderType;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendReminderRequest = await request.json();
    const { repair_id, reminder_type } = body;

    if (!repair_id || !reminder_type) {
      return NextResponse.json(
        { error: 'Missing required fields: repair_id and reminder_type' },
        { status: 400 }
      );
    }

    // Fetch the repair request
    const { data: repairRequest, error: fetchError } = await supabase
      .from('repair_requests')
      .select('*')
      .eq('id', repair_id)
      .single();

    if (fetchError || !repairRequest) {
      console.error('Failed to fetch repair request:', fetchError);
      return NextResponse.json(
        { error: 'Repair request not found' },
        { status: 404 }
      );
    }

    // Check if already sent
    if (
      (reminder_type === '24h' && repairRequest.reminder_24h_sent) ||
      (reminder_type === '72h' && repairRequest.reminder_72h_sent) ||
      (reminder_type === '7d' && repairRequest.reminder_7d_sent)
    ) {
      return NextResponse.json(
        { error: 'Reminder already sent', reminder_type },
        { status: 400 }
      );
    }

    // Generate checkout URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://glassdemo.vercel.app';
    const checkoutUrl = `${baseUrl}/repair-checkout/${repairRequest.reference_number}`;

    // Send WhatsApp reminder
    const botSailorService = new BotSailorService();

    try {
      switch (reminder_type) {
        case '24h':
          await botSailorService.send24HourReminder(
            repairRequest.customer_phone,
            repairRequest.reference_number,
            repairRequest.system_type || 'glass repair',
            repairRequest.calculated_call_out_fee,
            checkoutUrl
          );
          break;

        case '72h':
          await botSailorService.send72HourReminder(
            repairRequest.customer_phone,
            repairRequest.reference_number,
            checkoutUrl
          );
          break;

        case '7d':
          await botSailorService.send7DayReminder(
            repairRequest.customer_phone,
            repairRequest.reference_number,
            repairRequest.calculated_call_out_fee,
            checkoutUrl
          );
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid reminder type' },
            { status: 400 }
          );
      }
    } catch (whatsappError) {
      console.error('Failed to send WhatsApp reminder:', whatsappError);
      return NextResponse.json(
        { error: 'Failed to send WhatsApp reminder', details: whatsappError },
        { status: 500 }
      );
    }

    // Update reminder status in database
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    switch (reminder_type) {
      case '24h':
        updateData.reminder_24h_sent = true;
        updateData.reminder_24h_sent_at = new Date().toISOString();
        break;
      case '72h':
        updateData.reminder_72h_sent = true;
        updateData.reminder_72h_sent_at = new Date().toISOString();
        break;
      case '7d':
        updateData.reminder_7d_sent = true;
        updateData.reminder_7d_sent_at = new Date().toISOString();
        updateData.final_reminder_sent = true;
        break;
    }

    const { error: updateError } = await supabase
      .from('repair_requests')
      .update(updateData)
      .eq('id', repair_id);

    if (updateError) {
      console.error('Failed to update reminder status:', updateError);
      // Don't fail the request since the message was sent
      console.warn('WhatsApp reminder sent but failed to update database');
    }

    return NextResponse.json({
      success: true,
      repair_id,
      reminder_type,
      reference_number: repairRequest.reference_number,
      customer_phone: repairRequest.customer_phone,
      message: `${reminder_type} reminder sent successfully`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
