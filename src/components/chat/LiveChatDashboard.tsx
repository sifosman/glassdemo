'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChatControls } from '@/components/chat/ChatControls';
import { ChatThread } from '@/components/chat/ChatThread';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { ChatConversation, ChatMessage, deriveSessionMode, SessionMode } from '@/lib/chat';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function readJson(response: Response) {
  return await response.json().catch(() => ({ error: 'Invalid server response' }));
}

export function LiveChatDashboard() {
  const [adminPassword, setAdminPassword] = useState(() => (
    typeof window === 'undefined' ? '' : window.sessionStorage.getItem('owd-chat-admin-password') || ''
  ));
  const [authenticatedPassword, setAuthenticatedPassword] = useState(() => (
    typeof window === 'undefined' ? '' : window.sessionStorage.getItem('owd-chat-admin-password') || ''
  ));
  const [agentName, setAgentName] = useState(() => (
    typeof window === 'undefined' ? 'OWD Agent' : window.sessionStorage.getItem('owd-chat-agent-name') || 'OWD Agent'
  ));
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const selectedMode = selectedConversation ? deriveSessionMode(selectedConversation) : null;

  const authHeaders = useMemo(() => ({ 'x-chat-admin-password': authenticatedPassword }), [authenticatedPassword]);

  useEffect(() => {
    if (!authenticatedPassword) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      setLoadingConversations(true);
      const params = new URLSearchParams();

      if (searchTerm.trim()) {
        params.set('q', searchTerm.trim());
      }

      const response = await fetch(`/api/chat/conversations?${params.toString()}`, { headers: authHeaders });
      const result = await readJson(response);

      if (response.ok && result.success) {
        const nextConversations = result.conversations || [];
        setConversations(nextConversations);
        setSelectedConversationId((current) => current || nextConversations[0]?.id || null);
        setStatusMessage(null);
      } else {
        setStatusMessage(result.error || 'Failed to load conversations');
      }

      setLoadingConversations(false);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [authenticatedPassword, authHeaders, searchTerm]);

  useEffect(() => {
    if (!selectedConversationId || !authenticatedPassword) {
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      const response = await fetch(`/api/chat/conversations/${selectedConversationId}/messages`, { headers: authHeaders });
      const result = await readJson(response);

      if (response.ok && result.success) {
        setMessages(result.messages || []);
      } else {
        setStatusMessage(result.error || 'Failed to load messages');
      }

      setLoadingMessages(false);
    };

    loadMessages();
  }, [selectedConversationId, authenticatedPassword, authHeaders]);

  useEffect(() => {
    if (!authenticatedPassword) {
      return;
    }

    const channel = supabase
      .channel('owd-live-chat-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
        const nextConversation = payload.new as ChatConversation;

        if (!nextConversation?.id) {
          return;
        }

        const normalizedConversation = {
          ...nextConversation,
          session_mode: deriveSessionMode(nextConversation),
        };

        setConversations((current) => {
          const existingIndex = current.findIndex((conversation) => conversation.id === normalizedConversation.id);

          if (existingIndex === -1) {
            return [normalizedConversation, ...current];
          }

          const next = [...current];
          next[existingIndex] = { ...next[existingIndex], ...normalizedConversation };
          return next.sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authenticatedPassword]);

  useEffect(() => {
    if (!selectedConversationId || !authenticatedPassword) {
      return;
    }

    const channel = supabase
      .channel(`owd-live-chat-messages-${selectedConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          const nextMessage = payload.new as ChatMessage;

          if (!nextMessage?.id) {
            return;
          }

          setMessages((current) => current.some((message) => message.id === nextMessage.id) ? current : [...current, nextMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId, authenticatedPassword]);

  const authenticate = () => {
    const trimmedPassword = adminPassword.trim();
    setAuthenticatedPassword(trimmedPassword);
    window.sessionStorage.setItem('owd-chat-admin-password', trimmedPassword);
  };

  const saveAgentName = (value: string) => {
    setAgentName(value);
    window.sessionStorage.setItem('owd-chat-agent-name', value);
  };

  const updateMode = async (mode: SessionMode) => {
    if (!selectedConversationId) {
      return;
    }

    const response = await fetch(`/api/chat/conversations/${selectedConversationId}/mode`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ session_mode: mode }),
    });
    const result = await readJson(response);

    if (!response.ok || !result.success) {
      setStatusMessage(result.error || 'Failed to update session mode');
      return;
    }

    setConversations((current) => current.map((conversation) => (
      conversation.id === selectedConversationId
        ? { ...conversation, session_mode: mode, ai_mode: mode === 'bot' || mode === 'hybrid' }
        : conversation
    )));
    setStatusMessage(`Conversation switched to ${mode} mode.`);
  };

  const assignConversation = async () => {
    if (!selectedConversationId) {
      return;
    }

    const response = await fetch(`/api/chat/conversations/${selectedConversationId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ assigned_agent_id: agentName.trim(), assigned_by: agentName.trim() }),
    });
    const result = await readJson(response);

    if (!response.ok || !result.success) {
      setStatusMessage(result.error || 'Failed to assign conversation');
      return;
    }

    setConversations((current) => current.map((conversation) => (
      conversation.id === selectedConversationId
        ? { ...conversation, assigned_agent_id: agentName.trim() }
        : conversation
    )));
    setStatusMessage('Conversation assigned.');
  };

  const sendReply = async (content: string, takeover: boolean) => {
    if (!selectedConversationId) {
      return;
    }

    setSending(true);
    const response = await fetch(`/api/chat/conversations/${selectedConversationId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ content, takeover, agent_id: agentName.trim() || 'OWD Agent' }),
    });
    const result = await readJson(response);
    setSending(false);

    if (!response.ok || !result.success) {
      setStatusMessage(result.error || 'Failed to send reply');
      return;
    }

    if (result.message) {
      setMessages((current) => current.some((message) => message.id === result.message.id) ? current : [...current, result.message]);
    }

    if (takeover) {
      setConversations((current) => current.map((conversation) => (
        conversation.id === selectedConversationId
          ? { ...conversation, session_mode: 'human', ai_mode: false, assigned_agent_id: agentName.trim() || 'OWD Agent' }
          : conversation
      )));
    }

    setStatusMessage('Manual WhatsApp reply sent.');
  };

  if (!authenticatedPassword) {
    return (
      <div className="min-h-[520px] flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900">Live Chat Access</h2>
          <p className="text-sm text-gray-600 mt-2">Enter the admin password configured in Vercel to access WhatsApp conversations.</p>
          <input
            type="password"
            value={adminPassword}
            onChange={(event) => setAdminPassword(event.target.value)}
            className="w-full mt-6 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Admin password"
          />
          <button
            type="button"
            onClick={authenticate}
            disabled={!adminPassword.trim()}
            className="w-full mt-4 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Live Chat</h1>
          <p className="text-sm text-gray-600 mt-1">Monitor messages, take over bot sessions, and send manual replies.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.sessionStorage.removeItem('owd-chat-admin-password');
            setAuthenticatedPassword('');
          }}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Lock chat
        </button>
      </div>

      {statusMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 flex items-center justify-between gap-4">
          <span>{statusMessage}</span>
          <button type="button" className="font-semibold" onClick={() => setStatusMessage(null)}>Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSelectConversation={setSelectedConversationId}
        />

        <div className="space-y-4 min-w-0">
          <ChatControls
            sessionMode={selectedMode}
            agentName={agentName}
            disabled={!selectedConversation}
            onAgentNameChange={saveAgentName}
            onModeChange={updateMode}
            onAssign={assignConversation}
          />
          <ChatThread conversation={selectedConversation} messages={messages} loading={loadingMessages || loadingConversations} />
          <MessageComposer disabled={!selectedConversation} sending={sending} sessionMode={selectedMode} onSend={sendReply} />
        </div>
      </div>
    </div>
  );
}
