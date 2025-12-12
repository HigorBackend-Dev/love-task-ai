-- Corrigir problemas de RLS e criação de profiles
-- Data: 2025-12-12

-- 1. Garantir que RLS está habilitado
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;

-- 3. Criar políticas mais permissivas temporariamente para debug
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política mais permissiva para insert para garantir que profiles sejam criados
CREATE POLICY "Users can insert their own profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Função melhorada para criar profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Tentar criar profile com tratamento de erro
  BEGIN
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name,
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
      NOW(),
      NOW()
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- Profile já existe, não fazer nada
      NULL;
    WHEN OTHERS THEN
      -- Log error mas não falhar
      RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Criar profiles faltantes para usuários existentes
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.email, ''),
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'User'),
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 7. Garantir que a tabela tem as colunas necessárias para onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_checklist JSONB DEFAULT '{
  "created_task": false,
  "started_chat": false,
  "completed_task": false,
  "used_ai": false
}'::jsonb;

-- 8. Atualizar profiles existentes que não têm dados de onboarding
UPDATE public.profiles 
SET 
  onboarding_completed = COALESCE(onboarding_completed, FALSE),
  onboarding_step = COALESCE(onboarding_step, 0),
  onboarding_skipped = COALESCE(onboarding_skipped, FALSE),
  onboarding_checklist = COALESCE(onboarding_checklist, '{
    "created_task": false,
    "started_chat": false,
    "completed_task": false,
    "used_ai": false
  }'::jsonb)
WHERE 
  onboarding_completed IS NULL 
  OR onboarding_step IS NULL 
  OR onboarding_skipped IS NULL 
  OR onboarding_checklist IS NULL;

-- 9. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed);

-- 10. Função para debug de RLS
CREATE OR REPLACE FUNCTION public.debug_profile_access(user_id UUID)
RETURNS TABLE(
  current_user_id UUID,
  requested_user_id UUID,
  profile_exists BOOLEAN,
  can_access BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    user_id as requested_user_id,
    EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) as profile_exists,
    (auth.uid() = user_id) as can_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;