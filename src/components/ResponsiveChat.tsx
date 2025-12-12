import React, { useState, useEffect } from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { ChatToggleButton } from '@/components/ChatToggleButton';
import { useChatState } from '@/hooks/useChatState';
import { cn } from '@/lib/utils';
import { ChatMessage, ChatSession, Task } from '@/types/task';

interface ResponsiveChatProps {
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
  onConfirmUpdate: (messageId: string, pendingUpdate: {
    task_id: string;
    field: string;
    new_value: string;
    old_value: string;
  }) => void;
  onRejectUpdate: () => void;
  className?: string;
}

export function ResponsiveChat({
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
  className
}: ResponsiveChatProps) {
  // Responsive chat removed: stub kept to avoid breakage until cleanup is complete.
  return null;
}