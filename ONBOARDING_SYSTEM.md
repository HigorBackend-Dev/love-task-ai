# 🎯 Sistema de Onboarding - Love Task AI

## Visão Geral

Sistema de onboarding profissional para guiar novos usuários através das funcionalidades principais da aplicação.

## 🏗️ Arquitetura

### Componentes

```
src/
├── components/
│   └── OnboardingTour.tsx      # Componente visual do tour
├── hooks/
│   └── useOnboarding.ts        # Lógica de estado e persistência
├── types/
│   └── onboarding.ts           # Types e configuração dos passos
└── pages/
    └── Dashboard.tsx           # Integração com atributos data-onboarding
```

### Fluxo de Dados

```
┌─────────────┐
│   Supabase  │  ← Persistência
│  (profiles) │
└──────┬──────┘
       │
┌──────▼────────────┐
│  useOnboarding()  │  ← Estado e controle
└──────┬────────────┘
       │
┌──────▼────────────┐
│ OnboardingTour    │  ← UI e interação
└───────────────────┘
```

## 📊 Modelo de Dados

### Schema no Supabase

```sql
ALTER TABLE public.profiles
  ADD COLUMN onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN onboarding_skipped BOOLEAN DEFAULT false,
  ADD COLUMN onboarding_checklist JSONB DEFAULT '{
    "created_task": false,
    "completed_task": false,
    "started_chat": false,
    "viewed_dashboard": false
  }';
```

### Funções Supabase

**complete_onboarding(user_id UUID)**
- Marca onboarding como completo
- Define timestamp de conclusão

**update_onboarding_checklist(user_id UUID, item TEXT, completed BOOLEAN)**
- Atualiza item individual do checklist
- Permite tracking granular de progresso

## 🎨 Estratégia UX

### Abordagem: Progressive Disclosure

**Fase 1: Welcome Modal**
- Introdução rápida ao sistema
- Opção de pular ou continuar

**Fase 2: Contextual Tooltips**
- Guia prático em cada elemento
- Highlight visual do elemento target
- Overlay escuro para foco

**Fase 3: Checklist de Ativação**
- Track de ações reais do usuário
- Gamificação sutil
- Indicador de progresso

### Por que esta abordagem?

✅ **Não intrusiva**: Usuário controla o ritmo
✅ **Contextual**: Aprende fazendo
✅ **Skippable**: Não frustra usuários avançados
✅ **Memorável**: Foco visual claro
✅ **Mensurável**: Analytics de cada passo

## 🚀 Implementação

### 1. Aplicar Migration

```bash
# Executar no Supabase SQL Editor
supabase/migrations/20251212_add_onboarding.sql
```

### 2. Regenerar Types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

### 3. Adicionar ao Dashboard

```tsx
import { OnboardingTour } from '@/components/OnboardingTour';

export default function Dashboard() {
  return (
    <div>
      <OnboardingTour />
      {/* resto do código */}
    </div>
  );
}
```

### 4. Marcar Elementos Target

```tsx
<div data-onboarding="task-form">
  <TaskForm />
</div>

<div data-onboarding="task-list">
  <TaskList />
</div>

<div data-onboarding="chat-panel">
  <ChatPanel />
</div>
```

### 5. Track de Ações

```tsx
const { updateChecklistItem } = useOnboarding();

const handleCreateTask = async (title: string) => {
  await createTask(title);
  updateChecklistItem('created_task', true);
};
```

## 📝 Configuração dos Passos

Edite `src/types/onboarding.ts`:

```typescript
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '👋 Bem-vindo!',
    description: 'Tour rápido de 1 minuto',
    placement: 'center',
    skippable: true,
  },
  {
    id: 'create-task',
    title: '📝 Crie sua primeira tarefa',
    description: 'Adicione uma tarefa aqui',
    target: '[data-onboarding="task-form"]',
    placement: 'bottom',
  },
  // ... mais passos
];
```

## 🎯 API do Hook

### useOnboarding()

```typescript
const {
  state,              // Estado atual do onboarding
  isLoading,          // Carregando dados
  isActive,           // Tour está ativo
  nextStep,           // Avançar passo
  previousStep,       // Voltar passo
  completeOnboarding, // Marcar como completo
  skipOnboarding,     // Pular tour
  restartOnboarding,  // Reiniciar (para configurações)
  updateChecklistItem,// Atualizar item do checklist
  setActive,          // Ativar/desativar manualmente
} = useOnboarding();
```

