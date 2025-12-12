import { Header } from '@/components/Header';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { OnboardingTour } from '@/components/OnboardingTour';
import { useTasks } from '@/hooks/useTasks';
// Chat removed from index page
import { useOnboarding } from '@/hooks/useOnboarding';

const Index = () => {
  const { tasks, isLoading, createTask, updateTask, toggleComplete, deleteTask, refetch } = useTasks();
  const { updateChecklistItem } = useOnboarding();
  const handleCreateTask = async (title: string) => {
    await createTask(title);
    // Marcar que usuário criou uma tarefa
    updateChecklistItem('created_task');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8" data-onboarding="dashboard">
        <div className="grid grid-cols-1 gap-8">
          {/* Task List Section (full width) */}
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
          
          {/* Chat removed from index page */}
        </div>
      </main>

      {/* Onboarding Tour */}
      <OnboardingTour />
    </div>
  );
};

export default Index;
