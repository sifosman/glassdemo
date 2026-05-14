'use client';

import { ChatConversation, ChatMessage } from '@/lib/chat';

interface ChatThreadProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  loading: boolean;
}

function formatTime(value: string | null): string {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChatThread({ conversation, messages, loading }: ChatThreadProps) {
  if (!conversation) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-center min-h-[420px]">
        <div className="text-center px-6">
          <p className="text-lg font-semibold text-gray-900">Select a conversation</p>
          <p className="text-sm text-gray-600 mt-1">Choose a WhatsApp thread to view message history.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-center min-h-[420px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[420px]">
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-gray-600">
            <div>
              <p className="font-medium text-gray-900">No messages yet</p>
              <p className="text-sm mt-1">Inbound and manual outbound messages will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const outbound = message.direction === 'outbound';
              const status = message.delivery_status || (message.external_message_id ? 'sent' : null);

              return (
                <div key={message.id} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${outbound ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'}`}>
                    {message.media_url && (
                      <a href={message.media_url} target="_blank" rel="noreferrer" className={`text-sm underline ${outbound ? 'text-blue-100' : 'text-blue-600'}`}>
                        View {message.media_type || message.message_type}
                      </a>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content || message.ai_response || '[No text content]'}</p>
                    <div className={`mt-2 flex items-center justify-end gap-2 text-xs ${outbound ? 'text-blue-100' : 'text-gray-500'}`}>
                      {status && <span className="capitalize">{status}</span>}
                      <span>{formatTime(message.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
