import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'pt-BR' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  'pt-BR': {
    // Tabs
    'chat': 'Chat',
    'history': 'History',
    
    // Header
    'help': 'Help',
    
    // Task badge
    'taskSelected': 'Selected task',
    
    // Empty states
    'noConversation': 'Start a new conversation to interact with the assistant.',
    'newConversation': 'New Conversation',
    'howCanIHelp': 'Como posso ajudar você hoje?',
    'quickActions': 'Ações Rápidas:',
    'selectTask': 'Selecionar uma tarefa',
    'noConversationsYet': 'Nenhuma conversa ainda.',
    
    // Commands
    'finalize': 'Finalizar',
    'improve': 'Melhorar',
    'changeTitle': 'Mudar título',
    'delete': 'Deletar',
    'finalizeTask': 'Finalizar tarefa',
    'improveWithAI': 'Melhorar com IA',
    
    // Input placeholders
    'typeCommand': 'Digite um comando...',
    'typeHashToSelect': 'Digite # para selecionar...',
    
    // Confirmation
    'task': 'Tarefa',
    'newDescription': 'Nova descrição',
    'yesConfirm': 'Sim, confirmar',
    'no': 'Não',
    
    // Help menu
    'howToUse': 'Como usar o chat',
    'step1': '1. Selecionar uma tarefa:',
    'step1Desc': 'e escolha uma tarefa',
    'step2': '2. Comandos rápidos:',
    'step2Cmd1': 'Marca como concluída',
    'step2Cmd2': 'Volta para pendente',
    'step2Cmd3': 'Remove',
    'step2Cmd4': 'Atualiza',
    'step3': '3. Com IA:',
    'step3Cmd1': 'melhore essa task',
    'step3Cmd2': 'me ajude com isso',
    'step3Cmd3': 'Ou converse naturalmente!',
  },
  'en': {
    // Tabs
    'chat': 'Chat',
    'history': 'History',
    
    // Header
    'help': 'Help',
    
    // Task badge
    'taskSelected': 'Selected task',
    
    // Empty states
    'noConversation': 'Start a new conversation to interact with the assistant.',
    'newConversation': 'New Conversation',
    'howCanIHelp': 'How can I help you today?',
    'quickActions': 'Quick Actions:',
    'selectTask': 'Select a task',
    'noConversationsYet': 'No conversations yet.',
    
    // Commands
    'finalize': 'Finalize',
    'improve': 'Improve',
    'changeTitle': 'Change title',
    'delete': 'Delete',
    'finalizeTask': 'Finalize task',
    'improveWithAI': 'Improve with AI',
    
    // Input placeholders
    'typeCommand': 'Type a command...',
    'typeHashToSelect': 'Type # to select...',
    
    // Confirmation
    'task': 'Task',
    'newDescription': 'New description',
    'yesConfirm': 'Yes, confirm',
    'no': 'No',
    
    // Help menu
    'howToUse': 'How to use chat',
    'step1': '1. Select a task:',
    'step1Desc': 'and choose a task',
    'step2': '2. Quick commands:',
    'step2Cmd1': 'Mark as completed',
    'step2Cmd2': 'Back to pending',
    'step2Cmd3': 'Remove',
    'step2Cmd4': 'Update',
    'step3': '3. With AI:',
    'step3Cmd1': 'improve this task',
    'step3Cmd2': 'help me with this',
    'step3Cmd3': 'Or chat naturally!',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['pt-BR']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
