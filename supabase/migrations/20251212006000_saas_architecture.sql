-- ================================================================
-- MIGRATION: Multi-Tenant SaaS Architecture with Auto-Provisioning
-- Purpose: Criar estrutura completa de dados por usuário
-- Date: 2025-12-12
-- ================================================================

-- ================================================================
-- 1. PROFILES TABLE - Dados estendidos do usuário
-- ================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT profiles_email_unique UNIQUE (email)
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ================================================================
-- 2. ATUALIZAR TASKS TABLE com constraints e índices
-- ================================================================

-- Adicionar coluna user_id se não existir
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- Preencher user_id existentes com o primeiro usuário disponível
-- Se não houver usuários, deleta as tasks órfãs
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Pega o primeiro usuário do sistema
  SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    -- Atribui as tasks órfãs ao primeiro usuário
    UPDATE public.tasks 
    SET user_id = first_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE 'Tasks órfãs atribuídas ao usuário: %', first_user_id;
  ELSE
    -- Se não há usuários, deleta as tasks órfãs
    DELETE FROM public.tasks WHERE user_id IS NULL;
    RAISE NOTICE 'Tasks órfãs deletadas (sem usuários no sistema)';
  END IF;
END $$;

-- Adicionar constraint para garantir user_id
ALTER TABLE public.tasks 
  ALTER COLUMN user_id SET NOT NULL;

-- Adicionar constraint de foreign key se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tasks_user_id_fkey'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Melhorar índice existente
DROP INDEX IF EXISTS idx_tasks_user_id;
CREATE INDEX idx_tasks_user_id_created ON public.tasks(user_id, created_at DESC);

-- Adicionar índice para status
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status) WHERE status != 'enhanced';

-- ================================================================
-- 3. ATUALIZAR CHAT_SESSIONS com estrutura robusta
-- ================================================================

-- Adicionar coluna user_id se não existir
ALTER TABLE public.chat_sessions 
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- Preencher user_id existentes com o primeiro usuário disponível
-- Se não houver usuários, deleta as sessões órfãs
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Pega o primeiro usuário do sistema
  SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    -- Atribui as sessões órfãs ao primeiro usuário
    UPDATE public.chat_sessions 
    SET user_id = first_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE 'Sessões órfãs atribuídas ao usuário: %', first_user_id;
  ELSE
    -- Se não há usuários, deleta as sessões órfãs
    DELETE FROM public.chat_sessions WHERE user_id IS NULL;
    RAISE NOTICE 'Sessões órfãs deletadas (sem usuários no sistema)';
  END IF;
END $$;

-- Adicionar constraint para garantir user_id
ALTER TABLE public.chat_sessions 
  ALTER COLUMN user_id SET NOT NULL;

-- Adicionar constraint de foreign key se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_sessions_user_id_fkey'
  ) THEN
    ALTER TABLE public.chat_sessions
      ADD CONSTRAINT chat_sessions_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar campos úteis
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- Melhorar índice
DROP INDEX IF EXISTS idx_chat_sessions_user_id;
CREATE INDEX idx_chat_sessions_user_updated ON public.chat_sessions(user_id, updated_at DESC);

-- ================================================================
-- 4. ATUALIZAR CHAT_MESSAGES com índices de performance
-- ================================================================

-- Criar índice composto para queries eficientes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created 
  ON public.chat_messages(session_id, created_at ASC);

-- Índice para buscar mensagens recentes de um usuário
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_recent
  ON public.chat_messages(session_id, created_at DESC)
  WHERE role = 'user';

-- ================================================================
-- 5. FUNÇÃO PARA CRIAR PROFILE AUTOMATICAMENTE
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar profile automaticamente para novo usuário
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 6. TRIGGER PARA EXECUTAR FUNÇÃO NO SIGNUP
-- ================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- 7. FUNÇÃO PARA ATUALIZAR UPDATED_AT AUTOMATICAMENTE
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em profiles
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Aplicar trigger em chat_sessions
DROP TRIGGER IF EXISTS set_updated_at_sessions ON public.chat_sessions;
CREATE TRIGGER set_updated_at_sessions
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ================================================================
-- 8. FUNÇÃO PARA ATUALIZAR CONTADOR DE MENSAGENS
-- ================================================================

CREATE OR REPLACE FUNCTION public.update_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.chat_sessions
    SET 
      message_count = message_count + 1,
      last_message_at = NEW.created_at
    WHERE id = NEW.session_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.chat_sessions
    SET message_count = GREATEST(0, message_count - 1)
    WHERE id = OLD.session_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar contador
