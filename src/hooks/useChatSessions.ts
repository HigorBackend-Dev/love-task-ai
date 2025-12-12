import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatSession, ChatMessage, Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

interface PendingUpdate {
  task_id: string;
  field: string;
  new_value: string;
  old_value: string;
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      return;
    }

    // @ts-expect-error - user_id, message_count, last_message_at not in generated types yet
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return;
    }

    setSessions((data || []).map((s: Record<string, unknown>) => ({
      ...s,
      title: s.title || 'Nova Conversa',
      message_count: s.message_count || 0,
      last_message_at: s.last_message_at || null
    } as ChatSession)));
  }, [user]);

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
    if (!user) {
      toast({
        title: 'Erro ao criar sessão',
        description: 'Você precisa estar autenticado.',
        variant: 'destructive',
      });
      return null;
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ title: 'Nova Conversa', user_id: user.id })
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
      user_id: user.id,
      title: data.title || 'Nova Conversa',
      // @ts-expect-error - message_count not in generated types yet
      message_count: data.message_count || 0,
      // @ts-expect-error - last_message_at not in generated types yet
      last_message_at: data.last_message_at || null
    };
    setSessions(prev => [session, ...prev]);
    setCurrentSession(session);
    setMessages([]);
    setSelectedTask(null);
    return session;
  }, [toast, user]);

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

  // Process direct commands without AI
  const processDirectCommand = useCallback(async (content: string): Promise<boolean> => {
    if (!selectedTask) return false;

    const lowerContent = content.toLowerCase().trim();

    // Ignore very short responses (like "sim", "não", "ok")
    if (lowerContent.length <= 3) {
      return false;
    }

    // Command: Finalizar/Completar task
    if (lowerContent.match(/^(finalizar|completar|concluir|marcar como (finalizada|concluída|completa))(\s|$)/)) {
      await supabase
        .from('tasks')
        .update({ is_completed: true })
        .eq('id', selectedTask.id);

      setSelectedTask(prev => prev ? { ...prev, is_completed: true } : null);
      await addMessage('assistant', `✅ Tarefa "${selectedTask.title}" marcada como finalizada!`);
      
      toast({
        title: 'Tarefa finalizada!',
        description: selectedTask.title,
      });
      return true;
    }

    // Command: Reabrir task
    if (lowerContent.match(/^(reabrir|desmarcar|marcar como pendente|voltar)(\s|$)/)) {
      await supabase
        .from('tasks')
        .update({ is_completed: false })
        .eq('id', selectedTask.id);

      setSelectedTask(prev => prev ? { ...prev, is_completed: false } : null);
      await addMessage('assistant', `🔄 Tarefa "${selectedTask.title}" reaberta!`);
      return true;
    }

    // Command: Deletar task
    if (lowerContent.match(/^(deletar|excluir|remover|apagar)\s+(essa|esta|a)?\s*task/)) {
      await supabase
        .from('tasks')
        .delete()
        .eq('id', selectedTask.id);

      const taskTitle = selectedTask.title;
      setSelectedTask(null);
      await clearTaskSelection();
      await addMessage('assistant', `🗑️ Tarefa "${taskTitle}" foi removida.`);
      
      toast({
        title: 'Tarefa removida',
        description: taskTitle,
      });
      return true;
    }

    // Command: Mudar título direto (sem IA)
    const titleMatch = content.match(/^mudar\s+(o\s+)?t[íi]tulo\s+para:?\s*(.+)$/i);
    if (titleMatch) {
      const newTitle = titleMatch[2].trim();
      
      await supabase
        .from('tasks')
        .update({ title: newTitle })
        .eq('id', selectedTask.id);

      setSelectedTask(prev => prev ? { ...prev, title: newTitle } : null);
      await addMessage('assistant', `✏️ Título atualizado para: "${newTitle}"`);
      
      toast({
        title: 'Título atualizado!',
        description: newTitle,
      });
      return true;
    }

    return false;
  }, [selectedTask, addMessage, clearTaskSelection, toast]);

  // Send message to chatbot
  const sendMessage = useCallback(async (content: string, tasks: Task[]) => {
    let session = currentSession;
    
    if (!session) {
      const newSession = await createSession();
      if (!newSession) return;
      session = newSession;
    }

    await addMessage('user', content);

    // Try to process as direct command first
    const wasDirectCommand = await processDirectCommand(content);
    if (wasDirectCommand) {
      return;
    }

    setIsLoading(true);

    try {
      // Build context for N8N
      const context = {
        message: content,
        selectedTask: selectedTask ? {
          id: selectedTask.id,
          title: selectedTask.title,
          is_completed: selectedTask.is_completed,
          enhanced_title: selectedTask.enhanced_title,
          status: selectedTask.status,
        } : null,
        sessionId: session.id,
        hasTaskSelected: !!selectedTask,
        conversationContext: `Usuário está ${selectedTask ? 'conversando sobre a tarefa: "' + selectedTask.title + '"' : 'em uma conversa geral sem tarefa selecionada'}`,
      };

      console.log('Sending to chatbot via Edge Function:', context);

      const response = await supabase.functions.invoke('chatbot-proxy', {
        body: context,
      });

      console.log('Edge Function response:', response);

      if (response.error) {
        console.error('Edge Function error:', response.error);
        throw new Error(response.error.message || 'Failed to call chatbot');
      }

      const data = response.data;
      console.log('Chatbot response data:', data);

      // Process AI response
      const aiResponse = data?.response || data?.output || data?.message || 'Sem resposta do assistente.';

      // Check if AI wants to update the task with confirmation
      if (data.action === 'update_task' && data.updates && selectedTask) {
        // If requires_confirmation, store pending update
        if (data.requires_confirmation) {
          const firstUpdateField = Object.keys(data.updates)[0];
          const oldValue = firstUpdateField === 'title' 
            ? selectedTask.title 
            : String((selectedTask as unknown as Record<string, unknown>)[firstUpdateField] || '');
          
          await addMessage('assistant', aiResponse, {
            type: 'pending_confirmation',
            pending_update: {
              task_id: selectedTask.id,
              field: firstUpdateField,
              new_value: String(Object.values(data.updates)[0]),
              old_value: String(oldValue),
            },
          });
        } else {
          // Auto-apply update without confirmation (usuário já confirmou)
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
            
            await addMessage('assistant', aiResponse);
            
            const updateField = Object.keys(data.updates)[0];
            toast({
              title: 'Tarefa atualizada!',
              description: `${updateField === 'title' ? 'Título' : updateField} atualizado com sucesso.`,
            });
          } else {
            await addMessage('assistant', '❌ Erro ao atualizar a tarefa. Tente novamente.');
          }
        }
      } else if (data.action === 'complete_task' && selectedTask) {
        // Check if AI wants to complete the task
        await supabase
          .from('tasks')
          .update({ is_completed: true })
          .eq('id', selectedTask.id);

        setSelectedTask(prev => prev ? { ...prev, is_completed: true } : null);
        await addMessage('assistant', aiResponse);
        
        toast({
          title: 'Tarefa finalizada!',
          description: selectedTask.title,
        });
      } else {
        // No action, just add response
        await addMessage('assistant', aiResponse);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Verifique a conexão com o N8N.',
        variant: 'destructive',
      });
      await addMessage('assistant', 'Desculpe, não foi possível processar sua mensagem. Tente usar comandos diretos como: "finalizar essa task" ou "mudar o título para [novo título]".');
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, selectedTask, createSession, addMessage, processDirectCommand, toast]);

  // Confirm pending update
  const confirmUpdate = useCallback(async (messageId: string, pendingUpdate: PendingUpdate) => {
    if (!pendingUpdate || !selectedTask) return;

    const updates = {
      [pendingUpdate.field]: pendingUpdate.new_value,
    };

    const { error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', pendingUpdate.task_id);

    if (!updateError) {
      // Refresh selected task
      const { data: updatedTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', pendingUpdate.task_id)
        .single();
      
      if (updatedTask) {
        setSelectedTask(updatedTask as Task);
      }

      await addMessage('system', '✅ Alteração confirmada e aplicada!');
      
      toast({
        title: 'Tarefa atualizada!',
        description: `${pendingUpdate.field} foi alterado com sucesso.`,
      });
    } else {
      toast({
        title: 'Erro ao atualizar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [selectedTask, addMessage, toast]);

  // Reject pending update
  const rejectUpdate = useCallback(async () => {
    await addMessage('system', '❌ Alteração cancelada.');
  }, [addMessage]);

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
    confirmUpdate,
    rejectUpdate,
  };
}
