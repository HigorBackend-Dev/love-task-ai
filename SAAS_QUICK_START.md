# 🚀 Guia Rápido - Arquitetura SaaS Multi-Tenant

## ⚡ Implementação em 5 Minutos

### 1️⃣ Aplicar Migration

**Via Supabase Dashboard:**

1. Acesse **SQL Editor**
2. Cole o conteúdo de: `supabase/migrations/20251212_saas_architecture.sql`
3. Clique em **Run**
4. Aguarde: ✅ Migration concluída!

**Via CLI (alternativa):**

```bash
supabase db push
```

---

### 2️⃣ Verificar Instalação

Execute no SQL Editor:

```sql
-- Verificar se profiles existe
SELECT * FROM public.profiles LIMIT 1;

-- Verificar triggers
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Verificar RLS
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
```

**Resultado esperado:**
- ✅ Tabela profiles existe
- ✅ Trigger on_auth_user_created encontrado
- ✅ Policies para todas as tabelas

---

### 3️⃣ Testar Auto-Provisioning

**Criar usuário de teste:**

```typescript
// No console do navegador ou em teste
const { data, error } = await supabase.auth.signUp({
  email: 'teste@example.com',
  password: 'teste123'
});

if (!error) {
  console.log('✅ Usuário criado:', data.user?.id);
}
```

**Verificar profile criado:**

```sql
-- No SQL Editor
SELECT * FROM public.profiles 
WHERE email = 'teste@example.com';
```

**Resultado esperado:**
```
id                  | email              | full_name | avatar_url | created_at
--------------------|-------------------|-----------|------------|------------
uuid-aqui...        | teste@example.com | null      | null       | 2025-12-12
```

✅ **Profile criado automaticamente!**

---

### 4️⃣ Testar Isolamento de Dados

**Criar tasks para diferentes usuários:**

```typescript
// Usuário A (logado)
const { data: taskA } = await supabase
  .from('tasks')
  .insert({ title: 'Task do Usuário A', user_id: userA.id })
  .select()
  .single();

// Fazer logout e logar como Usuário B
// Usuário B (logado)
const { data: taskB } = await supabase
  .from('tasks')
  .insert({ title: 'Task do Usuário B', user_id: userB.id })
  .select()
  .single();

// Verificar isolamento
const { data: myTasks } = await supabase
  .from('tasks')
  .select('*');

console.log(myTasks); // ✅ Apenas tasks do usuário logado!
```

---

### 5️⃣ Testar Histórico de Chat

**Criar sessão e mensagens:**

```typescript
// Criar sessão
const { data: session } = await supabase
  .from('chat_sessions')
  .insert({
    title: 'Teste de Chat',
    user_id: user.id
  })
  .select()
  .single();

// Enviar mensagens
await supabase
  .from('chat_messages')
  .insert([
    {
      session_id: session.id,
      role: 'user',
      content: 'Olá!'
    },
    {
      session_id: session.id,
      role: 'assistant',
      content: 'Olá! Como posso ajudar?'
    }
  ]);

// Verificar contador atualizado
const { data: updatedSession } = await supabase
  .from('chat_sessions')
  .select('message_count, last_message_at')
  .eq('id', session.id)
  .single();

console.log(updatedSession);
// ✅ message_count: 2
// ✅ last_message_at: timestamp atual
```

---

## 🔍 Verificações de Qualidade

### Segurança

```sql
-- Tentar acessar dados de outro usuário (deve falhar)
SET request.jwt.claim.sub = 'user-uuid-A';
SELECT * FROM tasks WHERE user_id = 'user-uuid-B';
-- Resultado: 0 rows (RLS bloqueou!)
```

### Performance

```sql
-- Verificar uso de índices
EXPLAIN ANALYZE
SELECT * FROM tasks 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC;

-- Deve mostrar: "Index Scan using idx_tasks_user_id_created"
```

### Integridade

