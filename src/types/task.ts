export interface Task {
  id: string;
  title: string;
  enhanced_title: string | null;
  is_completed: boolean;
  status: 'pending' | 'enhancing' | 'enhanced' | 'error';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
