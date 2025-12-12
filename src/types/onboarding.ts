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
    title: '👋 Welcome to Love Task AI!',
    description: 'Let\'s take a quick tour to introduce you to the main features. This takes less than 1 minute.',
    placement: 'center',
    skippable: true,
  },
  {
    id: 'create-task',
    title: '📝 Create your first task',
    description: 'Start by adding a task here. Our AI will automatically improve the title for you.',
    target: '[data-onboarding="task-form"]',
    placement: 'bottom',
    action: {
      label: 'Create example task',
    },
  },
  {
    id: 'task-list',
    title: '✅ Manage your tasks',
    description: 'All your tasks appear here. You can mark as completed, edit or delete.',
    target: '[data-onboarding="task-list"]',
    placement: 'left',
  },
  {
    id: 'chat',
    title: '💬 Chat with AI',
    description: 'Use the chat to interact with your tasks naturally. You can ask to create, edit or complete tasks.',
    target: '[data-onboarding="chat-panel"]',
    placement: 'left',
  },
  {
    id: 'profile',
    title: '👤 Your profile',
    description: 'Here you find your statistics and can logout when needed.',
    target: '[data-onboarding="user-profile"]',
    placement: 'bottom',
  },
  {
    id: 'complete',
    title: '🎉 All set!',
    description: 'You now know the basics. Time to use it! You can access this tour again in settings.',
    placement: 'center',
  },
];
