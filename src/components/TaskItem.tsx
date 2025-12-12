import { useState } from 'react';
import { Check, Pencil, Trash2, Loader2, Sparkles, X, Save } from 'lucide-react';
import { Task } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
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
  // AI edit flow
  const [aiMode, setAiMode] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const { suggestEdit, applySuggestedTitle } = useTasks();

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
          {isEditing || aiMode ? (
            <div className="flex gap-2">
                {aiMode ? (
                  <div className="flex-1">
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      className="w-full rounded-md border p-2 text-sm"
                      placeholder="Descreva como você quer melhorar o título desta tarefa..."
                      rows={3}
                    />

                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={async () => {
                        setIsSuggesting(true);
                        setSuggestion(null);
                        try {
                          const suggested = await suggestEdit(task.id, promptText);
                          setSuggestion(suggested);
                        } catch (e) {
                          console.error('Suggest error', e);
                          setSuggestion(null);
                        } finally {
                          setIsSuggesting(false);
                        }
                      }}>
                        {isSuggesting ? 'Sugestando...' : 'Sugerir'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAiMode(false); setPromptText(''); setSuggestion(null); }}>
                        Cancelar
                      </Button>
                    </div>

                    {suggestion && (
                      <div className="mt-3 p-3 border rounded bg-muted">
                        <p className="text-sm font-medium">Sugestão:</p>
                        <p className="mt-1">{suggestion}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={async () => {
                            setIsApplying(true);
                            try {
                              await applySuggestedTitle(task.id, suggestion as string);
                              // Do not call onUpdate here — applySuggestedTitle updates state and DB
                              // and we must avoid re-triggering the enhancement flow.
                              setAiMode(false);
                              setPromptText('');
                              setSuggestion(null);
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setIsApplying(false);
                            }
                          }}>
                            {isApplying ? 'Aplicando...' : 'Confirmar'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
                  <span>Enhancing with AI...</span>
                </div>
              )}
              
              {task.status === 'error' && (
                <p className="text-sm text-destructive mt-2">
                  Could not enhance this task.
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
              onClick={() => { setAiMode(true); setIsEditing(false); }}
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
