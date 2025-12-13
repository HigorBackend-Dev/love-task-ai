# 🔧 Instruções para Configurar Credenciais Supabase Corretas

## ❌ Problema Atual
- API Key inválida causando erro **401 Unauthorized**
- Login e Signup não funcionam
- Mensagem: "Invalid API key"

## ✅ Solução

### Passo 1: Acessar Supabase Dashboard
1. Vá para https://app.supabase.com
2. Faça login com sua conta
3. Selecione seu projeto **"love-task-ai"** ou crie um novo

### Passo 2: Obter as Credenciais Corretas
1. No dashboard, clique em **Settings** (ícone de engrenagem)
2. Vá para **API** no menu esquerdo
3. Você verá:
   - **Project URL** - Copie isto
   - **Anon Public Key** - Copie isto (este é seu PUBLISHABLE_KEY)
   - **Service Role Key** - Copie isto (para backend apenas)

### Passo 3: Atualizar .env.local
Abra `C:\Users\pf388\OneDrive\Documents\love-task-ai\.env.local` e **substitua**:

```env
VITE_SUPABASE_URL=https://[SEU_PROJECT_ID].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
VITE_N8N_WEBHOOK_URL=https://n8n.aisulution.com.br/webhook/whatsapp
N8N_ENHANCE_WEBHOOK_URL=https://n8n.aisulution.com.br/webhook/enhance-task
```

### Passo 4: Reiniciar o Servidor
```bash
npm run dev
```

---

## 🔑 O que Copiar do Supabase

### URL do Projeto
- Localização: **Settings → API → Project URL**
- Formato: `https://[project-id].supabase.co`
- Coloque em: `VITE_SUPABASE_URL`

### Anon Public Key
- Localização: **Settings → API → Anon public key**
- É o token JWT que começa com `eyJ...`
- Coloque em: `VITE_SUPABASE_PUBLISHABLE_KEY`

### Service Role Key
- Localização: **Settings → API → Service role key**
- Use apenas no backend (não no frontend)
- Coloque em: `SUPABASE_SERVICE_ROLE_KEY`

---

## 🧪 Verificar se Funciona

### Após atualizar .env.local:
1. Salve o arquivo
2. Reinicie o servidor: `npm run dev`
3. Tente fazer signup com novo email
4. Você deve receber email de confirmação
5. Se funcionar, o login também funcionará

---

## ⚠️ Problemas Comuns

### "Project não existe"
- Acesse https://app.supabase.com
- Crie novo projeto se necessário
- Aguarde 1 minuto para ficar pronto

### "Anon key não funciona"
- Verifique se copiou a chave **Anon**, não a Service Role
- Anon começa com: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### "Ainda dá erro 401"
- Verifique se o URL está correto (sem `/` no final)
- Copie a chave inteira (às vezes a página corta no fim)
- Tente criar novo projeto no Supabase

---

## 📋 Checklist

- [ ] Acessei https://app.supabase.com
- [ ] Criei/selecionei meu projeto
- [ ] Copiei Project URL de Settings → API
- [ ] Copiei Anon Public Key de Settings → API  
- [ ] Copiei Service Role Key de Settings → API
- [ ] Atualizei .env.local com as 3 chaves
- [ ] Reiniciei `npm run dev`
- [ ] Tentei fazer signup com novo email
- [ ] Recebi email de confirmação

---

## 🆘 Se Ainda Não Funcionar

Se após seguir estes passos ainda tiver erro 401:

1. **Verifique o URL:**
   ```
   ✅ Correto: https://abc123.supabase.co
   ❌ Errado: https://abc123.supabase.co/
   ❌ Errado: supabase.co
   ```

2. **Verifique a chave (deve ser longa):**
   ```
   ✅ Correto: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNud25peGRxamV0anFveHVhdnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzIxNjksImV4cCI6MTc5NDIwODI2OX0.BhVczIzx5Ak_bz0yj4h3kKh_1z36kFLUlXp6F7LqlzM
   ❌ Errado: eyJhbGc... (incompleta)
   ```

3. **Clear cache e cookies:**
   - F12 → Application → Cookies → Delete all
   - F12 → Application → Local Storage → Clear all

4. **Reinicie tudo:**
   ```bash
   npm run dev
   ```

---

**Última atualização:** 12 de dezembro de 2025  
**Status:** Instruções para resolver erro 401
