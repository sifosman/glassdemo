'use client';

import { FormEvent, useState } from 'react';
import { SessionMode } from '@/lib/chat';

interface MessageComposerProps {
  disabled: boolean;
  sending: boolean;
  sessionMode: SessionMode | null;
  onSend: (content: string, takeover: boolean) => Promise<void>;
}

export function MessageComposer({ disabled, sending, sessionMode, onSend }: MessageComposerProps) {
  const [content, setContent] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = content.trim();

    if (!trimmedContent || disabled || sending) {
      return;
    }

    await onSend(trimmedContent, sessionMode === 'bot');
    setContent('');
  };

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      {sessionMode === 'bot' && (
        <div className="mb-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-3 py-2 text-sm">
          Sending a reply will switch this conversation to human mode.
        </div>
      )}
      <div className="flex items-end gap-3">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={disabled || sending}
          placeholder={disabled ? 'Select a conversation to reply...' : 'Type a manual WhatsApp reply...'}
          className="flex-1 min-h-[48px] max-h-36 resize-none px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 text-sm"
        />
        <button
          type="submit"
          disabled={disabled || sending || !content.trim()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
        >
          {sending ? 'Sending' : 'Send'}
        </button>
      </div>
    </form>
  );
}
