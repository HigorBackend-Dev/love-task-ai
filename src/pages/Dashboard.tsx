import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
// Chat UI removed per user request
import { OnboardingTour } from '@/components/OnboardingTour';
import { useTasks } from '@/hooks/useTasks';
// useChatSessions removed — chat disabled in UI
import { useProfile } from '@/hooks/useProfile';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, CheckCircle, MessageSquare, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { updateChecklistItem } = useOnboarding();
  const { tasks, isLoading, createTask, updateTask, toggleComplete, deleteTask, refetch } = useTasks();
  const handleCreateTask = async (title: string) => {
    await createTask(title);
    updateChecklistItem('created_task', true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Onboarding Tour */}
      <OnboardingTour />
      
      {/* User Info Bar */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4" data-onboarding="user-profile">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {profile?.full_name || user?.email}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>{tasks.filter(t => t.is_completed).length} concluídas</span>
                </div>
                {/* chat removed */}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* New Conversation button removed */}
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Task List Section (full width now that chat removed) */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-card p-6 rounded-lg border" data-onboarding="task-form">
              <h2 className="text-lg font-semibold text-foreground mb-4">New Task</h2>
              <TaskForm onSubmit={handleCreateTask} />
            </div>
            
            <div className="bg-card p-6 rounded-lg border" data-onboarding="task-list">
              <h2 className="text-lg font-semibold text-foreground mb-4">Your Tasks</h2>
              <TaskList
                tasks={tasks}
                isLoading={isLoading}
                onToggle={toggleComplete}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            </div>
          </div>
          
          {/* Chat removed from dashboard UI */}
        </div>
      </main>
      {/* Floating chat removed */}
    </div>
  );
}
