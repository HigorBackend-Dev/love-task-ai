import { Header } from '@/components/Header';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { ChatPanel } from '@/components/ChatPanel';
import { useTasks } from '@/hooks/useTasks';
import { useChatbot } from '@/hooks/useChatbot';

const Index = () => {
  const { tasks, isLoading, createTask, updateTask, toggleComplete, deleteTask } = useTasks();
  const { messages, isLoading: chatLoading, sendMessage, clearMessages } = useChatbot();

  const handleCreateTask = async (title: string) => {
    await createTask(title);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task List Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Nova Tarefa</h2>
              <TaskForm onSubmit={handleCreateTask} />
            </div>
            
            <div className="bg-card p-6 rounded-lg border">
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
            <div className="sticky top-8 h-[calc(100vh-8rem)]">
              <ChatPanel
                messages={messages}
                isLoading={chatLoading}
                onSendMessage={sendMessage}
                onClear={clearMessages}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
