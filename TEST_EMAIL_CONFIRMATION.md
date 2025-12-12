# 🧪 Teste: Confirmação de E-mail

## Pré-requisitos Verificados ✅
- `supabase/config.toml`: `enable_confirmations = true` ✅
- `src/pages/ConfirmEmail.tsx`: Criada ✅
- `src/App.tsx`: Rota adicionada ✅
- `src/pages/Auth.tsx`: Fluxo atualizado ✅
- Build: Compilou com sucesso ✅

## Teste Passo a Passo

### Passo 1: Preparar Ambiente

```bash
# Parar Supabase se estiver rodando
npx supabase stop

# Iniciar com nova configuração
npx supabase start

# Aguarde até ver algo como:
# API URL: http://localhost:54321
# Auth: ready
```

### Passo 2: Iniciar Aplicação

```bash
# Em outro terminal
npm run dev

# Acesse: http://localhost:5173 (ou a porta mostrada)
```

### Passo 3: Criar Conta Teste

1. Clique em **"Create Account"** na página de login
2. Preencha:
   - **Email**: `test@example.com`
   - **Password**: `password123`
   - **Confirm Password**: `password123`
3. Clique em **"Create Account"**

### Passo 4: Verificar Página de Confirmação

Após criar conta, você deve ver:
- ✅ Página com ícone de e-mail
- ✅ Título: "Confirm Your Email"
- ✅ E-mail exibido: `test@example.com`
- ✅ Instruções para confirmar
- ✅ Botão "Resend Confirmation Email"
- ✅ Botão "Back to Login"

### Passo 5: Verificar E-mail Recebido

1. Abra http://localhost:54324 em nova aba
2. Você deve ver uma caixa de entrada
3. Procure por um e-mail com assunto similar a:
   - "Confirm your email"
   - "Verify your email"
   - "Email confirmation"

### Passo 6: Clicar no Link de Confirmação

1. Abra o e-mail em http://localhost:54324
2. Procure por um link similar a:
   ```
   http://localhost:3000/auth/v1/verify?...
   ou
   http://localhost:3000/confirm-email?token=...
   ```
3. **Clique no link**

### Passo 7: Verificar Confirmação

Você deve ser redirecionado para:
- ✅ Página com ícone de ✓ (check)
- ✅ Título: "Email Confirmed!"
- ✅ Mensagem: "Your email has been confirmed"
- ✅ Após 2 segundos: Redireciona para dashboard

### Passo 8: Usar a Aplicação

Se chegou ao dashboard, a confirmação funcionou! ✅

## Checklist de Verificação

```
Ao criar conta:
☐ Redireciona para página de confirmação
☐ E-mail exibido corretamente
☐ Mostra instruções

E-mail:
☐ Aparece em http://localhost:54324
☐ Contém um link de confirmação
☐ Link começa com http://localhost

Ao clicar no link:
☐ Página detecta confirmação
☐ Mostra mensagem de sucesso
☐ Redireciona para dashboard

No dashboard:
☐ Pode criar tarefas
☐ Pode usar funcionalidades
☐ Está autenticado
```

## Troubleshooting

### ❌ Página de confirmação não aparece
**Solução:**
- Verifique se `src/App.tsx` foi atualizado corretamente
- Verifique a rota `/confirm-email`
- Tente: `npm run build` e depois `npm run dev`

### ❌ E-mail não aparece em localhost:54324
**Solução:**
1. Verifique se Supabase está rodando: `npx supabase status`
2. Reinicie: `npx supabase stop && npx supabase start`
3. Verifique console do navegador (F12) para erros

### ❌ Link de confirmação não funciona
**Solução:**
- Certifique-se que `site_url` em `config.toml` é: `http://localhost:3000`
- Reinicie Supabase após mudar config

### ❌ Redirecionamento não acontece
**Solução:**
- Abra console (F12) e procure por erros
- Verifique se `user` está sendo detectado em `ConfirmEmail.tsx`
- Tente fazer F5 (refresh) na página

### ❌ Fica em loop infinito
**Solução:**
- Isso pode significar que `confirmed_at` não está sendo atualizado
- Verifique os logs do Supabase: `npx supabase functions logs`
- Tente clicar no link novamente

## Logs Úteis

Para monitorar o que está acontecendo:

```bash
# Ver logs do Supabase em tempo real
npx supabase functions logs --follow

# Ver status geral
npx supabase status

# Ver logs de auth
npx supabase logs auth
```

## Teste Alternativo (Sem Clicar no Link)

Se o link não funcionar, você pode testar o fluxo de outra forma:

1. Crie conta normalmente
2. Vá para dashboard e faça logout
3. No console do navegador (F12), execute:
   ```javascript
   // Simular confirmação no Supabase local
   const { data } = await supabase.auth.updateUser({
     email_change: 'test@example.com'
   });
   ```
4. Recarregue a página

## Sucesso! 🎉

Se todos os passos funcionaram:
- ✅ Confirmação de e-mail está trabalhando
- ✅ Fluxo completo está funcional
- ✅ Usuários receberão e-mails de confirmação
- ✅ Sistema está seguro e validado

## Próximos Passos

1. **Testar em produção** (Supabase Cloud)
2. **Configurar SMTP real** se necessário
3. **Implementar resend de e-mail** (TODO em ConfirmEmail.tsx)
4. **Testar com vários e-mails** para garantir funcionamento
