import { ClipboardList } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Task Manager</h1>
            <p className="text-sm text-muted-foreground">Gerenciamento inteligente de tarefas com IA</p>
          </div>
        </div>
      </div>
    </header>
  );
}
