import { useState, useEffect } from 'react';
import { Check, Pencil, Trash2, Loader2, Sparkles, X, Save, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Task } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

const MAX_PREVIEW_LENGTH = 150;

export function TaskItem({ task, onToggle, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editError, setEditError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  // AI edit flow
  const [aiMode, setAiMode] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [promptError, setPromptError] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const { suggestEdit, applySuggestedTitle } = useTasks();

  // Update editTitle when task prop changes
  useEffect(() => {
    setEditTitle(task.title);
  }, [task.id, task.title]);

  // Close AI mode when task title actually changes (successful apply)
  useEffect(() => {
    if (aiMode && suggestion && task.title === suggestion) {
      // Task was successfully updated with the suggestion, close the AI mode
      setAiMode(false);
      setPromptText('');
      setSuggestion(null);
      setPromptError(null);
      setIsApplying(false);
    }
  }, [task.title, aiMode, suggestion]);

  const displayTitle = task.status === 'enhanced' && task.enhanced_title ? task.enhanced_title : task.title;
  const isLongText = displayTitle.length > MAX_PREVIEW_LENGTH;

  const handleSave = () => {
    setEditError(null);

    if (!editTitle.trim()) {
      setEditError('Task title cannot be empty.');
      return;
    }

    if (editTitle.trim().length > 5000) {
      setEditError('Task title must be less than 5000 characters.');
      return;
    }

    if (editTitle !== task.title) {
      onUpdate(task.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditError(null);
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
            <div className="flex flex-col gap-2">
                {aiMode ? (
                  <div className="flex-1 space-y-2">
                    {promptError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{promptError}</AlertDescription>
                      </Alert>
                    )}

                    <textarea
                      value={promptText}
                      onChange={(e) => {
                        setPromptText(e.target.value);
                        setPromptError(null);
                      }}
                      className="w-full rounded-md border p-2 text-sm"
                      placeholder="Describe how you want to improve this task title..."
                      rows={3}
                      maxLength={500}
                    />

                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => {
                        if (!promptText.trim()) {
                          setPromptError('Please provide instructions for the AI.');
                          return;
                        }

                        setIsSuggesting(true);
                        setSuggestion(null);
                        setPromptError(null);
                        try {
                          const suggested = await suggestEdit(task.id, promptText);
                          setSuggestion(suggested);
                        } catch (e) {
                          console.error('Suggest error', e);
                          setSuggestion(null);
                          setPromptError('Failed to generate suggestion. Please try again.');
                        } finally {
                          setIsSuggesting(false);
                        }
                      }}>
                        {isSuggesting ? 'Suggesting...' : 'Get Suggestion'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { 
                        setAiMode(false); 
                        setPromptText(''); 
                        setSuggestion(null);
                        setPromptError(null);
                      }}>
                        Cancel
                      </Button>
                    </div>

                    {suggestion && (
                      <div className="p-3 border rounded bg-muted space-y-2">
                        <p className="text-sm font-medium">AI Suggestion:</p>
                        <p className="text-sm text-foreground">{suggestion}</p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={async () => {
                            setIsApplying(true);
                            try {
                              await applySuggestedTitle(task.id, suggestion as string);
                              // Close AI mode immediately on success
                              setAiMode(false);
                              setPromptText('');
                              setSuggestion(null);
                              setPromptError(null);
                            } catch (e) {
                              console.error(e);
                              setPromptError('Failed to apply suggestion. Please try again.');
                            } finally {
                              setIsApplying(false);
                            }
                          }} disabled={isApplying}>
                            {isApplying ? 'Applying...' : 'Apply'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {editError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{editError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editTitle}
                        onChange={(e) => {
                          setEditTitle(e.target.value);
                          setEditError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') handleCancel();
                        }}
                        className="flex-1 rounded-md border p-2 text-sm font-medium min-h-24 w-full"
                        autoFocus
                        maxLength={5000}
                        placeholder="Enter task details..."
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSave}>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </>
                )}
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-foreground leading-relaxed whitespace-pre-wrap break-words",
                    task.is_completed && "line-through text-muted-foreground"
                  )}>
                    {isExpanded ? displayTitle : (isLongText ? displayTitle.substring(0, MAX_PREVIEW_LENGTH) + '...' : displayTitle)}
                  </p>
                  {isLongText && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="mt-2 h-auto p-0 text-xs text-primary hover:bg-transparent"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Show more
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {task.status === 'enhanced' && task.enhanced_title && (
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                )}
              </div>
              
              {task.status === 'enhancing' && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI is improving...</span>
                </div>
              )}
              
              {task.status === 'error' && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Could not enhance this task. The AI service may be temporarily unavailable.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => { 
                setAiMode(true);
                setEditError(null);
                setPromptError(null);
              }}
              className="h-8 w-8"
              title="Get AI suggestion"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setIsEditing(true)}
              className="h-8 w-8"
              title="Edit task"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