```sql
-- Verificar constraints
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid::regclass::text IN ('tasks', 'chat_sessions', 'profiles');
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Auto-Provisioning
- [x] Profile criado automaticamente no signup
- [x] Email pré-preenchido
- [x] Timestamps corretos
- [x] Preferences inicializadas

### ✅ Isolamento de Dados
- [x] RLS em todas as tabelas
- [x] Users só veem seus dados
- [x] Foreign keys com CASCADE

### ✅ Persistência
- [x] Tasks persistem entre sessões
- [x] Histórico de chat completo
- [x] Contador de mensagens automático
- [x] Timestamps de última atividade

### ✅ Performance
- [x] Índices compostos
- [x] Partial indexes
- [x] Denormalização controlada
- [x] Queries otimizadas

---

## 🐛 Troubleshooting

### Profile não criado

**Problema:** Usuário sem profile após signup

**Solução:**
```sql
-- Verificar se trigger está ativo
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Se não existir, recriar:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### RLS bloqueando queries

**Problema:** Queries retornando vazio mesmo com dados

**Solução:**
```sql
-- Verificar policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Contador de mensagens incorreto

**Problema:** message_count desatualizado

**Solução:**
```sql
-- Recalcular contadores
UPDATE chat_sessions cs
SET message_count = (
  SELECT COUNT(*) 
  FROM chat_messages cm 
  WHERE cm.session_id = cs.id
);
```

---

## 📊 Queries Úteis

### Estatísticas do Usuário

```sql
SELECT * FROM user_stats 
WHERE user_id = 'user-uuid';
```

### Sessões Recentes

```sql
SELECT 
  cs.*,
  COUNT(cm.id) as total_messages
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cm.session_id = cs.id
WHERE cs.user_id = auth.uid()
GROUP BY cs.id
ORDER BY cs.last_message_at DESC NULLS LAST
LIMIT 10;
```

### Tasks Pendentes

```sql
SELECT * FROM tasks
WHERE user_id = auth.uid()
  AND is_completed = false
ORDER BY created_at DESC;
```

---

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────┐
│  1. SIGNUP                          │
│  POST /auth/signup                  │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  2. SUPABASE AUTH                   │
│  INSERT INTO auth.users             │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  3. TRIGGER                         │
│  on_auth_user_created               │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  4. FUNCTION                        │
│  handle_new_user()                  │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  5. INSERT PROFILE                  │
│  profiles(id, email, ...)           │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  6. USUÁRIO LOGADO                  │
│  Com infraestrutura pronta ✅       │
└─────────────────────────────────────┘
```

---

## 📝 Próximos Passos (Opcional)

### Melhorias Futuras

- [ ] Soft delete (deleted_at em vez de DELETE)
- [ ] Auditoria completa (log de todas as ações)
- [ ] Backup automático de chats
- [ ] Export de dados (GDPR)
- [ ] Múltiplos workspaces por usuário
- [ ] Compartilhamento de tasks entre usuários
- [ ] Notificações de atividade

### Monitoramento

```sql
-- Criar view de monitoramento
CREATE OR REPLACE VIEW system_health AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM tasks) as total_tasks,
  (SELECT COUNT(*) FROM chat_sessions) as total_sessions,
  (SELECT COUNT(*) FROM chat_messages) as total_messages,
  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_today,
  NOW() as checked_at;
```

---

## ✅ Checklist de Validação

Antes de considerar completo, verifique:

- [ ] Migration executada sem erros
- [ ] Profile criado automaticamente no signup
- [ ] RLS funcionando (usuários isolados)
- [ ] Índices criados (verificar EXPLAIN ANALYZE)
- [ ] Triggers funcionando (contador, timestamps)
- [ ] Foreign keys com CASCADE
- [ ] Hook useProfile funcionando no frontend
- [ ] Tasks persistem entre sessões
- [ ] Chat persiste entre sessões
- [ ] Logout e login mantém dados intactos

---

## 🎉 Conclusão

Se todos os testes passaram: **Sistema Production-Ready!**

Você agora tem:
- ✅ Multi-tenancy completo
- ✅ Auto-provisioning no signup
- ✅ Persistência robusta
- ✅ Segurança com RLS
- ✅ Performance otimizada

**Pronto para escalar! 🚀**
