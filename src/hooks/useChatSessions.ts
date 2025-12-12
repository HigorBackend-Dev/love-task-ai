import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatSession, ChatMessage, Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return;
    }

    setSessions((data || []).map(s => ({
      ...s,
      title: s.title || 'Nova Conversa'
    })) as ChatSession[]);
  }, []);

  // Fetch messages for current session
  const fetchMessages = useCallback(async (sessionId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages((data || []).map(m => ({
      ...m,
      role: m.role as 'user' | 'assistant' | 'system',
      metadata: m.metadata as ChatMessage['metadata'],
    })));
  }, []);

  // Create new session
  const createSession = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ title: 'Nova Conversa' })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Erro ao criar sessão',
        variant: 'destructive',
      });
      return null;
    }

    const session: ChatSession = {
      ...data,
      title: data.title || 'Nova Conversa'
    };
    setSessions(prev => [session, ...prev]);
    setCurrentSession(session);
    setMessages([]);
    setSelectedTask(null);
    return session;
  }, [toast]);

  // Select a session
  const selectSession = useCallback(async (session: ChatSession) => {
    setCurrentSession(session);
    await fetchMessages(session.id);
    
    // Load selected task if exists
    if (session.selected_task_id) {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', session.selected_task_id)
        .single();
      
      if (data) {
        setSelectedTask(data as Task);
      }
    } else {
      setSelectedTask(null);
    }
  }, [fetchMessages]);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting session:', error);
      return;
    }

    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      setMessages([]);
      setSelectedTask(null);
    }
  }, [currentSession]);

  // Add message to database
  const addMessage = useCallback(async (
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: ChatMessage['metadata']
  ) => {
    if (!currentSession) return null;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSession.id,
        role,
        content,
        metadata: (metadata as Json) || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    const message: ChatMessage = {
      ...data,
      role: data.role as 'user' | 'assistant' | 'system',
      metadata: data.metadata as ChatMessage['metadata'],
    };
    setMessages(prev => [...prev, message]);

    // Update session timestamp
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentSession.id);

    return message;
  }, [currentSession]);

  // Select a task for the conversation
  const selectTaskForChat = useCallback(async (task: Task) => {
    if (!currentSession) return;

    setSelectedTask(task);

    await supabase
      .from('chat_sessions')
      .update({ selected_task_id: task.id })
      .eq('id', currentSession.id);

    await addMessage('system', `Tarefa selecionada: "${task.title}"`, {
      type: 'task_selected',
      selected_task: task,
    });
  }, [currentSession, addMessage]);

  // Clear task selection
  const clearTaskSelection = useCallback(async () => {
    if (!currentSession) return;

    setSelectedTask(null);

    await supabase
      .from('chat_sessions')
      .update({ selected_task_id: null })
      .eq('id', currentSession.id);
  }, [currentSession]);

  // Send message to chatbot
  const sendMessage = useCallback(async (content: string, tasks: Task[]) => {
    let session = currentSession;
    
    if (!session) {
      const newSession = await createSession();
      if (!newSession) return;
      session = newSession;
    }

    // Check if user is requesting task list with #
    if (content.trim() === '#') {
      await addMessage('user', content);
      
      if (tasks.length === 0) {
        await addMessage('assistant', 'Você não tem nenhuma tarefa cadastrada ainda.');
      } else {
        await addMessage('assistant', 'Aqui estão suas tarefas. Clique em uma para selecioná-la:', {
          type: 'task_list',
          tasks,
        });
      }
      return;
    }

    await addMessage('user', content);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { 
          message: content,
          selectedTask: selectedTask,
          sessionId: session.id,
        },
      });

      if (error) throw error;

      // Check if AI wants to update the task
      if (data.action === 'update_task' && data.updates && selectedTask) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update(data.updates)
          .eq('id', selectedTask.id);

        if (!updateError) {
          // Refresh selected task
          const { data: updatedTask } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', selectedTask.id)
            .single();
          
          if (updatedTask) {
            setSelectedTask(updatedTask as Task);
          }
        }
      }

      // Check if AI wants to complete the task
      if (data.action === 'complete_task' && selectedTask) {
        await supabase
          .from('tasks')
          .update({ is_completed: true })
          .eq('id', selectedTask.id);

        setSelectedTask(prev => prev ? { ...prev, is_completed: true } : null);
      }

      await addMessage('assistant', data.response || 'Sem resposta do assistente.');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Verifique a conexão com o N8N.',
        variant: 'destructive',
      });
      await addMessage('assistant', 'Desculpe, não foi possível processar sua mensagem.');
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, selectedTask, createSession, addMessage, toast]);

  // Initialize
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    currentSession,
    messages,
    isLoading,
    selectedTask,
    createSession,
    selectSession,
    deleteSession,
    sendMessage,
    selectTaskForChat,
    clearTaskSelection,
  };
}
