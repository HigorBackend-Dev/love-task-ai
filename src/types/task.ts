export interface Task {
  id: string;
  title: string;
  enhanced_title: string | null;
  is_completed: boolean;
  status: 'pending' | 'enhancing' | 'enhanced' | 'error';
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  selected_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    type?: 'task_list' | 'task_selected' | 'task_updated' | 'pending_confirmation';
    tasks?: Task[];
    selected_task?: Task;
    pending_update?: {
      task_id: string;
      field: string;
      new_value: string;
      old_value: string;
    };
  };
  created_at: string;
}
