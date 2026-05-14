import { NextRequest, NextResponse } from 'next/server';
import { isMissingColumnError, SessionMode } from '@/lib/chat';
import { assertChatAdmin, createAdminSupabaseClient, getSchemaMigrationMessage } from '@/lib/chatServer';

const validModes: SessionMode[] = ['bot', 'human', 'hybrid'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const authError = assertChatAdmin(request);

  if (authError) {
    return authError;
  }

  try {
    const { conversationId } = await params;
    const body = await request.json();
    const mode = body.session_mode as SessionMode;

    if (!validModes.includes(mode)) {
      return NextResponse.json({ error: 'Invalid session mode' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('conversations')
      .update({
        session_mode: mode,
        ai_mode: mode === 'bot' || mode === 'hybrid',
      })
      .eq('id', conversationId)
      .select('id, ai_mode')
      .single();

    if (error) {
      if (isMissingColumnError(error)) {
        return NextResponse.json({ error: getSchemaMigrationMessage('Session mode') }, { status: 409 });
      }

      return NextResponse.json({ error: 'Failed to update session mode', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, conversation: { ...data, session_mode: mode } });
  } catch (error) {
    console.error('Chat mode update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
