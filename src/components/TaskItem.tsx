import { useState } from 'react';
import { Check, Pencil, Trash2, Loader2, Sparkles, X, Save } from 'lucide-react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onUpdate(task.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div className={cn(
      "group p-4 rounded-lg border bg-card transition-all duration-200",
      "hover:shadow-md hover:border-primary/20",
      task.is_completed && "opacity-60"
    )}>
      <div className="flex items-start gap-4">
        <Checkbox
          checked={task.is_completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-1 h-5 w-5"
        />
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleSave}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <p className={cn(
                  "font-medium text-foreground leading-relaxed flex-1",
                  task.is_completed && "line-through text-muted-foreground"
                )}>
                  {task.status === 'enhanced' && task.enhanced_title ? task.enhanced_title : task.title}
                </p>
                {task.status === 'enhanced' && task.enhanced_title && (
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                )}
              </div>
              
              {task.status === 'enhancing' && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Melhorando com IA...</span>
                </div>
              )}
              
              {task.status === 'error' && (
                <p className="text-sm text-destructive mt-2">
                  Não foi possível melhorar esta tarefa.
                </p>
              )}
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setIsEditing(true)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
