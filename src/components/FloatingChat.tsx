import React, { useState, useEffect } from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { Button } from '@/components/ui/button';
import { X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

interface ChatSession {
  id: string;
  title: string;
  message_count?: number;
  last_message_at?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface FloatingChatProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  selectedTask: Task | null;
  tasks: Task[];
  onSendMessage: (message: string, tasks: Task[]) => void;
  onCreateSession: () => void;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onSelectTask: (task: Task) => void;
  onClearTaskSelection: () => void;
  onConfirmUpdate: (messageId: string, pendingUpdate: Record<string, unknown>) => void;
  onRejectUpdate: () => void;
}

export function FloatingChat({
  isOpen,
  onClose,
  sessions,
  currentSession,
  messages,
  isLoading,
  selectedTask,
  tasks,
  onSendMessage,
  onCreateSession,
  onSelectSession,
  onDeleteSession,
  onSelectTask,
  onClearTaskSelection,
  onConfirmUpdate,
  onRejectUpdate,
}: FloatingChatProps) {
  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out',
      isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
    )}>
      {isOpen && (
        <div className="w-96 h-[600px] bg-background rounded-lg shadow-lg border border-border flex flex-col animate-in slide-in-from-bottom-4 fade-in-0 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-card/80 via-card/90 to-card/80">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">AI Chat</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Panel Content */}
          <ChatPanel
            selectedTask={selectedTask}
            onSelectTask={onSelectTask}
            onClearTaskSelection={onClearTaskSelection}
            onConfirmUpdate={onConfirmUpdate}
            onRejectUpdate={onRejectUpdate}
            onCreateSession={onCreateSession}
            onSelectSession={onSelectSession}
            onDeleteSession={onDeleteSession}
          />
        </div>
      )}
    </div>
  );
}