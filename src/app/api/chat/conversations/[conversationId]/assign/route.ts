import { NextRequest, NextResponse } from 'next/server';
import { isMissingColumnError } from '@/lib/chat';
import { assertChatAdmin, createAdminSupabaseClient, getSchemaMigrationMessage } from '@/lib/chatServer';

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
    const assignedAgentId = typeof body.assigned_agent_id === 'string' && body.assigned_agent_id.trim()
      ? body.assigned_agent_id.trim()
      : null;
    const assignedBy = typeof body.assigned_by === 'string' && body.assigned_by.trim()
      ? body.assigned_by.trim()
      : null;

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('conversations')
      .update({
        assigned_agent_id: assignedAgentId,
        assigned_at: assignedAgentId ? new Date().toISOString() : null,
        assigned_by: assignedAgentId ? assignedBy : null,
      })
      .eq('id', conversationId)
      .select('id')
      .single();

    if (error) {
      if (isMissingColumnError(error)) {
        return NextResponse.json({ error: getSchemaMigrationMessage('Agent assignment') }, { status: 409 });
      }

      return NextResponse.json({ error: 'Failed to update assignment', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, conversation: { ...data, assigned_agent_id: assignedAgentId } });
  } catch (error) {
    console.error('Chat assignment update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
