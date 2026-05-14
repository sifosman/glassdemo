export type SessionMode = 'bot' | 'human' | 'hybrid';
export type MessageDirection = 'inbound' | 'outbound';
export type DeliveryStatus = 'received' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatConversation {
  id: string;
  customer_id: string | null;
  phone: string;
  state: string | null;
  context: Record<string, unknown> | null;
  current_quote_id: string | null;
  ai_mode: boolean | null;
  session_mode?: SessionMode;
  assigned_agent_id?: string | null;
  assigned_at?: string | null;
  assigned_by?: string | null;
  started_at: string | null;
  last_message_at: string | null;
  ended_at: string | null;
  message_count: number | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  direction: MessageDirection | string;
  message_type: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  ai_processed: boolean | null;
  ai_response: string | null;
  ai_extracted_data: Record<string, unknown> | null;
  created_at: string | null;
  external_message_id: string | null;
  sent_by_agent_id?: string | null;
  delivery_status?: DeliveryStatus;
  error_message?: string | null;
  sent_at?: string | null;
}

export function deriveSessionMode(conversation: Pick<ChatConversation, 'ai_mode' | 'session_mode'>): SessionMode {
  if (conversation.session_mode === 'bot' || conversation.session_mode === 'human' || conversation.session_mode === 'hybrid') {
    return conversation.session_mode;
  }

  return conversation.ai_mode ? 'bot' : 'human';
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  const message = candidate.message?.toLowerCase() || '';
  return candidate.code === 'PGRST204' || candidate.code === '42703' || message.includes('column');
}
