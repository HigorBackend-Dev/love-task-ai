# ▶️ Pronto para Testar - Comandos Copy-Paste

## Teste Rápido (Recomendado)

Copie e execute na ordem:

### Terminal 1: Reiniciar Supabase
```bash
cd "c:\Users\pf388\OneDrive\Documents\love-task-ai"
npx supabase stop
npx supabase start
```

Aguarde até ver:
```
✓ Local development setup is complete
```

### Terminal 2: Iniciar Aplicação
```bash
cd "c:\Users\pf388\OneDrive\Documents\love-task-ai"
npm run dev
```

Você verá algo como:
```
Local: http://localhost:5173
```

### Terminal 3 (Opcional): Monitorar Logs
```bash
cd "c:\Users\pf388\OneDrive\Documents\love-task-ai"
npx supabase functions logs --follow
```

## No Navegador

### Passo 1: Acesse a Aplicação
```
http://localhost:5173
```

### Passo 2: Clique em "Create Account"
```
Tab: "Create Account"
```

### Passo 3: Preencha o Formulário
```
Email:    test@example.com
Password: password123
Confirm:  password123

Clique: "Create Account"
```

### Passo 4: Você verá "Confirm Your Email"
```
Página com instruções
E-mail exibido: test@example.com
```

### Passo 5: Verifique o E-mail
```
Abra em nova aba: http://localhost:54324
Procure por e-mail de confirmação
```

### Passo 6: Clique no Link
```
Abra o e-mail em localhost:54324
Clique no link de confirmação dentro do e-mail
```

### Passo 7: Veja o Dashboard
```
Você será redirecionado para o dashboard
✅ Confirmação funcionou!
```

## Verificações Após Teste

### ✅ Teste bem-sucedido se:
- [ ] Página de confirmação apareceu
- [ ] E-mail exibido estava correto
- [ ] E-mail apareceu em localhost:54324
- [ ] Link funcionou
- [ ] Redirecionou para dashboard
- [ ] Consegue usar o app

### ⚠️ Se algo não funcionou:

**E-mail não apareceu em localhost:54324?**
```bash
# Verifique se Supabase está rodando
npx supabase status

# Se não estiver, reinicie
npx supabase stop
npx supabase start
```

**Página de confirmação não apareceu?**
```bash
# Reconstrua
npm run build

# Ou reinicie dev
npm run dev
```

**Link de confirmação não funciona?**
```bash
# Verifique o console (F12)
# Procure por erros JavaScript
# Ou rode novamente o teste
```

## Debug - Se Travar

Quando todas as tentativas acima não funcionarem:

### Limpar Cache
```bash
# Windows PowerShell
rm -r node_modules
npm install
npm run dev
```

### Resetar Supabase Completamente
```bash
npx supabase stop
npx supabase eject  # Remove tudo
npx supabase start  # Começa do zero
```

## Logs em Tempo Real

### Ver Logs de Auth
```bash
npx supabase logs auth --follow
```

### Ver Logs de API
```bash
npx supabase logs api --follow
```

### Ver Logs de Functions
```bash
npx supabase functions logs --follow
```

## Status de Serviços

### Verificar tudo
```bash
npx supabase status
```

Você verá:
```
Supabase local development setup is running
  API URL: http://localhost:54321
  GraphQL URL: http://localhost:54321/graphql/v1
  S3 Storage URL: http://localhost:54321/storage/v1
  Inbucket URL: http://localhost:54324
  Auth Endpoint: http://localhost:54321/auth/v1
  DB URL: postgresql://postgres:postgres@localhost:54322/postgres
  Vector URL: postgresql://postgres:postgres@localhost:54322/postgres
```

## Dados de Teste

Após criar a conta, você pode:

```bash
# Conectar ao banco local
psql -U postgres -h localhost -p 54322 -d postgres

# Password: postgres
# Depois, listar usuários:
\dt auth.users

# Ver confirmação:
SELECT id, email, confirmed_at FROM auth.users;
```

## Revert (Se Algo Quebrou)

Se precisar reverter as mudanças:

### Revert Config
```bash
# Em supabase/config.toml, mude:
enable_confirmations = true
# De volta para:
enable_confirmations = false
```

### Remover Página (se criou)
```bash
# Remova o arquivo:
rm src/pages/ConfirmEmail.tsx
```

### Remover Rota
```bash
# Em src/App.tsx, remova:
# <Route path="/confirm-email" element={<ConfirmEmail />} />
```

## Checklist Final

```
Antes de começar:
☐ Supabase foi reiniciado
☐ Aplicação está rodando em localhost:5173
☐ Terminal está limpo de erros

Durante o teste:
☐ Criou conta com sucesso
☐ Redirecionou para /confirm-email
☐ E-mail apareceu em localhost:54324
☐ Link de confirmação funcionou
☐ Redirecionou para /dashboard

Após o teste:
☐ Consegue criar tarefas
☐ Consegue usar o app normalmente
☐ Tudo funciona como esperado
```

## Próximas Ações (Após Teste Bem-Sucedido)

### Fazer em 5 minutos:
1. Teste com outro e-mail (test2@example.com)
2. Teste clicando em "Resend Email" (se implementado)

### Fazer antes de produção:
1. Configurar SMTP real
2. Testar em ambiente de staging
3. Testar em produção

### Fazer posteriormente:
1. Implementar "Resend Email" completamente
2. Customizar template de e-mail
3. Adicionar verificação de bounce de e-mail

---

**Tudo pronto! Execute os comandos acima e veja funcionar!** ✅
