-- ================================================================
-- MIGRATION: Onboarding System
-- Purpose: Adicionar tracking de onboarding para novos usuários
-- Date: 2025-12-12
-- ================================================================

-- Adicionar campos de onboarding ao profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS onboarding_checklist JSONB DEFAULT '{
    "created_task": false,
    "completed_task": false,
    "started_chat": false,
    "viewed_dashboard": false
  }'::jsonb;

-- Índice para queries de onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding 
  ON public.profiles(onboarding_completed) 
  WHERE onboarding_completed = false;

-- Função para marcar onboarding como completo
CREATE OR REPLACE FUNCTION public.complete_onboarding(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET 
    onboarding_completed = true,
    onboarding_completed_at = NOW(),
    onboarding_step = 999
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar checklist de onboarding
CREATE OR REPLACE FUNCTION public.update_onboarding_checklist(
  user_id UUID,
  checklist_item TEXT,
  completed BOOLEAN DEFAULT true
)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET onboarding_checklist = jsonb_set(
    onboarding_checklist,
    ARRAY[checklist_item],
    to_jsonb(completed)
  )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para analytics de onboarding
CREATE OR REPLACE VIEW public.onboarding_stats AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as completed,
  COUNT(*) FILTER (WHERE onboarding_skipped = true) as skipped,
  COUNT(*) FILTER (WHERE onboarding_completed = false AND onboarding_skipped = false) as in_progress,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE onboarding_completed = true) / NULLIF(COUNT(*), 0),
    2
  ) as completion_rate
FROM public.profiles
WHERE created_at > NOW() - INTERVAL '30 days';

COMMENT ON VIEW public.onboarding_stats IS 'Estatísticas de onboarding dos últimos 30 dias';

-- ================================================================
-- VERIFICAÇÃO
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Onboarding system adicionado com sucesso!';
  RAISE NOTICE '✅ Campos: onboarding_completed, onboarding_step, onboarding_checklist';
  RAISE NOTICE '✅ Funções: complete_onboarding(), update_onboarding_checklist()';
END $$;
