// Chat sessions logic removed: provide a lightweight stub while cleaning up unused code.
export function useChatSessions() {
  return {
    sessions: [],
    currentSession: null,
    messages: [],
    isLoading: false,
    selectedTask: null,
    fetchSessions: async () => undefined,
    fetchMessages: async () => undefined,
    createSession: async () => null,
    selectSession: async () => undefined,
    deleteSession: async () => undefined,
    addMessage: async () => null,
    selectTaskForChat: async () => undefined,
    clearTaskSelection: async () => undefined,
    processDirectCommand: async () => false,
  } as const;
}
