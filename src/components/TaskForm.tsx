import { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TaskFormProps {
  onSubmit: (title: string) => Promise<void>;
}

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setError(null);

    // Validate input
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    if (title.trim().length > 200) {
      setError('Task title must be less than 200 characters.');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(title.trim());
      setTitle('');
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
      
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          type="text"
          placeholder="Add new task..."
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null); // Clear error on input change
          }}
          className="flex-1 h-12 text-base bg-card border-border focus:ring-2 focus:ring-primary/20"
          disabled={isSubmitting}
          maxLength={200}
        />
        <Button 
          type="submit" 
          disabled={!title.trim() || isSubmitting}
          className="h-12 px-6 gap-2"
        >
          <Plus className="h-5 w-5" />
          {isSubmitting ? 'Creating...' : 'Create'}
        </Button>
      </form>
    </div>
  );
}
