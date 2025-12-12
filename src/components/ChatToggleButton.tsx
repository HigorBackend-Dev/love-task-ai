import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChatToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
  hasActiveSession?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function ChatToggleButton({
  isOpen,
  onToggle,
  unreadCount = 0,
  hasActiveSession = false,
  isLoading = false,
  className
}: ChatToggleButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Show tooltip for first-time users
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('chat-tooltip-seen');
    if (!hasSeenTooltip && !isOpen) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        // Hide tooltip after 5 seconds
        setTimeout(() => {
          setShowTooltip(false);
          localStorage.setItem('chat-tooltip-seen', 'true');
        }, 5000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Tooltip for first-time users */}
      {showTooltip && !isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-popover border border-border rounded-lg shadow-lg animate-in slide-in-from-bottom-2 duration-300 z-50">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">AI Assistant Ready!</p>
              <p className="text-xs text-muted-foreground">
                Click here to chat with your AI assistant
              </p>
            </div>
          </div>
          <div className="absolute bottom-[-6px] right-4 w-3 h-3 bg-popover border-r border-b border-border rotate-45"></div>
        </div>
      )}

      {/* Main Toggle Button */}
      <Button
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative h-14 w-14 rounded-full shadow-lg transition-all duration-300 ease-out",
          "bg-gradient-to-br from-primary to-primary/80",
          "hover:from-primary/90 hover:to-primary/70 hover:shadow-xl hover:scale-105",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "group floating-chat-button",
          isOpen && "rotate-180",
          className
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        size="icon"
      >
        {/* Background pulse effect when active */}
        {(hasActiveSession || isLoading) && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/80 animate-pulse opacity-75" />
        )}
        
        {/* Icon container */}
        <div className="relative z-10 transition-transform duration-300 ease-out group-hover:scale-110">
          {isOpen ? (
            <X className="h-6 w-6 text-primary-foreground" />
          ) : (
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && !isOpen && (
          <div className="absolute top-0 right-0 w-3 h-3">
            <div className="w-full h-full rounded-full bg-blue-500 animate-pulse" />
          </div>
        )}

        {/* Unread indicator */}
        {unreadCount > 0 && !isOpen && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold min-w-[20px] rounded-full animate-bounce"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}

        {/* Active session indicator */}
        {hasActiveSession && !isOpen && !unreadCount && (
          <div className="absolute top-0 right-0 w-3 h-3">
            <div className="w-full h-full rounded-full bg-green-500 border-2 border-background animate-pulse" />
          </div>
        )}
      </Button>

      {/* Hover tooltip */}
      {isHovered && !showTooltip && !isOpen && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-popover border border-border rounded-md shadow-lg animate-in slide-in-from-bottom-1 duration-200 whitespace-nowrap">
          <span className="text-sm font-medium">AI Assistant</span>
          {hasActiveSession && (
            <div className="flex items-center gap-1 mt-0.5">
              <Zap className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">Active chat</span>
            </div>
          )}
          <div className="absolute bottom-[-6px] right-4 w-3 h-3 bg-popover border-r border-b border-border rotate-45"></div>
        </div>
      )}
    </div>
  );
}