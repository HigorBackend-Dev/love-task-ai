// Chat UI removed: minimal stub kept to avoid import errors while cleaning up codebase.
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Hash,
  CheckCircle2,
  Sparkles,
  Bot,
  MessageSquare,
  Plus,
  HelpCircle,
  User,
  ArrowUp,
  Loader2,
  Send,
  X,
  Clock,
  Trash2,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/types/task';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface ChatSession {
  id: string;
  title: string;
  message_count?: number;
  last_message_at?: string;
}

interface ChatPanelProps {
  onSelectTask?: (task: Task) => void;
  selectedTask?: Task | null;
  onClearTaskSelection?: () => void;
  onConfirmUpdate?: (messageId: string, update: Record<string, unknown>) => void;
  onRejectUpdate?: () => void;
  onCreateSession?: () => void;
  onSelectSession?: (session: ChatSession) => void;
  onDeleteSession?: (sessionId: string) => void;
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ChatPanel({
  onSelectTask,
  selectedTask = null,
  onClearTaskSelection,
  onConfirmUpdate,
  onRejectUpdate,
  onCreateSession,
  onSelectSession,
  onDeleteSession,
}: ChatPanelProps) {
  const { tasks } = useTasks();
  const chatSessions = useChatSessions();

  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
      setShowTaskDropdown(e.target.value.includes('#'));
    },
    []
  );

  const handleQuickAction = useCallback(
    (action: string) => {
      setInput(action);
      setShowTaskDropdown(action === '#');
    },
    []
  );

  const handleTaskSelect = useCallback(
    (task: Task) => {
      onSelectTask?.(task);
      setShowTaskDropdown(false);
    },
    [onSelectTask]
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) e.preventDefault();
      if (!input.trim() || isLoading) return;
      
      // Add message to conversation
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: input,
        role: 'user',
        created_at: new Date().toISOString(),
      }]);
      setInput('');
    },
    [input, isLoading]
  );

  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[300px]">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Ready to chat!</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm">
        Create a new conversation or select an existing one to get started.
      </p>
      <Button onClick={() => onCreateSession?.()} className="gap-2">
        <Plus className="h-4 w-4" />
        Start New Chat
      </Button>
    </div>
  );

  const filteredTasks = useMemo(
    () => tasks.filter((task) => !task.is_completed || selectedTask?.id === task.id),
    [tasks, selectedTask]
  );

  const renderMessage = (message: ChatMessage) => (
    <div
      key={message.id}
      className={cn(
        "flex gap-3 mb-4 animate-in slide-in-from-bottom-3 fade-in-0 duration-500 chat-message-enter",
        message.role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {message.role === 'assistant' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center mt-0.5 shadow-sm ring-1 ring-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200",
          message.role === 'user'
            ? 'bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-primary/20'
            : 'bg-gradient-to-br from-card via-card/98 to-card/95 border border-border/50 hover:border-border/80'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        
        {/* Task List Buttons */}
        {message.metadata?.type === 'task_list' && message.metadata.tasks && (
          <div className="mt-3 space-y-2">
            {(message.metadata.tasks as Task[]).map((task: Task) => (
              <Button
                key={task.id}
                variant="outline"
                size="sm"
                onClick={() => onSelectTask?.(task)}
                className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-muted/50"
              >
                <div className="flex items-center gap-2 w-full">
                  {task.is_completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  )}
                  <span className="truncate flex-1">{task.title}</span>
                </div>
              </Button>
            ))}
          </div>
        )}

        {/* Pending Updates */}
        {message.metadata?.type === 'pending_confirmation' && message.metadata.pending_update && (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
              <strong>Task:</strong> {String((message.metadata.pending_update as Record<string, unknown>).old_value)}
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              <strong>New Description:</strong> {String((message.metadata.pending_update as Record<string, unknown>).new_value)}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onConfirmUpdate?.(message.id, message.metadata?.pending_update as Record<string, unknown> || {})}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onRejectUpdate}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                No
              </Button>
            </div>
          </div>
        )}

        {/* Confirmed Updates */}
        {message.metadata?.type === 'confirmed' && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <CheckCircle2 className="h-4 w-4 inline mr-1" />
              ✅ Alteração confirmada e aplicada com sucesso!
            </p>
          </div>
        )}

        {/* Pending Subtask Creation */}
        {message.metadata?.type === 'pending_subtask_creation' && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              <strong>🎯 Estruturar projeto em etapas:</strong>
            </p>
            {message.metadata.subtasks && (
              <div className="mb-3">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">Subtarefas propostas:</p>
                <ul className="list-disc list-inside space-y-1">
                  {(message.metadata.subtasks as string[]).map((subtask: string, index: number) => (
                    <li key={index} className="text-sm text-blue-800 dark:text-blue-200">
                      {subtask}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onConfirmUpdate?.(message.id, {
                  task_id: message.metadata.task_id || selectedTask?.id || '',
                  field: 'subtasks',
                  new_value: 'create_subtasks',
                  old_value: selectedTask?.title || '',
                  subtasks: message.metadata.subtasks as string[],
                  updates: message.metadata.updates as Record<string, unknown>
                })}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Criar etapas
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onRejectUpdate}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
        
        {message.role === 'assistant' && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
            <span className="text-xs text-muted-foreground">
              AI Assistant
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(message.created_at)}
            </span>
          </div>
        )}
      </div>

      {message.role === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center mt-0.5 shadow-sm ring-1 ring-blue-500/20">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );

  return (
    <Card className="flex flex-col h-full bg-background">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'history')} className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-card/80 via-card/90 to-card/80 backdrop-blur-md shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center shadow-sm ring-1 ring-primary/10">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">AI Assistant</h2>
                  <p className="text-xs text-muted-foreground">Always here to help</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCreateSession?.()}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:scale-105 transition-all duration-200 chat-button-hover"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:scale-105 transition-all duration-200 chat-button-hover">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">How to use the AI Assistant</h4>
                        <p className="text-xs text-muted-foreground">
                          Chat naturally or use these commands:
                        </p>
                      </div>
                      
                      <div className="space-y-3 text-xs">
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-xs">#</code>
                          <span className="ml-2 text-muted-foreground">Select a task</span>
                        </div>
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-xs">complete</code>
                          <span className="ml-2 text-muted-foreground">Mark task as done</span>
                        </div>
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-xs">improve this task</code>
                          <span className="ml-2 text-muted-foreground">Enhance with AI</span>
                        </div>
                        <div>
                          <code className="bg-muted px-2 py-1 rounded text-xs">change title to: [new]</code>
                          <span className="ml-2 text-muted-foreground">Update task title</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3" />
                        <span>Or just chat naturally about your tasks!</span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-muted/50 to-muted/30 p-1">
              <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-background data-[state=active]:to-background/90 data-[state=active]:shadow-sm">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-background data-[state=active]:to-background/90 data-[state=active]:shadow-sm">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Selected Task Display */}
          {selectedTask && activeTab === 'chat' && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/8 via-primary/5 to-primary/8 border border-primary/30 rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {selectedTask.is_completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-primary flex-shrink-0 animate-pulse" />
                  )}
                  <span className="text-sm font-medium truncate">{selectedTask.title}</span>
                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/20">Selected</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearTaskSelection}
                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0">
          {/* Messages Area */}
          <div className="flex-1 relative">
            <ScrollArea className="h-full chat-scroll" ref={scrollRef}>
              <div className="p-4 space-y-4 chat-messages">
                {!currentSession ? (
                  renderEmptyState()
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Ready to assist!</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                      How can I help you manage your tasks today?
                    </p>
                    
                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                      {!selectedTask ? (
                        <Button
                          variant="outline"
                          onClick={() => handleQuickAction('#')}
                          className="col-span-2 gap-2"
                        >
                          <Hash className="h-4 w-4" />
                          Select a task
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleQuickAction('complete')}
                            className="gap-2 text-green-600"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Complete
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleQuickAction('improve this task')}
                            className="gap-2 text-blue-600"
                          >
                            <Sparkles className="h-4 w-4" />
                            Enhance
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </>
                )}
                
                {isLoading && (
                  <div className="flex justify-start mb-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center shadow-sm ring-1 ring-primary/10">
                        <Bot className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                      <div className="bg-gradient-to-br from-card via-card/98 to-card/95 border border-border/50 rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full typing-dot" />
                          <div className="w-2 h-2 bg-primary rounded-full typing-dot" />
                          <div className="w-2 h-2 bg-primary rounded-full typing-dot" />
                          </div>
                          <span className="text-sm text-muted-foreground">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Scroll to Bottom Button */}
            {showScrollToBottom && (
              <Button
                onClick={scrollToBottom}
                className="absolute bottom-4 right-4 rounded-full h-10 w-10 p-0 shadow-lg bg-gradient-to-br from-background via-background/95 to-background/90 border border-border/50 hover:border-primary/30 hover:scale-105 transition-all duration-200 animate-in slide-in-from-bottom-2"
                variant="outline"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Input Area */}
          {currentSession && (
            <div className="border-t bg-card/50 p-4 chat-input">
              <form onSubmit={handleSubmit} className="relative">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      placeholder={selectedTask ? `Chat about "${selectedTask.title}"...` : "Type # to select a task or chat naturally..."}
                      disabled={isLoading}
                      className="pr-12 py-6 text-base rounded-2xl border-border/50 focus:border-primary/50 bg-background chat-focusable"
                    />
                    
                    {/* Task Dropdown */}
                    {showTaskDropdown && (
                      <div className="absolute bottom-full mb-2 w-full bg-popover border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {filteredTasks.length > 0 ? (
                          <div className="p-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Select a task:</p>
                            {filteredTasks.map((task) => (
                              <button
                                key={task.id}
                                onClick={() => handleTaskSelect(task)}
                                className="w-full text-left p-2 hover:bg-muted rounded-md flex items-center gap-2"
                              >
                                {task.is_completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                                )}
                                <span className="text-sm truncate">{task.title}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            No tasks found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="rounded-2xl px-6 bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg chat-button-hover chat-focusable"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Press Enter to send • Type # to select tasks
                  </p>
                  {selectedTask && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedTask.title}
                    </Badge>
                  )}
                </div>
              </form>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0">
          <div className="p-4 h-full">
            <ScrollArea className="h-full">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">No conversations yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium mb-4">Recent conversations</p>
                  {sessions.map((session) => (
                    <Card
                      key={session.id}
                      className={cn(
                        "p-4 cursor-pointer transition-all hover:shadow-md border",
                        currentSession?.id === session.id
                          ? "ring-2 ring-primary/20 border-primary/50"
                          : "hover:border-border"
                      )}
                      onClick={() => onSelectSession?.(session)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{session.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {session.message_count || 0} messages
                          </p>
                          {session.last_message_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(session.last_message_at)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession?.(session.id);
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
