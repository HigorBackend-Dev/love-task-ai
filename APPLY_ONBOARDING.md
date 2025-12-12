# 🚀 Guia: Aplicar Migration de Onboarding

## ❗ Importante
A migration de onboarding está criada mas **NÃO foi aplicada** no banco de dados. Por isso você está vendo erros TypeScript no `useOnboarding.ts`.

## 📋 Passos para Aplicação

### 1. Aplicar Migration no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/cnwnixdqjetjqoxuavsr)
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie o conteúdo do arquivo: `supabase/migrations/20251212_add_onboarding.sql`
5. Cole no editor SQL
6. Clique em **RUN** para executar

**Ou via CLI** (se tiver Supabase CLI instalado):
```bash
supabase db push
```

### 2. Regenerar Tipos TypeScript

Após aplicar a migration, regenere os tipos:

```bash
npx supabase gen types typescript --project-id cnwnixdqjetjqoxuavsr > src/integrations/supabase/types.ts
```

### 3. Remover Comentários Temporários

Após regenerar os tipos, os erros desaparecerão automaticamente. Os comentários `@ts-expect-error` podem ser mantidos ou removidos (são inofensivos).

### 4. Testar Build

```bash
npm run build
```

### 5. Testar Onboarding

1. Crie uma nova conta de teste
2. Faça login
3. Você deve ver o tour de onboarding automaticamente
4. Complete os passos e verifique que funciona

## ✅ Verificação

Após aplicar, verifique que os seguintes campos existem em `profiles`:

```sql
SELECT 
  onboarding_completed,
  onboarding_step,
  onboarding_skipped,
  onboarding_checklist,
  onboarding_completed_at
FROM profiles
LIMIT 1;
```

E que as funções RPC existem:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('complete_onboarding', 'update_onboarding_checklist');
```

## 🎯 Resultado Esperado

- ✅ Sem erros TypeScript em `useOnboarding.ts`
- ✅ Build compila sem erros
- ✅ Novos usuários veem tour de onboarding
- ✅ Checklist é rastreada no banco de dados
- ✅ Analytics disponível em view `onboarding_stats`

## 📚 Documentação

- Técnica: [ONBOARDING_SYSTEM.md](./ONBOARDING_SYSTEM.md)
- Resumo: [ONBOARDING_SUMMARY.md](./ONBOARDING_SUMMARY.md)
