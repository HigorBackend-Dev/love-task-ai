import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Loader2, MessageSquare, Plus, History, X, CheckCircle2, Pencil, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatMessage, ChatSession, Task } from '@/types/task';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  onConfirmUpdate: (messageId: string, pendingUpdate: {
    task_id: string;
    field: string;
    new_value: string;
    old_value: string;
  }) => void;
  onRejectUpdate: () => void;
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
  onConfirmUpdate,
  onRejectUpdate,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Detectar # no final do texto
    if (value.endsWith('#')) {
      setFilteredTasks(tasks);
      setShowTaskDropdown(true);
    } else if (value.includes('#')) {
      // Filtrar tasks baseado no texto após #
      const lastHashIndex = value.lastIndexOf('#');
      const searchTerm = value.slice(lastHashIndex + 1).toLowerCase();
      
      if (searchTerm === '') {
        setFilteredTasks(tasks);
        setShowTaskDropdown(true);
      } else {
        const filtered = tasks.filter(task => 
          task.title.toLowerCase().includes(searchTerm)
        );
        setFilteredTasks(filtered);
        setShowTaskDropdown(filtered.length > 0);
      }
    } else {
      setShowTaskDropdown(false);
    }
  };

  const handleTaskSelect = (task: Task) => {
    // Remove o # e qualquer texto após ele
    const lastHashIndex = input.lastIndexOf('#');
    const newInput = input.slice(0, lastHashIndex);
    
    onSelectTask(task);
    setInput(newInput.trim());
    setShowTaskDropdown(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setShowTaskDropdown(false);
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
            <div className="flex gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Como usar o chat</h4>
                    
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">1. Selecionar uma tarefa:</p>
                        <p className="text-muted-foreground">Digite <code className="bg-muted px-1 rounded">#</code> e escolha uma tarefa</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">2. Comandos rápidos:</p>
                        <ul className="text-muted-foreground space-y-0.5 ml-2">
                          <li>• <code className="bg-muted px-1 rounded">finalizar</code> - Marca como concluída</li>
                          <li>• <code className="bg-muted px-1 rounded">reabrir</code> - Volta para pendente</li>
                          <li>• <code className="bg-muted px-1 rounded">deletar essa task</code> - Remove</li>
                          <li>• <code className="bg-muted px-1 rounded">mudar o título para: [novo]</code> - Atualiza</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">3. Com IA:</p>
                        <ul className="text-muted-foreground space-y-0.5 ml-2">
                          <li>• <code className="bg-muted px-1 rounded">melhore essa task</code></li>
                          <li>• <code className="bg-muted px-1 rounded">me ajude com isso</code></li>
                          <li>• Ou converse naturalmente!</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateSession}
                className="text-primary hover:text-primary/80"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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
                  <p className="text-muted-foreground text-sm mb-4">
                    Como posso ajudar você hoje?
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="space-y-3 w-full max-w-xs">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Ações Rápidas:</p>
                    
                    {!selectedTask ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInput('#')}
                        className="w-full justify-start gap-2"
                      >
                        <span className="font-mono">#</span>
                        Selecionar uma tarefa
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInput('finalizar')}
                          className="w-full justify-start gap-2 text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Finalizar tarefa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInput('melhore essa task')}
                          className="w-full justify-start gap-2 text-blue-600 hover:text-blue-700"
                        >
                          <Bot className="h-4 w-4" />
                          Melhorar com IA
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInput('mudar o título para: ')}
                          className="w-full justify-start gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          Mudar título
                        </Button>
                      </div>
                    )}
                  </div>
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

                            {/* Confirmation Buttons */}
                            {message.metadata?.type === 'pending_confirmation' && message.metadata.pending_update && (
                              <div className="mt-3 space-y-2 p-3 bg-primary/5 rounded-md border border-primary/20">
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <p><strong>Tarefa:</strong> {message.metadata.pending_update.old_value}</p>
                                  <p><strong>Nova descrição:</strong> {message.metadata.pending_update.new_value}</p>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (message.metadata?.pending_update) {
                                        onConfirmUpdate(message.id, message.metadata.pending_update);
                                      }
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Sim, confirmar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={onRejectUpdate}
                                    className="flex-1"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Não
                                  </Button>
                                </div>
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
              <form onSubmit={handleSubmit} className="p-4 border-t relative">
                {/* Task Dropdown */}
                {showTaskDropdown && filteredTasks.length > 0 && (
                  <div className="absolute bottom-full left-4 right-4 mb-2 bg-popover border rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-50">
                    <div className="p-2 space-y-1">
                      {filteredTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => handleTaskSelect(task)}
                          className="w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors flex items-center gap-2"
                        >
                          {task.is_completed && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate">{task.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Command Suggestions */}
                {selectedTask && !input && messages.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setInput('finalizar')}
                      className="h-7 text-xs gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Finalizar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setInput('melhore essa task')}
                      className="h-7 text-xs gap-1"
                    >
                      <Bot className="h-3 w-3" />
                      Melhorar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setInput('mudar o título para: ')}
                      className="h-7 text-xs gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      Mudar título
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setInput('deletar essa task')}
                      className="h-7 text-xs gap-1 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Deletar
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder={selectedTask ? "Digite um comando ou mensagem..." : "Digite # para selecionar uma tarefa..."}
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
