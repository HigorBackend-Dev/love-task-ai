import { useState, useEffect, useCallback } from 'react';

interface UseChatStateOptions {
  onOpen?: () => void;
  onClose?: () => void;
  persistState?: boolean;
  defaultOpen?: boolean;
}

export function useChatState(options: UseChatStateOptions = {}) {
  const {
    onOpen,
    onClose,
    persistState = true,
    defaultOpen = false
  } = options;

  const [isOpen, setIsOpen] = useState(() => {
    if (!persistState) return defaultOpen;
    
    try {
      const stored = localStorage.getItem('chat-panel-open');
      return stored ? JSON.parse(stored) : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);

  // Persist state changes
  useEffect(() => {
    if (persistState) {
      try {
        localStorage.setItem('chat-panel-open', JSON.stringify(isOpen));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [isOpen, persistState]);

  // Reset unread count when opening
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const addUnreadMessage = useCallback(() => {
    if (!isOpen) {
      setUnreadCount(count => count + 1);
      setLastMessageTime(Date.now());
    }
  }, [isOpen]);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    isOpen,
    unreadCount,
    lastMessageTime,
    open,
    close,
    toggle,
    addUnreadMessage,
    clearUnreadCount
  };
}