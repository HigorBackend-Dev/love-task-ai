# 🚀 Como Aplicar a Migration - Guia Passo a Passo

## ⚠️ PROBLEMA ATUAL

Você está recebendo estes erros:
```
- Could not find the table 'public.profiles' in the schema cache
- column tasks.user_id does not exist
- column chat_sessions.user_id does not exist
```

**Causa:** A migration SQL ainda não foi executada no banco de dados do Supabase.

---

## 📋 PASSO A PASSO PARA APLICAR A MIGRATION

### 1️⃣ Abra o arquivo da migration

**Arquivo:** `supabase/migrations/20251212_saas_architecture.sql`

📍 Caminho completo: `C:\Users\pf388\OneDrive\Documents\love-task-ai\supabase\migrations\20251212_saas_architecture.sql`

### 2️⃣ Copie TODO o conteúdo do arquivo

```bash
# Abra o arquivo e pressione Ctrl+A para selecionar tudo
# Pressione Ctrl+C para copiar
```

O arquivo começa com:
```sql
-- ================================================
-- LOVE TASK AI - SAAS MULTI-TENANT ARCHITECTURE
-- ================================================
```

E termina com:
```sql
COMMENT ON VIEW user_stats IS 'Analytics view for user statistics';
```

### 3️⃣ Acesse o Supabase SQL Editor

**URL direta:** 
```
https://supabase.com/dashboard/project/cnwnixdqjetjqoxuavsr/sql/new
```

**Ou navegue manualmente:**
1. Vá para: https://supabase.com/dashboard
2. Selecione o projeto: `love-task-ai` (ou `cnwnixdqjetjqoxuavsr`)
3. No menu lateral esquerdo, clique em: **SQL Editor**
4. Clique no botão: **+ New query**

### 4️⃣ Cole e execute a migration

1. **Cole** todo o conteúdo do arquivo no editor SQL
2. Clique no botão **RUN** (canto superior direito)
   - Ou pressione `Ctrl + Enter`

### 5️⃣ Aguarde a execução

- A execução deve levar entre 5-10 segundos
- Você verá uma mensagem de sucesso: ✅ **"Success. No rows returned"**

---

## ✅ VERIFICAR SE DEU CERTO

### Opção A: Verificar no Table Editor

1. No menu lateral, clique em: **Table Editor**
2. Você deve ver estas tabelas:
   - ✅ `profiles` (NOVA!)
   - ✅ `tasks` (com nova coluna `user_id`)
   - ✅ `chat_sessions` (com nova coluna `user_id`)
   - ✅ `chat_messages`

### Opção B: Verificar via SQL

Execute esta query no SQL Editor:

```sql
-- Verificar se a tabela profiles existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) AS profiles_exists;

-- Verificar se user_id existe em tasks
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_name = 'tasks' 
  AND column_name = 'user_id'
) AS tasks_user_id_exists;

-- Verificar se user_id existe em chat_sessions
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_name = 'chat_sessions' 
  AND column_name = 'user_id'
) AS chat_sessions_user_id_exists;
```

**Resultado esperado:**
```
profiles_exists: true
tasks_user_id_exists: true
chat_sessions_user_id_exists: true
```

---

## 🔄 PRÓXIMOS PASSOS APÓS APLICAR A MIGRATION

### 1. Limpe o cache do Supabase

No terminal, execute:
```bash
# Limpar cache local
npm run dev
```

Ou recarregue a página do navegador com `Ctrl + Shift + R`

### 2. Teste o login novamente

1. Faça logout se estiver logado
2. Crie uma nova conta de teste
3. Faça login
4. O sistema deve funcionar sem erros 404/400

### 3. Verifique se o profile foi criado automaticamente

Execute no SQL Editor:
```sql
SELECT * FROM profiles;
```

Você deve ver seu profile criado automaticamente! 🎉

### 4. Regenere os tipos TypeScript (IMPORTANTE!)

```bash
npx supabase gen types typescript --project-id cnwnixdqjetjqoxuavsr > src/integrations/supabase/types.ts
```

### 5. Remova os @ts-expect-error

Depois de regenerar os tipos, remova estas linhas dos arquivos:
- `src/hooks/useProfile.ts` (linhas 18 e 89)
- `src/hooks/useChatSessions.ts` (linha 32)

### 6. Reconstrua o projeto

```bash
npm run build
```

---

## ❌ TROUBLESHOOTING - Se der erro

### Erro: "relation already exists"

Se você receber um erro dizendo que alguma coisa já existe:

**Solução:** Execute esta query primeiro para limpar:
```sql
-- CUIDADO: Isso vai apagar todos os dados!
DROP TABLE IF EXISTS profiles CASCADE;
ALTER TABLE tasks DROP COLUMN IF EXISTS user_id;
ALTER TABLE chat_sessions DROP COLUMN IF EXISTS user_id;
```

Depois execute a migration completa novamente.

### Erro: "permission denied"

**Causa:** Você precisa de permissões de administrador do projeto.

**Solução:** 
- Certifique-se de estar logado na conta certa no Supabase
- Verifique se você é o owner do projeto

### Erro: "cannot drop table because other objects depend on it"

**Solução:** Use `CASCADE` ao dropar:
```sql
DROP TABLE IF EXISTS profiles CASCADE;
```

---

## 🎯 RESUMO RÁPIDO

```bash
# 1. Copie supabase/migrations/20251212_saas_architecture.sql

# 2. Abra https://supabase.com/dashboard/project/cnwnixdqjetjqoxuavsr/sql/new

# 3. Cole o conteúdo e clique em RUN

# 4. Verifique no Table Editor se profiles apareceu

# 5. Recarregue a aplicação (Ctrl+Shift+R)

# 6. Teste o login
```

---

## 🆘 AINDA COM PROBLEMAS?

Se depois de aplicar a migration você ainda receber erros:

1. **Verifique os logs do Supabase:**
   - Menu lateral → Logs → API

2. **Teste a conexão diretamente:**
   ```sql
   SELECT * FROM profiles LIMIT 1;
   SELECT * FROM tasks LIMIT 1;
   SELECT * FROM chat_sessions LIMIT 1;
   ```

3. **Verifique as RLS policies:**
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

4. **Caso nada funcione, me envie:**
   - Screenshot do erro completo
   - Output da migration no SQL Editor
   - Lista de tabelas no Table Editor
