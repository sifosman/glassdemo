import { NextRequest, NextResponse } from 'next/server';
import { isMissingColumnError } from '@/lib/chat';
import { assertChatAdmin, createAdminSupabaseClient, getSchemaMigrationMessage } from '@/lib/chatServer';
import { MetaWhatsAppService } from '@/services/metaWhatsAppService';

export async function POST(
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
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const takeover = Boolean(body.takeover);
    const agentId = typeof body.agent_id === 'string' && body.agent_id.trim() ? body.agent_id.trim() : 'manual-agent';

    if (!content) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, phone')
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (takeover) {
      await supabase
        .from('conversations')
        .update({
          session_mode: 'human',
          ai_mode: false,
          assigned_agent_id: agentId,
          assigned_at: new Date().toISOString(),
          assigned_by: agentId,
        })
        .eq('id', conversationId);
    }

    const { data: queuedMessage, error: messageError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        direction: 'outbound',
        message_type: 'text',
        content,
        sent_by_agent_id: agentId,
        delivery_status: 'queued',
      })
      .select('id, conversation_id, direction, message_type, content, created_at, external_message_id')
      .single();

    if (messageError || !queuedMessage) {
      if (messageError && isMissingColumnError(messageError)) {
        return NextResponse.json({ error: getSchemaMigrationMessage('Manual reply tracking') }, { status: 409 });
      }

      return NextResponse.json({ error: 'Failed to queue manual reply', details: messageError?.message }, { status: 500 });
    }

    try {
      const whatsapp = new MetaWhatsAppService();
      await whatsapp.sendTextMessage(conversation.phone, content);

      await supabase
        .from('conversation_messages')
        .update({
          delivery_status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', queuedMessage.id);

      return NextResponse.json({
        success: true,
        message: { ...queuedMessage, delivery_status: 'sent' },
      });
    } catch (sendError) {
      const errorMessage = sendError instanceof Error ? sendError.message : 'Failed to send WhatsApp message';

      await supabase
        .from('conversation_messages')
        .update({ delivery_status: 'failed', error_message: errorMessage })
        .eq('id', queuedMessage.id);

      return NextResponse.json({ error: errorMessage, message: queuedMessage }, { status: 502 });
    }
  } catch (error) {
    console.error('Manual reply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
