import { ClipboardList, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';

export function Header() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  
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
              <p className="text-sm text-muted-foreground">Intelligent task management with AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3" data-onboarding="user-profile">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || ''} alt="avatar" />
                <AvatarFallback>
                  {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span>{profile?.full_name || user?.user_metadata?.full_name || user?.email}</span>
            </div>
            <Link to="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
