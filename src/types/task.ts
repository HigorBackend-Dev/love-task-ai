export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// AI Response Types
export interface AIUpdateData {
  requires_confirmation?: boolean;
  updates: Record<string, unknown>;
}

export interface AISubtaskData {
  requires_confirmation?: boolean;
  updates?: Record<string, unknown>;
  subtasks?: string[];
}

export interface AISuggestionData {
  suggestions?: string[];
}

export interface AIResponseData {
  response?: string;
  output?: string;
  message?: string;
  action?: 'update_task' | 'update_task_with_subtasks' | 'create_subtasks' | 'complete_task' | 'suggest_improvement';
  updates?: Record<string, unknown>;
  subtasks?: string[];
  suggestions?: string[];
  requires_confirmation?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  enhanced_title: string | null;
  is_completed: boolean;
  status: 'pending' | 'enhancing' | 'enhanced' | 'error';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  parent_task_id?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  selected_task_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  message_count: number;
  last_message_at: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    type?: 'task_list' | 'task_selected' | 'task_updated' | 'pending_confirmation' | 'pending_subtask_creation' | 'suggestion' | 'with_suggestions' | 'normal' | 'confirmed';
    tasks?: Task[];
    selected_task?: Task;
    pending_update?: {
      task_id: string;
      field: string;
      new_value: string;
      old_value: string;
    };
    updates?: Record<string, unknown>;
    subtasks?: string[];
    suggestions?: string[];
    task_id?: string;
    original_type?: string;
    confirmed_at?: string;
  };
  created_at: string;
}
