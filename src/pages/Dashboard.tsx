import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
// Chat UI removed per user request
import { useTasks } from '@/hooks/useTasks';
// useChatSessions removed — chat disabled in UI
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogOut, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function Dashboard() {
  const { user, signOut, error: authError, clearError } = useAuth();
  const { profile } = useProfile();
  const { tasks, isLoading, createTask, updateTask, toggleComplete, deleteTask, refetch } = useTasks();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleCreateTask = async (title: string) => {
    await createTask(title);
  };

  const handleSignOut = async () => {
    try {
      setSignOutError(null);
      await signOut();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to sign out. Please try again.';
      setSignOutError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Error Alerts */}
      {authError && (
        <div className="border-b border-destructive bg-destructive/5">
          <div className="container mx-auto px-4 py-3">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {authError}
                <button 
                  onClick={clearError}
                  className="ml-2 font-semibold underline hover:no-underline"
                >
                  Dismiss
                </button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {signOutError && (
        <div className="border-b border-destructive bg-destructive/5">
          <div className="container mx-auto px-4 py-3">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {signOutError}
                <button 
                  onClick={() => setSignOutError(null)}
                  className="ml-2 font-semibold underline hover:no-underline"
                >
                  Dismiss
                </button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      
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
                  <span>{tasks.filter(t => t.is_completed).length} completed</span>
                </div>
                {/* chat removed */}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* New Conversation button removed */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
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
