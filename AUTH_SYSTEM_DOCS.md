# Sistema de Autenticação - Love Task AI

## 📋 Visão Geral

Este documento descreve a implementação completa do sistema de autenticação profissional para a aplicação Love Task AI, utilizando **Supabase Auth** com **email + senha**.

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/
├── contexts/
│   ├── AuthContext.tsx          # Context API para gerenciamento de autenticação
│   └── LanguageContext.tsx
├── components/
│   ├── ProtectedRoute.tsx       # HOC para proteção de rotas
│   └── ui/                      # Componentes shadcn/ui
├── pages/
│   ├── Auth.tsx                 # Página de Login/Sign Up
│   ├── Dashboard.tsx            # Dashboard protegido
│   └── NotFound.tsx
├── hooks/
│   ├── useTasks.ts             # Hook de tarefas (com user_id)
│   └── useChatSessions.ts      # Hook de chat (com user_id)
└── integrations/
    └── supabase/
        └── client.ts           # Cliente Supabase configurado
```

## 🔐 Componentes Principais

### 1. AuthContext (`src/contexts/AuthContext.tsx`)

**Responsabilidades:**
- Gerenciar estado global de autenticação
- Controlar sessão do usuário
- Prover métodos de sign up, sign in e sign out
- Sincronizar com Supabase Auth

**Funcionalidades:**
- ✅ Persistência de sessão com sessionStorage
- ✅ Auto-refresh de tokens
- ✅ Listener de mudanças de estado de autenticação
- ✅ Redirecionamento automático após login/logout

**API Pública:**
```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}
```

### 2. ProtectedRoute (`src/components/ProtectedRoute.tsx`)

**Responsabilidades:**
- Proteger rotas que exigem autenticação
- Redirecionar usuários não autenticados para `/auth`
- Exibir skeleton loading durante verificação de sessão

**Uso:**
```tsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

### 3. Página de Autenticação (`src/pages/Auth.tsx`)

**Características:**
- 📱 UI responsiva e moderna
- 🔄 Toggle entre Login e Sign Up
- ✅ Validação de formulário (email, senha, confirmação)
- 🎨 Design com shadcn/ui components
- 🔔 Feedback visual de erros e sucessos
- 🔒 Proteção contra duplo envio (loading states)

**Validações Implementadas:**
- Email: Regex pattern validation
- Senha: Mínimo 6 caracteres
- Confirmação de senha: Deve ser idêntica
- Mensagens de erro localizadas em português

### 4. Dashboard (`src/pages/Dashboard.tsx`)

**Características:**
- 🔐 Rota protegida
- 👤 Exibe informações do usuário logado
- 🚪 Botão de logout acessível
- 📋 Interface completa de gerenciamento de tarefas
- 💬 Sistema de chat integrado

## 🔒 Segurança Implementada

### Row Level Security (RLS)

**Tabelas Protegidas:**
- `tasks`
- `chat_sessions`
- `chat_messages`

**Políticas de Segurança:**

```sql
-- Usuários só podem ver seus próprios dados
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários só podem criar dados vinculados ao seu ID
CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários só podem atualizar seus próprios dados
CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuários só podem deletar seus próprios dados
CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

### Configuração do Cliente Supabase

```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: window.sessionStorage,        // Mais seguro que localStorage
    persistSession: true,                  // Mantém sessão após reload
    autoRefreshToken: true,                // Renova token automaticamente
    detectSessionInUrl: true,              // Suporta magic links
    flowType: 'pkce',                      // PKCE flow para segurança adicional
  }
});
```

**Decisões de Segurança:**
- ✅ **sessionStorage** em vez de localStorage (sessão expira ao fechar navegador)
- ✅ **PKCE flow** para proteção contra ataques de interceptação
- ✅ **Auto-refresh de tokens** para manter sessão ativa
- ✅ **Validação de session no servidor** (RLS policies)

## 🔄 Fluxo de Autenticação

### Sign Up
```
1. Usuário preenche formulário (email + senha)
2. Validação client-side
3. supabase.auth.signUp()
4. Supabase envia email de confirmação (se configurado)
5. AuthContext atualiza estado
6. Redirecionamento para /dashboard
```

### Sign In
```
1. Usuário preenche formulário (email + senha)
2. Validação client-side
3. supabase.auth.signInWithPassword()
4. Supabase valida credenciais
5. AuthContext atualiza estado e session
6. Redirecionamento para /dashboard
```

### Sign Out
```
1. Usuário clica em "Sair"
2. supabase.auth.signOut()
3. AuthContext limpa estado
4. Redirecionamento para /auth
```

### Proteção de Rota
```
1. Usuário tenta acessar /dashboard
2. ProtectedRoute verifica se user existe
3. Se não autenticado: redirect para /auth
4. Se autenticado: renderiza Dashboard
```

## 🎯 Integração com Dados

### Hooks Atualizados

**useTasks.ts:**
```typescript
// Agora filtra tarefas por user_id
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', user.id)  // 🔒 Apenas tarefas do usuário
  .order('created_at', { ascending: false });

