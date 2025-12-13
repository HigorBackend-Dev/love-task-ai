import { useRef, useEffect, useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TaskFormProps {
  onSubmit: (title: string) => Promise<void>;
}

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setError(null);

    // Validate input
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    if (title.trim().length > 5000) {
      setError('Task title must be less than 5000 characters.');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(title.trim());
      setTitle('');
      adjustHeight();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while creating the task.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            placeholder="Add new task..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
              adjustHeight();
            }}
            className="flex-1 rounded-md border border-input bg-card p-3 text-base resize-none focus:ring-2 focus:ring-primary/20 focus-visible:outline-none overflow-hidden"
            disabled={isSubmitting}
            maxLength={5000}
            style={{ minHeight: '40px' }}
            rows={1}
          />
          <Button 
            type="submit" 
            disabled={!title.trim() || isSubmitting}
            className="h-10 px-6 gap-2 self-start mt-1"
          >
            <Plus className="h-5 w-5" />
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
}