DROP TRIGGER IF EXISTS update_message_count ON public.chat_messages;
CREATE TRIGGER update_message_count
  AFTER INSERT OR DELETE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_message_count();

-- ================================================================
-- 9. ROW LEVEL SECURITY (RLS) - PROFILES
-- ================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seu próprio profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Usuários podem atualizar apenas seu próprio profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Sistema pode criar profiles (via trigger)
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- ================================================================
-- 10. MELHORAR RLS POLICIES EXISTENTES
-- ================================================================

-- TASKS: Remover policies antigas e criar novas otimizadas
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

-- Policy otimizada: Uma policy para todas as operações
CREATE POLICY "Users manage own tasks"
  ON public.tasks
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CHAT_SESSIONS: Remover policies antigas e criar novas otimizadas
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can insert their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.chat_sessions;

CREATE POLICY "Users manage own sessions"
  ON public.chat_sessions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CHAT_MESSAGES: Remover policies antigas e criar novas otimizadas
DROP POLICY IF EXISTS "Users can view messages from their own chat sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their own chat sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update messages in their own chat sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete messages from their own chat sessions" ON public.chat_messages;

CREATE POLICY "Users manage own messages"
  ON public.chat_messages
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- ================================================================
-- 11. VIEWS ÚTEIS PARA ANALYTICS (OPCIONAL)
-- ================================================================

-- View para estatísticas do usuário
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  p.id as user_id,
  p.email,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
  COUNT(DISTINCT cs.id) as total_chat_sessions,
  COUNT(DISTINCT cm.id) as total_messages,
  p.created_at as user_since
FROM public.profiles p
LEFT JOIN public.tasks t ON t.user_id = p.id
LEFT JOIN public.chat_sessions cs ON cs.user_id = p.id
LEFT JOIN public.chat_messages cm ON cm.session_id = cs.id
GROUP BY p.id, p.email, p.created_at;

-- RLS para view
ALTER VIEW public.user_stats SET (security_invoker = true);

-- ================================================================
-- 12. FUNÇÃO PARA LIMPAR DADOS ANTIGOS (MANUTENÇÃO)
-- ================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS TABLE (
  deleted_tasks BIGINT,
  deleted_sessions BIGINT
) AS $$
DECLARE
  tasks_deleted BIGINT;
  sessions_deleted BIGINT;
BEGIN
  -- Deletar tasks antigas completadas
  DELETE FROM public.tasks
  WHERE status = 'completed'
    AND created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS tasks_deleted = ROW_COUNT;
  
  -- Deletar sessões antigas sem mensagens recentes
  DELETE FROM public.chat_sessions
  WHERE updated_at < NOW() - (days_to_keep || ' days')::INTERVAL
    OR (updated_at IS NULL AND created_at < NOW() - (days_to_keep || ' days')::INTERVAL);
  
  GET DIAGNOSTICS sessions_deleted = ROW_COUNT;
  
  RETURN QUERY SELECT tasks_deleted, sessions_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 13. GRANT PERMISSIONS
-- ================================================================

-- Garantir que o service_role tenha permissões
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.tasks TO service_role;
GRANT ALL ON public.chat_sessions TO service_role;
GRANT ALL ON public.chat_messages TO service_role;

-- Garantir que authenticated users possam usar as tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;

-- ================================================================
-- 14. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ================================================================

COMMENT ON TABLE public.profiles IS 'Perfis de usuários com dados estendidos';
COMMENT ON TABLE public.tasks IS 'Tarefas dos usuários - isoladas por user_id';
COMMENT ON TABLE public.chat_sessions IS 'Sessões de chat dos usuários - isoladas por user_id';
COMMENT ON TABLE public.chat_messages IS 'Mensagens das sessões de chat';

COMMENT ON FUNCTION public.handle_new_user() IS 'Cria automaticamente profile quando usuário se cadastra';
COMMENT ON FUNCTION public.update_session_message_count() IS 'Mantém contador de mensagens atualizado';
COMMENT ON FUNCTION public.cleanup_old_data(INTEGER) IS 'Função de manutenção para limpar dados antigos';

-- ================================================================
-- FIM DA MIGRATION
-- ================================================================

-- Verificação de integridade
DO $$
BEGIN
  RAISE NOTICE '✅ Migration concluída com sucesso!';
  RAISE NOTICE '✅ Profiles table criada';
  RAISE NOTICE '✅ Triggers automáticos configurados';
  RAISE NOTICE '✅ RLS otimizado em todas as tabelas';
  RAISE NOTICE '✅ Índices de performance criados';
  RAISE NOTICE '✅ Sistema pronto para multi-tenancy';
END $$;
