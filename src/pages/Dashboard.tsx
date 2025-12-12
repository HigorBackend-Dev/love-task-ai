import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { ChatPanel } from '@/components/ChatPanel';
import { OnboardingTour } from '@/components/OnboardingTour';
import { useTasks } from '@/hooks/useTasks';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useProfile } from '@/hooks/useProfile';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, CheckCircle, MessageSquare } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { updateChecklistItem } = useOnboarding();
  const { tasks, isLoading, createTask, updateTask, toggleComplete, deleteTask, refetch } = useTasks();
  const {
    sessions,
    currentSession,
    messages,
    isLoading: chatLoading,
    selectedTask,
    createSession,
    selectSession,
    deleteSession,
    sendMessage,
    selectTaskForChat,
    clearTaskSelection,
    confirmUpdate,
    rejectUpdate,
  } = useChatSessions();

  const handleCreateTask = async (title: string) => {
    await createTask(title);
    updateChecklistItem('created_task', true);
  };

  const handleSendMessage = async (message: string) => {
    await sendMessage(message, tasks);
    updateChecklistItem('started_chat', true);
    // Refresh tasks after AI might have updated them
    await refetch();
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
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{sessions.length} conversas</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task List Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card p-6 rounded-lg border" data-onboarding="task-form">
              <h2 className="text-lg font-semibold text-foreground mb-4">Nova Tarefa</h2>
              <TaskForm onSubmit={handleCreateTask} />
            </div>
            
            <div className="bg-card p-6 rounded-lg border" data-onboarding="task-list">
              <h2 className="text-lg font-semibold text-foreground mb-4">Suas Tarefas</h2>
              <TaskList
                tasks={tasks}
                isLoading={isLoading}
                onToggle={toggleComplete}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            </div>
          </div>
          
          {/* Chat Panel Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 h-[calc(100vh-8rem)]" data-onboarding="chat-panel">
              <ChatPanel
                sessions={sessions}
                currentSession={currentSession}
                messages={messages}
                isLoading={chatLoading}
                selectedTask={selectedTask}
                tasks={tasks}
                onSendMessage={handleSendMessage}
                onCreateSession={createSession}
                onSelectSession={selectSession}
                onDeleteSession={deleteSession}
                onSelectTask={selectTaskForChat}
                onClearTaskSelection={clearTaskSelection}
                onConfirmUpdate={async (messageId, pendingUpdate) => {
                  await confirmUpdate(messageId, pendingUpdate);
                  // Small delay to ensure DB is updated
                  setTimeout(() => refetch(), 300);
                }}
                onRejectUpdate={rejectUpdate}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
