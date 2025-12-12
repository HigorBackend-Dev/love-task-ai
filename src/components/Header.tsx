import { ClipboardList, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export function Header() {
  const { user, signOut } = useAuth();
  
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Task Manager</h1>
              <p className="text-sm text-muted-foreground">Gerenciamento inteligente de tarefas com IA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3" data-onboarding="user-profile">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.user_metadata?.full_name || user?.email}</span>
            </div>
            <Link to="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Configurações
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