// Ao criar tarefa, vincula ao user_id
const newTask = {
  title,
  user_id: user.id,  // 🔒 Vincula à conta do usuário
  // ...
};
```

**useChatSessions.ts:**
```typescript
// Filtra sessões por user_id
const { data, error } = await supabase
  .from('chat_sessions')
  .select('*')
  .eq('user_id', user.id)  // 🔒 Apenas sessões do usuário
  .order('updated_at', { ascending: false });
```

## 📊 Migration do Banco de Dados

### Arquivo: `20251212_add_auth_and_rls.sql`

**Alterações:**
1. Adiciona coluna `user_id` em `tasks`
2. Adiciona coluna `user_id` em `chat_sessions`
3. Cria índices para performance
4. Habilita RLS em todas as tabelas
5. Cria políticas de acesso (SELECT, INSERT, UPDATE, DELETE)

**Para Aplicar:**
```bash
# Opção 1: Via Supabase CLI
supabase db push

# Opção 2: Via Dashboard Supabase
# Copiar e executar SQL no SQL Editor
```

## 🚀 Como Usar

### 1. Configurar Variáveis de Ambiente

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### 2. Aplicar Migration

```bash
cd supabase
supabase db push
```

### 3. Configurar Supabase Auth (Dashboard)

1. Acesse **Authentication > Settings**
2. Configure **Email Auth** (habilitado)
3. Opcionalmente desabilite confirmação de email para testes
4. Configure **Site URL**: `http://localhost:5173`
5. Configure **Redirect URLs**: `http://localhost:5173/dashboard`

### 4. Rodar Aplicação

```bash
npm run dev
```

### 5. Testar

1. Acesse `http://localhost:5173`
2. Você será redirecionado para `/auth`
3. Crie uma conta na aba "Criar Conta"
4. Faça login
5. Acesse o Dashboard protegido

## 🎨 UI/UX

### Componentes Utilizados
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Input`, `Label`, `Button`
- `Alert`, `AlertDescription`
- Ícones do `lucide-react`

### Estados Visuais
- ✅ Loading spinners durante operações async
- ✅ Mensagens de erro claras em português
- ✅ Feedback de sucesso
- ✅ Skeleton loading durante verificação de sessão
- ✅ Desabilitação de inputs durante loading

## 🧪 Boas Práticas Implementadas

### 1. Separação de Responsabilidades
- Context para lógica de autenticação
- Components para UI
- Hooks para lógica de negócio

### 2. Type Safety
- TypeScript em todos os arquivos
- Tipagem completa do Supabase
- Interfaces bem definidas

### 3. Performance
- Memoização com `useCallback`
- Lazy loading de dados
- Índices no banco de dados

### 4. Segurança
- RLS habilitado em todas as tabelas
- Validação client-side e server-side
- PKCE flow para OAuth
- sessionStorage em vez de localStorage

### 5. UX
- Feedback visual imediato
- Mensagens de erro contextuais
- Loading states apropriados
- Navegação intuitiva

## 🔧 Troubleshooting

### Erro: "Invalid login credentials"
- Verificar se o email está correto
- Verificar se a senha tem no mínimo 6 caracteres
- Verificar se a conta foi criada

### Erro: "User already registered"
- Email já cadastrado no sistema
- Tentar fazer login em vez de sign up

### Erro: RLS policies
- Verificar se migration foi aplicada
- Verificar se RLS está habilitado
- Verificar logs no Supabase Dashboard

### Sessão não persiste
- Verificar se sessionStorage está habilitado no navegador
- Verificar se cookies estão habilitados
- Limpar sessionStorage e tentar novamente

## 📝 Próximos Passos (Opcional)

- [ ] Implementar "Esqueci minha senha"
- [ ] Adicionar autenticação com Google/GitHub
- [ ] Implementar 2FA (Two-Factor Authentication)
- [ ] Adicionar verificação de email obrigatória
- [ ] Criar página de perfil do usuário
- [ ] Implementar rate limiting

## 🎓 Decisões Arquiteturais

### Por que sessionStorage?
- Mais seguro: sessão expira ao fechar navegador
- Reduz risco de XSS persistente
- Adequado para aplicações sensíveis

### Por que PKCE flow?
- Proteção contra ataques de interceptação
- Recomendação oficial do Supabase
- Padrão moderno de OAuth

### Por que RLS?
- Segurança em nível de banco de dados
- Impossível de bypassar no client-side
- Proteção mesmo se houver bugs no frontend

### Por que Context API?
- Evita prop drilling
- Estado global acessível em toda aplicação
- Performance adequada para escala da aplicação

---

## ✅ Checklist de Produção

Antes de fazer deploy:

- [ ] Variáveis de ambiente configuradas
- [ ] Migration aplicada no banco de produção
- [ ] RLS habilitado em todas as tabelas
- [ ] Site URL configurado no Supabase
- [ ] Redirect URLs configuradas
- [ ] Email Auth habilitado
- [ ] HTTPS habilitado (obrigatório para produção)
- [ ] Rate limiting configurado (se necessário)
- [ ] Logs de erro configurados
- [ ] Testes de autenticação realizados

---

**Desenvolvido com ❤️ para demonstrar conhecimento profissional em autenticação moderna.**
