'use client';

import { SessionMode } from '@/lib/chat';

interface ChatControlsProps {
  sessionMode: SessionMode | null;
  agentName: string;
  disabled: boolean;
  onAgentNameChange: (value: string) => void;
  onModeChange: (mode: SessionMode) => Promise<void>;
  onAssign: () => Promise<void>;
}

const modes: SessionMode[] = ['bot', 'human', 'hybrid'];

export function ChatControls({
  sessionMode,
  agentName,
  disabled,
  onAgentNameChange,
  onModeChange,
  onAssign,
}: ChatControlsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">Human-in-the-loop controls</p>
        <p className="text-xs text-gray-600 mt-1">Switch mode, assign an agent, and take over replies.</p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {modes.map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={disabled || sessionMode === mode}
              onClick={() => onModeChange(mode)}
              className={`px-3 py-2 rounded-md text-sm font-semibold capitalize transition-colors ${sessionMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-white'} disabled:cursor-default`}
            >
              {mode}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={agentName}
          onChange={(event) => onAgentNameChange(event.target.value)}
          placeholder="Agent name"
          disabled={disabled}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
        />
        <button
          type="button"
          disabled={disabled || !agentName.trim()}
          onClick={onAssign}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
        >
          Assign
        </button>
      </div>
    </div>
  );
}
