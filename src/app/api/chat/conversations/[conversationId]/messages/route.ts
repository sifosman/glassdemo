import { NextRequest, NextResponse } from 'next/server';
import { assertChatAdmin, createAdminSupabaseClient } from '@/lib/chatServer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const authError = assertChatAdmin(request);

  if (authError) {
    return authError;
  }

  try {
    const { conversationId } = await params;
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('conversation_messages')
      .select('id, conversation_id, direction, message_type, content, media_url, media_type, ai_processed, ai_response, ai_extracted_data, created_at, external_message_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to load messages', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, messages: data || [] });
  } catch (error) {
    console.error('Chat messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
