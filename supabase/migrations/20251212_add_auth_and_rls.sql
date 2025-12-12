-- Add user_id to tasks table
ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Add user_id to chat_sessions table
ALTER TABLE chat_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);

-- Enable Row Level Security (RLS) on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for tasks - users can only see their own tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for tasks - users can insert their own tasks
CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for tasks - users can update their own tasks
CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for tasks - users can delete their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Row Level Security (RLS) on chat_sessions table
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for chat_sessions - users can only see their own sessions
CREATE POLICY "Users can view their own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for chat_sessions - users can insert their own sessions
CREATE POLICY "Users can insert their own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for chat_sessions - users can update their own sessions
CREATE POLICY "Users can update their own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for chat_sessions - users can delete their own sessions
CREATE POLICY "Users can delete their own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Row Level Security (RLS) on chat_messages table
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for chat_messages - users can only see messages from their own sessions
CREATE POLICY "Users can view messages from their own chat sessions"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Create policy for chat_messages - users can insert messages in their own sessions
CREATE POLICY "Users can insert messages in their own chat sessions"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Create policy for chat_messages - users can update messages in their own sessions
CREATE POLICY "Users can update messages in their own chat sessions"
  ON chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Create policy for chat_messages - users can delete messages from their own sessions
CREATE POLICY "Users can delete messages from their own chat sessions"
  ON chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );
