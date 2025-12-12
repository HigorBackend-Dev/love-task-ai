import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Loader2, MessageSquare, Plus, History, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatMessage, ChatSession, Task } from '@/types/task';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ChatPanelProps {
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
}

export function ChatPanel({
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
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), tasks);
    setInput('');
  };

  const handleTaskClick = (task: Task) => {
    onSelectTask(task);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border">
      {/* Header with Tabs */}
      <div className="border-b">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'history')}>
          <div className="flex items-center justify-between p-2">
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="chat" className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                <History className="h-3 w-3 mr-1" />
                Histórico
              </TabsTrigger>
            </TabsList>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateSession}
              className="text-primary hover:text-primary/80"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected Task Badge */}
          {selectedTask && activeTab === 'chat' && (
            <div className="px-3 pb-2">
              <Badge variant="secondary" className="flex items-center gap-2 w-full justify-between py-1.5">
                <span className="truncate text-xs">
                  {selectedTask.is_completed && <CheckCircle2 className="h-3 w-3 inline mr-1 text-green-500" />}
                  {selectedTask.title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearTaskSelection}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}

          <TabsContent value="chat" className="m-0 flex-1 flex flex-col">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4 h-[400px]" ref={scrollRef}>
              {!currentSession ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Bot className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm mb-3">
                    Inicie uma nova conversa para interagir com o assistente.
                  </p>
                  <Button onClick={onCreateSession} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Conversa
                  </Button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Bot className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Digite <span className="font-mono bg-muted px-1 rounded">#</span> para listar suas tarefas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.role === 'system' ? (
                        <div className="text-center py-2">
                          <Badge variant="outline" className="text-xs">
                            {message.content}
                          </Badge>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "flex gap-3",
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-4 py-2",
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            
                            {/* Task List Buttons */}
                            {message.metadata?.type === 'task_list' && message.metadata.tasks && (
                              <div className="mt-3 space-y-2">
                                {message.metadata.tasks.map((task) => (
                                  <Button
                                    key={task.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTaskClick(task)}
                                    className="w-full justify-start text-left h-auto py-2 px-3"
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      {task.is_completed && (
                                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                      )}
                                      <span className="truncate">{task.title}</span>
                                    </div>
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                          {message.role === 'user' && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                              <User className="h-4 w-4 text-secondary-foreground" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            {currentSession && (
              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite # para ver tarefas..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>

          <TabsContent value="history" className="m-0">
            <ScrollArea className="h-[500px]">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Nenhuma conversa ainda.
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                        currentSession?.id === session.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => {
                        onSelectSession(session);
                        setActiveTab('chat');
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(session.updated_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
