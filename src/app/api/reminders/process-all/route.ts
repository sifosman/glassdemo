import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MetaWhatsAppService } from '@/services/metaWhatsAppService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

type ReminderType = '24h' | '72h' | '7d';

interface ReminderResult {
  quote_id: string;
  quote_number: string;
  reminder_type: ReminderType;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const results: ReminderResult[] = [];
    let processed = 0;
    let sent = 0;
    let failed = 0;

    // Query all pending payment repair requests
    const { data: repairRequests, error } = await supabase
      .from('repair_requests')
      .select('*')
      .eq('status', 'pending_payment')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch repair requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch repair requests' },
        { status: 500 }
      );
    }

    if (!repairRequests || repairRequests.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending repair requests found',
        processed: 0,
        sent: 0,
        failed: 0,
        results: []
      });
    }

    const now = new Date();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://glassdemo.vercel.app';
    const metaWhatsAppService = new MetaWhatsAppService();

    for (const repair of repairRequests) {
      const createdAt = new Date(repair.created_at);
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      let reminderType: ReminderType | null = null;
      let shouldSend = false;

      // Determine which reminder to send
      if (hoursElapsed >= 24 && hoursElapsed < 48 && !repair.reminder_24h_sent) {
        reminderType = '24h';
        shouldSend = true;
      } else if (hoursElapsed >= 72 && hoursElapsed < 96 && !repair.reminder_72h_sent) {
        reminderType = '72h';
        shouldSend = true;
      } else if (hoursElapsed >= 168 && hoursElapsed < 192 && !repair.reminder_7d_sent) {
        reminderType = '7d';
        shouldSend = true;
      }

      if (!shouldSend || !reminderType) {
        continue;
      }

      processed++;
      const checkoutUrl = `${baseUrl}/repair-checkout/${repair.reference_number}`;

      try {
        // Send WhatsApp reminder
        switch (reminderType) {
          case '24h':
            await metaWhatsAppService.send24HourReminder(
              repair.customer_phone,
              repair.reference_number,
              repair.system_type || 'glass repair',
              repair.calculated_call_out_fee,
              checkoutUrl
            );
            break;

          case '72h':
            await metaWhatsAppService.send72HourReminder(
              repair.customer_phone,
              repair.reference_number,
              checkoutUrl
            );
            break;

          case '7d':
            await metaWhatsAppService.send7DayReminder(
              repair.customer_phone,
              repair.reference_number,
              repair.calculated_call_out_fee,
              checkoutUrl
            );
            break;
        }

        // Update database
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString()
        };

        switch (reminderType) {
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

        await supabase
          .from('repair_requests')
          .update(updateData)
          .eq('id', repair.id);

        sent++;
        results.push({
          repair_id: repair.id,
          reference_number: repair.reference_number,
          reminder_type: reminderType,
          success: true
        });

        console.log(`✅ ${reminderType} reminder sent: ${repair.reference_number}`);

        // Rate limiting: wait 2 seconds between messages
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          repair_id: repair.id,
          reference_number: repair.reference_number,
          reminder_type: reminderType,
          success: false,
          error: errorMessage
        });

        console.error(`❌ Failed to send ${reminderType} reminder for ${repair.reference_number}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} reminders, sent ${sent}, failed ${failed}`,
      total_pending_repairs: repairRequests.length,
      processed,
      sent,
      failed,
      results
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET handler for manual testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to process all pending reminders',
    endpoint: '/api/reminders/process-all'
  });
}
