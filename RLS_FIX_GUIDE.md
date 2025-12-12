# Correção de Problemas RLS - Guia de Aplicação

## Problema Identificado

Os erros **406** e **400** são causados por políticas RLS (Row Level Security) mal configuradas no Supabase, especificamente:

1. Usuários não conseguem ler seus próprios profiles
2. Upload de avatar falhando por política de storage
3. Queries de onboarding retornando erro 406

## Solução

### 1. Aplicar Migration RLS

Execute a migration criada para corrigir as políticas:

```sql
-- No Supabase Dashboard > SQL Editor
-- Execute o conteúdo do arquivo: 20251212_fix_rls_policies.sql
```

**OU** aplicar via CLI:

```bash
npx supabase db push
```

### 2. Verificar Bucket de Storage

No Supabase Dashboard > Storage:

1. Verificar se bucket "avatars" existe
2. Se não existir, criar com:
   - Name: `avatars`
   - Public: `true`
   - File size limit: `1MB`

### 3. Testar Funcionalidades

Após aplicar as correções:

✅ **Profile Loading**: Deve carregar sem erro 406
✅ **Avatar Upload**: Deve funcionar sem erro 400/RLS
✅ **Onboarding**: Deve carregar estado corretamente

## Mudanças no Código

### Hook useProfile.ts
- ✅ Melhor tratamento de erro 406
- ✅ Fallback para profile mínimo
- ✅ Remove toast de erro desnecessário

### Hook useOnboarding.ts  
- ✅ Detecta erro RLS e usa estado padrão
- ✅ Não falha se tabela não existir
- ✅ Auto-ativa onboarding para novos usuários

### Settings.tsx
- ✅ Upload de avatar com estrutura de pasta (`userId/avatar_*.jpg`)
- ✅ `upsert: true` para permitir sobrescrita
- ✅ Melhor logs de erro para debug
- ✅ Continua funcionando mesmo com falha parcial

## Políticas RLS Criadas

```sql
-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Storage Avatars
CREATE POLICY "Users can upload avatar" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view avatars" ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

## Resultado Esperado

Após aplicar todas as correções:
- ✅ Sistema carrega sem erros no console
- ✅ Upload de avatar funciona
- ✅ Onboarding aparece para novos usuários  
- ✅ Profile é exibido corretamente
- ✅ Chat funciona sem problemas RLS

## Como Aplicar

1. **Via Supabase Dashboard**:
   - Acesse SQL Editor
   - Cole o conteúdo da migration `20251212_fix_rls_policies.sql`
   - Execute

2. **Via CLI** (recomendado):
   ```bash
   npx supabase db push
   ```

3. **Verificar Storage**:
   - Vá em Storage > Create bucket se "avatars" não existir
   - Configure como público

4. **Testar aplicação**:
   ```bash
   npm run dev
   ```

## Monitoramento

Para verificar se as correções funcionaram:

```sql
-- Verificar policies criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles') 
AND schemaname = 'public';

-- Verificar storage policies
SELECT * FROM storage.policies 
WHERE bucket_id = 'avatars';
```