# 🚀 Love Task AI - SaaS Multi-Tenant Task Manager

Aplicação SaaS moderna de gerenciamento de tarefas com **Inteligência Artificial**, **autenticação completa** e **arquitetura multi-tenant profissional**.

## ✨ Características Principais

- 🤖 **Assistente IA** - Chat inteligente para melhorar tarefas
- 🔐 **Autenticação Completa** - Email + senha com Supabase Auth
- 🏢 **Multi-Tenant** - Isolamento total de dados por usuário
- 📊 **Histórico Persistente** - Tasks e conversas sempre disponíveis
- ⚡ **Performance** - Índices otimizados e queries eficientes
- 🔒 **Seguro** - Row Level Security (RLS) em todas as tabelas
- 🎨 **UI Moderna** - Design responsivo com shadcn/ui

## 🏗️ Arquitetura

```
Frontend (React + Vite + TypeScript)
    ↓
Supabase (PostgreSQL + Auth + Realtime)
    ↓
Edge Functions (Deno) → N8N → OpenAI
```

## 📦 Stack Tecnológica

- **Frontend**: React 18, Vite, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **IA**: OpenAI via N8N
- **State**: React Query, Context API
- **Routing**: React Router v6

## 🎯 Funcionalidades

### ✅ Autenticação
- Sign up com email + senha
- Login seguro
- Logout
- Proteção de rotas
- Persistência de sessão

### 📋 Tasks
- Criar tarefas
- Editar e atualizar
- Marcar como concluída
- Deletar
- Enhancement automático via IA
- Isolamento por usuário

### 💬 Chat com IA
- Múltiplas sessões de chat
- Histórico completo persistido
- Seleção de tasks para contexto
- Comandos diretos
- Contador de mensagens automático

### 👤 Profile
- Dados estendidos do usuário
- Preferences personalizadas
- Avatar customizável
- Criação automática no signup

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ e npm
- Conta no Supabase
- Conta no N8N (para IA)

### 1. Clonar e Instalar

```bash
git clone <YOUR_GIT_URL>
cd love-task-ai
npm install
```

### 2. Configurar Variáveis de Ambiente

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### 3. Aplicar Migrations

**Via Supabase Dashboard:**
1. Acesse SQL Editor
2. Execute em ordem:
   - `supabase/migrations/20251212_add_auth_and_rls.sql`
   - `supabase/migrations/20251212_saas_architecture.sql`

**Via CLI:**
```bash
supabase db push
```

### 4. Configurar Supabase Auth

No Dashboard → Authentication → Settings:
- ✅ Habilitar Email Auth
- 📧 Site URL: `http://localhost:5173`
- 🔄 Redirect URLs: `http://localhost:5173/dashboard`

### 5. Rodar Aplicação

```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 📚 Documentação

### Autenticação
- [AUTH_SYSTEM_DOCS.md](AUTH_SYSTEM_DOCS.md) - Sistema de autenticação
- [SETUP_AUTH.md](SETUP_AUTH.md) - Setup rápido de auth

### Arquitetura SaaS
- [SAAS_ARCHITECTURE.md](SAAS_ARCHITECTURE.md) - Arquitetura completa
- [SAAS_QUICK_START.md](SAAS_QUICK_START.md) - Guia rápido
- [SAAS_SUMMARY.md](SAAS_SUMMARY.md) - Resumo executivo

## 🗄️ Estrutura do Banco de Dados

```
auth.users (Supabase)
    ↓ 1:1
profiles (auto-criado via trigger)
    ↓ 1:N
    ├── tasks (isoladas por user_id)
    └── chat_sessions (isoladas por user_id)
            ↓ 1:N
            chat_messages
```

### Tabelas Principais

- **profiles** - Dados estendidos do usuário
- **tasks** - Tarefas com enhancement via IA
- **chat_sessions** - Sessões de conversação
- **chat_messages** - Histórico completo

## 🔒 Segurança

### Row Level Security (RLS)

Todas as tabelas têm **isolamento completo**:

```sql
-- Exemplo de policy
CREATE POLICY "Users manage own data"
  ON table_name
  USING (auth.uid() = user_id);
```

### Garantias

- ✅ Usuários só veem seus dados
- ✅ Foreign keys com CASCADE
- ✅ NOT NULL em user_id
- ✅ Triggers com SECURITY DEFINER

## ⚡ Performance

### Índices Otimizados

- `idx_tasks_user_id_created` - Tasks por usuário
- `idx_chat_sessions_user_updated` - Sessões recentes
- `idx_chat_messages_session_created` - Mensagens ordenadas

### Triggers Automáticos

- **on_auth_user_created** - Cria profile no signup
- **update_message_count** - Atualiza contador
- **set_updated_at** - Timestamps automáticos

## 📁 Estrutura do Projeto

```
src/
├── components/        # Componentes React
│   ├── ui/           # shadcn/ui components
│   ├── ChatPanel.tsx
│   ├── TaskForm.tsx
│   └── TaskList.tsx
├── contexts/         # Context API
│   ├── AuthContext.tsx
│   └── LanguageContext.tsx
├── hooks/            # Custom hooks
│   ├── useTasks.ts
│   ├── useChatSessions.ts
│   └── useProfile.ts
├── pages/            # Páginas
│   ├── Landing.tsx
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   └── NotFound.tsx
├── integrations/     # Integrações
│   └── supabase/
└── types/            # TypeScript types

supabase/
├── migrations/       # Database migrations
└── functions/        # Edge Functions
```

## 🧪 Testes

### Testar Auto-Provisioning

```typescript
// Criar usuário
const { data } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'test123'
});

// Verificar profile criado
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .single();

console.log(profile); // ✅ Existe automaticamente!
```

### Testar Isolamento

```typescript
// Usuário A cria task
await supabase.from('tasks').insert({ title: 'Task A' });

// Usuário B não vê
const { data } = await supabase.from('tasks').select('*');
// data = [] ✅ (RLS bloqueou)
```

## 🚧 Desenvolvimento

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Preview
npm run preview

# Lint
npm run lint
```

## 📦 Deploy

### Vercel (Recomendado)

1. Push para GitHub
2. Conectar repositório no Vercel
3. Configurar variáveis de ambiente
4. Deploy automático! 🎉

### Outras Plataformas

- Netlify
- Railway
- Render

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é licenciado sob a MIT License.

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI
- [Vite](https://vitejs.dev) - Build tool
- [React](https://react.dev) - Framework
- [N8N](https://n8n.io) - Automação e IA

---

**Desenvolvido com ❤️ usando React, Supabase e IA**
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
