import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []) as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Erro ao carregar tarefas',
        description: 'Verifique sua conexão com o Supabase.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createTask = async (title: string): Promise<Task | null> => {
    try {
      const newTask = {
        title,
        enhanced_title: null,
        is_completed: false,
        status: 'pending' as const,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) throw error;

      const taskData = data as Task;
      setTasks(prev => [taskData, ...prev]);
      
      // Trigger enhancement
      enhanceTask(taskData.id, title);
      
      return taskData;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Erro ao criar tarefa',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const enhanceTask = async (taskId: string, title: string) => {
    try {
      // Update status to enhancing
      setTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, status: 'enhancing' as const } : t)
      );

      const { data, error } = await supabase.functions.invoke('enhance-task', {
        body: { taskId, title },
      });

      if (error) throw error;

      // Update task with enhanced title
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, enhanced_title: data.enhanced_title, status: 'enhanced' as const }
            : t
        )
      );
    } catch (error) {
      console.error('Error enhancing task:', error);
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: 'error' as const } : t)
      );
    }
  };

  const updateTask = async (taskId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ title, enhanced_title: null, status: 'pending' })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, title, enhanced_title: null, status: 'pending' as const } : t
        )
      );

      // Re-enhance the task
      enhanceTask(taskId, title);

      toast({
        title: 'Tarefa atualizada',
        description: 'A IA está melhorando o título...',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Erro ao atualizar',
        variant: 'destructive',
      });
    }
  };

  const toggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !task.is_completed })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
        )
      );
    } catch (error) {
      console.error('Error toggling task:', error);
      toast({
        title: 'Erro ao atualizar',
        variant: 'destructive',
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== taskId));
      
      toast({
        title: 'Tarefa removida',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Erro ao remover',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    toggleComplete,
    deleteTask,
    refetch: fetchTasks,
  };
}
