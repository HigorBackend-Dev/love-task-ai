# Troubleshooting - Problemas Comuns

## ❌ Erros 404/400 no Dashboard

### Problema
```
404 profiles
400 chat_sessions (user_id)
400 tasks (user_id)
```

### Causa
A migration do SaaS ainda não foi aplicada no banco de dados.

### Solução - Aplicar Migration

1. **Abra o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard/project/cnwnixdqjetjqoxuavsr

2. **Navegue para SQL Editor**
   - Menu lateral: `SQL Editor` → `New query`

3. **Cole o conteúdo da migration**
   ```bash
   # Copie o arquivo completo:
   supabase/migrations/20251212_saas_architecture.sql
   ```

4. **Execute a migration**
   - Clique em `Run` ou pressione `Ctrl+Enter`

5. **Verifique se foi criado**
   - Vá em `Table Editor`
   - Deve aparecer a tabela `profiles`
   - Abra `tasks` e `chat_sessions` e verifique se a coluna `user_id` existe

---

## 📧 Problema com Email de Confirmação

### Problema 1: Redirect para localhost

#### Solução - Configurar Site URL

1. **Vá para Authentication → URL Configuration**
   - Supabase Dashboard: https://supabase.com/dashboard/project/cnwnixdqjetjqoxuavsr/auth/url-configuration

2. **Configure as URLs:**

   **Site URL:**
   ```
   https://seu-dominio.vercel.app
   ```
   (Ou use `http://localhost:5173` durante desenvolvimento)

   **Redirect URLs (adicione ambas):**
   ```
   http://localhost:5173/**
   https://seu-dominio.vercel.app/**
   ```

3. **Salve as configurações**

### Problema 2: Email não está sendo enviado

#### Causa
Por padrão, Supabase não envia emails em projetos free até você configurar SMTP.

#### Solução A - Usar link de confirmação manual (desenvolvimento)

1. **Vá para Authentication → Settings**
2. **Desabilite "Enable email confirmations"**
   - Isso permite login sem confirmar email (apenas para desenvolvimento!)

3. **Ou encontre o link no Dashboard:**
   - Authentication → Users
   - Clique no usuário
   - O link de confirmação aparece nos logs

#### Solução B - Configurar Email SMTP (produção)

1. **Vá para Project Settings → Auth**
   - https://supabase.com/dashboard/project/cnwnixdqjetjqoxuavsr/settings/auth

2. **Role até "SMTP Settings"**

3. **Configure com seu provedor:**

   **Gmail (exemplo):**
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: seu-email@gmail.com
   Password: [App Password - não a senha normal!]
   Sender email: seu-email@gmail.com
   Sender name: Love Task AI
   ```

   **Como gerar App Password no Gmail:**
   - Vá para: https://myaccount.google.com/apppasswords
   - Gere uma senha específica para o app
   - Use essa senha no SMTP

4. **Teste o email:**
   - Crie um novo usuário
   - Verifique se o email chega

---

## ✅ Checklist de Verificação

Depois de aplicar as correções, teste:

- [ ] Migration aplicada com sucesso
- [ ] Tabela `profiles` existe no banco
- [ ] Colunas `user_id` adicionadas a `tasks` e `chat_sessions`
- [ ] Site URL configurada corretamente
- [ ] Redirect URLs incluem seu domínio
- [ ] Email de confirmação sendo enviado (ou desabilitado para dev)
- [ ] Usuário consegue fazer login
- [ ] Dashboard carrega sem erros 404/400
- [ ] Profile é criado automaticamente no primeiro login

---

## 🔧 Configuração Rápida para Desenvolvimento

Se você quer apenas testar localmente sem emails:

1. **Supabase Dashboard → Authentication → Providers**
2. **Email Provider → Desabilite "Confirm email"**
3. **Aplique a migration do banco**
4. **Configure Site URL para `http://localhost:5173`**
5. **Reinicie o servidor dev: `npm run dev`**

Agora você pode criar contas sem precisar confirmar email!

---

## 🚨 Erro: "Email link is invalid or has expired"

Se você clicar no link de confirmação e receber este erro:

1. **Verifique se a Site URL está correta**
2. **Gere um novo link:**
   - Dashboard → Authentication → Users
   - Clique nos 3 pontos do usuário → "Send magic link"
3. **Ou desabilite confirmação de email (desenvolvimento)**

---

## 📝 Próximos Passos Após Resolver

1. **Regenere os tipos TypeScript:**
   ```bash
   npx supabase gen types typescript --project-id cnwnixdqjetjqoxuavsr > src/integrations/supabase/types.ts
   ```

2. **Remova os @ts-expect-error** dos arquivos:
   - `src/hooks/useProfile.ts`
   - `src/hooks/useChatSessions.ts`

3. **Faça um rebuild:**
   ```bash
   npm run build
   ```

4. **Teste o fluxo completo:**
   - Crie uma nova conta
   - Faça login
   - Crie uma task
   - Inicie um chat
   - Verifique se os dados estão isolados por usuário
