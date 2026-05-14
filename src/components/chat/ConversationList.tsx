'use client';

import { ChatConversation, SessionMode } from '@/lib/chat';

interface ConversationListProps {
  conversations: ChatConversation[];
  selectedConversationId: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
}

function getModeClass(mode: SessionMode): string {
  switch (mode) {
    case 'bot':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'human':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'hybrid':
      return 'bg-purple-100 text-purple-800 border-purple-200';
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'No activity';
  }

  return new Date(value).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ConversationList({
  conversations,
  selectedConversationId,
  searchTerm,
  onSearchTermChange,
  onSelectConversation,
}: ConversationListProps) {
  return (
    <aside className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[640px]">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">WhatsApp Inbox</h2>
            <p className="text-sm text-gray-600">{conversations.length} conversations</p>
          </div>
          <div className="bg-green-500 w-2 h-2 rounded-full animate-pulse" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Search phone number..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <p className="font-medium text-gray-900">No conversations found</p>
            <p className="text-sm mt-1">WhatsApp traffic will appear here once messages are logged.</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const mode = conversation.session_mode || (conversation.ai_mode ? 'bot' : 'human');
            const selected = selectedConversationId === conversation.id;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selected ? 'bg-blue-50' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{conversation.phone}</p>
                    <p className="text-xs text-gray-600 truncate">{conversation.state || 'open'} · {conversation.message_count || 0} messages</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full border text-xs font-semibold capitalize ${getModeClass(mode)}`}>
                    {mode}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-3">{formatDate(conversation.last_message_at)}</p>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
