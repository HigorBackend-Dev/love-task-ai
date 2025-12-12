-- ================================================================
-- MIGRATION: Fix RLS Policies for Profiles
-- Purpose: Corrigir políticas RLS para permitir acesso aos profiles
-- Date: 2025-12-12
-- ================================================================

-- Política para permitir que usuários leiam seus próprios profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Política para permitir que usuários atualizem seus próprios profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Garantir que RLS está habilitado na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- STORAGE POLICIES para avatars
-- ================================================================

-- Política para upload de avatars
DROP POLICY IF EXISTS "Users can upload avatar" ON storage.objects;
CREATE POLICY "Users can upload avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para visualizar avatars
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
CREATE POLICY "Users can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Política para atualizar avatars
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para deletar avatars
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================================
-- VERIFICAÇÃO
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies para profiles corrigidas!';
  RAISE NOTICE '✅ Policies de storage para avatars criadas!';
  RAISE NOTICE '✅ Usuários podem agora acessar seus próprios dados!';
END $$;