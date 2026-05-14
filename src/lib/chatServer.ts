import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function assertChatAdmin(request: NextRequest): NextResponse | null {
  const configuredPassword = process.env.CHAT_ADMIN_PASSWORD;

  if (!configuredPassword) {
    return NextResponse.json({ error: 'CHAT_ADMIN_PASSWORD is not configured' }, { status: 503 });
  }

  const providedPassword = request.headers.get('x-chat-admin-password');

  if (providedPassword !== configuredPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export function getSchemaMigrationMessage(feature: string): string {
  return `${feature} requires the approved HITL chat schema migration to be applied to Supabase first.`;
}