### OnboardingState

```typescript
interface OnboardingState {
  completed: boolean;
  currentStep: number;
  skipped: boolean;
  checklist: {
    created_task: boolean;
    completed_task: boolean;
    started_chat: boolean;
    viewed_dashboard: boolean;
  };
}
```

## 📊 Analytics

### View de Estatísticas

```sql
SELECT * FROM onboarding_stats;

-- Retorna:
-- total_users: número total de usuários
-- completed: quantos completaram
-- skipped: quantos pularam
-- in_progress: quantos estão no meio
-- completion_rate: taxa de conclusão (%)
```

### Queries Úteis

```sql
-- Usuários que não completaram onboarding
SELECT * FROM profiles 
WHERE onboarding_completed = false 
AND onboarding_skipped = false;

-- Usuários que pularam
SELECT * FROM profiles 
WHERE onboarding_skipped = true;

-- Taxa de conclusão por semana
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as completed
FROM profiles
GROUP BY week
ORDER BY week DESC;
```

## 🎨 Customização Visual

### Mudar Cores do Highlight

```tsx
<div
  className="absolute border-4 border-primary rounded-lg"
  style={{...}}
/>
```

### Ajustar Animações

```tsx
<Card className="animate-in fade-in-0 zoom-in-95 duration-300">
```

### Mudar Posicionamento

Edite a função `calculatePosition()` em `OnboardingTour.tsx`

## 🔒 Boas Práticas

### ✅ FAZER

- Manter passos curtos e focados
- Usar linguagem clara e amigável
- Permitir pular em todos os passos (exceto críticos)
- Scroll automático para elementos target
- Persistir estado no backend
- Track ações reais do usuário

### ❌ NÃO FAZER

- Tour muito longo (máximo 6 passos)
- Bloquear a UI completamente
- Usar apenas localStorage
- Assumir que todos precisam do tour
- Linguagem técnica ou jargões
- Forçar conclusão

## 🚧 Próximas Melhorias

- [ ] Adicionar opção de reiniciar nas configurações
- [ ] A/B testing de diferentes fluxos
- [ ] Onboarding contextual por feature
- [ ] Video tutoriais embutidos
- [ ] Tooltips on-demand (help icons)
- [ ] Celebração animada na conclusão
- [ ] Checklist visível durante uso normal

## 📈 KPIs para Monitorar

1. **Taxa de Conclusão**: % de usuários que completam
2. **Taxa de Skip**: % de usuários que pulam
3. **Tempo Médio**: Quanto tempo leva
4. **Drop-off Points**: Onde usuários abandonam
5. **Ativação**: Usuários que completam ações chave
6. **Retenção D7**: Correlação com retenção

## 🔍 Troubleshooting

### Tour não aparece

1. Verificar se migration foi aplicada
2. Confirmar que `onboarding_completed = false`
3. Checar console para erros
4. Verificar se `<OnboardingTour />` está no componente

### Elementos não são destacados

1. Verificar se `data-onboarding` está correto
2. Confirmar que elemento existe no DOM
3. Usar DevTools para inspecionar selector
4. Garantir que elemento não está oculto

### Posicionamento incorreto

1. Ajustar `placement` no step
2. Modificar `tooltipOffset` no código
3. Testar em diferentes tamanhos de tela
4. Usar `placement: 'center'` como fallback

## 🎓 Referências

- [Asana Onboarding](https://asana.com)
- [Linear Product Tour](https://linear.app)
- [Notion Onboarding](https://notion.so)
- [Samuel Hulick - UserOnboard](https://useronboard.com)
- [Product-Led Onboarding](https://productled.com)

## 📚 Recursos

- **Biblioteca usada**: Custom (sem dependências)
- **Alternativas**: React Joyride, Shepherd.js, Intro.js
- **Por que custom?**: Controle total, zero deps, tailored UX

---

**Status**: ✅ Produção Ready
**Última atualização**: 2025-12-12
**Mantido por**: Product Engineering Team
