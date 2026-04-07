import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

type ReminderType = '24h' | '72h' | '7d';

interface PendingRepair {
  id: string;
  reference_number: string;
  customer_phone: string;
  system_type: string;
  calculated_call_out_fee: number;
  created_at: string;
  reminder_24h_sent: boolean;
  reminder_72h_sent: boolean;
  reminder_7d_sent: boolean;
  hoursElapsed: number;
  reminderType: ReminderType;
}

export async function GET(request: NextRequest) {
  try {
    // Query all pending payment repair requests
    const { data: repairRequests, error } = await supabase
      .from('repair_requests')
      .select('id, reference_number, customer_phone, system_type, calculated_call_out_fee, created_at, reminder_24h_sent, reminder_72h_sent, reminder_7d_sent')
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
        pending_reminders: [],
        message: 'No pending repair requests found'
      });
    }

    const now = new Date();
    const pendingReminders: PendingRepair[] = [];

    for (const repair of repairRequests) {
      const createdAt = new Date(repair.created_at);
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      // Check for 24-hour reminder (between 24-47 hours)
      if (hoursElapsed >= 24 && hoursElapsed < 48 && !repair.reminder_24h_sent) {
        pendingReminders.push({
          ...repair,
          hoursElapsed: Math.floor(hoursElapsed),
          reminderType: '24h'
        });
      }
      // Check for 72-hour reminder (between 72-95 hours, ~3 days)
      else if (hoursElapsed >= 72 && hoursElapsed < 96 && !repair.reminder_72h_sent) {
        pendingReminders.push({
          ...repair,
          hoursElapsed: Math.floor(hoursElapsed),
          reminderType: '72h'
        });
      }
      // Check for 7-day reminder (between 168-191 hours, ~7 days)
      else if (hoursElapsed >= 168 && hoursElapsed < 192 && !repair.reminder_7d_sent) {
        pendingReminders.push({
          ...repair,
          hoursElapsed: Math.floor(hoursElapsed),
          reminderType: '7d'
        });
      }
    }

    return NextResponse.json({
      success: true,
      pending_reminders: pendingReminders,
      total_pending: repairRequests.length,
      reminders_to_send: pendingReminders.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
