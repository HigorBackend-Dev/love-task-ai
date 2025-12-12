export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector do elemento a destacar
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    callback?: () => void;
  };
  skippable?: boolean;
}

export interface OnboardingState {
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

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '👋 Bem-vindo ao Love Task AI!',
    description: 'Vamos fazer um tour rápido para você conhecer as principais funcionalidades. Isso leva menos de 1 minuto.',
    placement: 'center',
    skippable: true,
  },
  {
    id: 'create-task',
    title: '📝 Crie sua primeira tarefa',
    description: 'Comece adicionando uma tarefa aqui. Nosso AI vai melhorar o título automaticamente para você.',
    target: '[data-onboarding="task-form"]',
    placement: 'bottom',
    action: {
      label: 'Criar tarefa de exemplo',
    },
  },
  {
    id: 'task-list',
    title: '✅ Gerencie suas tarefas',
    description: 'Aqui aparecem todas as suas tarefas. Você pode marcar como concluída, editar ou deletar.',
    target: '[data-onboarding="task-list"]',
    placement: 'left',
  },
  {
    id: 'chat',
    title: '💬 Converse com o AI',
    description: 'Use o chat para interagir com suas tarefas de forma natural. Você pode pedir para criar, editar ou finalizar tarefas.',
    target: '[data-onboarding="chat-panel"]',
    placement: 'left',
  },
  {
    id: 'profile',
    title: '👤 Seu perfil',
    description: 'Aqui você encontra suas estatísticas e pode fazer logout quando precisar.',
    target: '[data-onboarding="user-profile"]',
    placement: 'bottom',
  },
  {
    id: 'complete',
    title: '🎉 Tudo pronto!',
    description: 'Você já conhece o básico. Agora é só usar! Você pode acessar este tour novamente nas configurações.',
    placement: 'center',
  },
];
