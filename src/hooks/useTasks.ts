import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .returns<Task[]>();

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error loading tasks',
        description: 'Check your connection to Supabase.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  const createTask = async (title: string): Promise<Task | null> => {
    if (!user) {
      toast({
        title: 'Error creating task',
        description: 'You need to be authenticated.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const newTask = {
        title,
        enhanced_title: null,
        is_completed: false,
        status: 'pending' as const,
        user_id: user.id,
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
        title: 'Error creating task',
        description: 'Try again.',
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

      console.log('Calling Edge Function with:', { taskId, title });
      
      const response = await supabase.functions.invoke('enhance-task', {
        body: { taskId, title, mode: 'enhance' },
      });

      console.log('Raw Edge Function response:', response);
      
      const { data, error } = response;

      if (error) {
        console.error('Edge Function error:', error);
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        throw new Error(`Edge Function failed: ${errorMsg}`);
      }

      if (!data) {
        throw new Error('No response data from Edge Function');
      }

      console.log('Enhanced task data:', data);
      console.log('Enhanced title from response:', data?.enhanced_title);

      // Verify if we got the enhanced title back
      if (data && data.enhanced_title) {
        // Update the title in database to the enhanced version
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ title: data.enhanced_title })
          .eq('id', taskId);

        if (updateError) {
          console.error('Error updating title:', updateError);
        }

        // Update task with enhanced title from response
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId
              ? { ...t, title: data.enhanced_title, enhanced_title: data.enhanced_title, status: 'enhanced' as const }
              : t
          )
        );
        
        toast({
          title: 'Task improved!',
          description: 'The title was enhanced by AI.',
        });
      } else {
        // If no enhanced title in response, fetch from database
        console.log('No enhanced_title in response, fetching from database...');
        const { data: taskData, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single();

        if (fetchError) throw fetchError;

        if (taskData && taskData.enhanced_title) {
          // Update the title to match enhanced title
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ title: taskData.enhanced_title })
            .eq('id', taskId);

          if (updateError) {
            console.error('Error updating title:', updateError);
          }

          setTasks(prev =>
            prev.map(t =>
              t.id === taskId
                ? { ...t, title: taskData.enhanced_title, enhanced_title: taskData.enhanced_title, status: 'enhanced' as const }
                : t
            )
          );
          
          toast({
            title: 'Task improved!',
            description: 'The title was enhanced by AI.',
          });
        }
      }
    } catch (error) {
      console.error('Error enhancing task:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: 'error' as const } : t)
      );
      
      toast({
        title: 'Error enhancing task',
        description: `AI processing failed: ${errorMsg}. Make sure N8N webhook is configured.`,
        variant: 'destructive',
      });
    }
  };

  // Suggest an edit via AI without applying it to the DB
  const suggestEdit = async (taskId: string, prompt: string): Promise<string | null> => {
    try {
      // Find current task title
      const task = tasks.find(t => t.id === taskId);
      const currentTitle = task ? task.title : '';

      console.log('Calling suggest Edge Function with:', { taskId, title: currentTitle, prompt });
      
      const response = await supabase.functions.invoke('enhance-task', {
        body: { taskId, title: currentTitle, user_prompt: prompt, mode: 'suggest' },
      });

      console.log('Suggest response:', response);
      
      const { data, error } = response;
      if (error) {
        console.error('Edge Function error (suggest):', error);
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        throw new Error(`Edge Function error: ${errorMsg}`);
      }

      if (!data) {
        throw new Error('No data returned from Edge Function');
      }

      if (data && data.enhanced_title) {
        return data.enhanced_title as string;
      }
      
      console.warn('No enhanced_title in response:', data);
      return null;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error suggesting edit:', errorMsg);
      toast({
        title: 'AI Suggestion Error',
        description: `Could not get suggestion: ${errorMsg}`,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Apply a suggested title (user confirmed)
  const applySuggestedTitle = async (taskId: string, suggestedTitle: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ title: suggestedTitle, enhanced_title: suggestedTitle, status: 'enhanced' })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, title: suggestedTitle, enhanced_title: suggestedTitle, status: 'enhanced' as const } : t));

      toast({
        title: 'Suggestion applied',
        description: 'The task title was updated.',
      });
    } catch (error) {
      console.error('Error applying suggested title:', error);
      toast({
        title: 'Error',
        description: 'Could not apply the suggestion.',
        variant: 'destructive',
      });
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
        title: 'Task updated',
        description: 'AI is improving the title...',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error updating task',
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
        title: 'Error toggling task',
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
        title: 'Task removed',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error deleting task',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchTasks();

    // Subscribe to realtime updates for enhanced titles
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('Task updated via realtime:', payload);
          const updatedTask = payload.new as Task;
          
          setTasks(prev => {
            const updated = prev.map(t =>
              t.id === updatedTask.id
                ? updatedTask
                : t
            );
            console.log('Tasks after realtime update:', updated);
            return updated;
          });
          
          // Show notification if title was updated from chat
          const oldTask = payload.old as Task;
          if (oldTask && updatedTask.title !== oldTask.title) {
            toast({
              title: 'Task updated!',
              description: `Title changed to: ${updatedTask.title}`,
            });
          }
          
          // Show notification if enhanced_title was updated
          if (updatedTask.enhanced_title && updatedTask.status === 'enhanced') {
            toast({
              title: 'Task improved!',
              description: 'The title was enhanced by AI.',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks, toast]);

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    toggleComplete,
    deleteTask,
    refetch: fetchTasks,
    suggestEdit,
    applySuggestedTitle,
  };
}
