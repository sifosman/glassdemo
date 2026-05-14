import { NextRequest, NextResponse } from 'next/server';
import { ChatConversation, deriveSessionMode } from '@/lib/chat';
import { assertChatAdmin, createAdminSupabaseClient } from '@/lib/chatServer';

export async function GET(request: NextRequest) {
  const authError = assertChatAdmin(request);

  if (authError) {
    return authError;
  }

  try {
    const supabase = createAdminSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
    const query = searchParams.get('q')?.trim();

    let conversationsQuery = supabase
      .from('conversations')
      .select('id, customer_id, phone, state, context, current_quote_id, ai_mode, started_at, last_message_at, ended_at, message_count')
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (query) {
      conversationsQuery = conversationsQuery.ilike('phone', `%${query}%`);
    }

    const { data, error } = await conversationsQuery;

    if (error) {
      return NextResponse.json({ error: 'Failed to load conversations', details: error.message }, { status: 500 });
    }

    const conversations = ((data || []) as unknown as ChatConversation[]).map((conversation) => ({
      ...conversation,
      session_mode: deriveSessionMode(conversation),
    }));

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error('Chat conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
