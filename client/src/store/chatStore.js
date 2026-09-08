import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useChatStore = create(
  persist(
    (set, get) => ({
      conversations: {},
      currentConversationId: null,
      isOpen: false,
      isMinimized: false,
      streaming: false,

      createConversation: (userRole) => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const welcomeMsg = userRole === 'provider' 
          ? "Hello! I'm your Servio provider assistant. I can help you manage incoming jobs, update statuses, view your schedule, and answer any questions. What would you like to do?"
          : "Hello! I'm Servio AI, your home service assistant. I can help you book services (AC repair, plumbing, cleaning, etc.), track requests, compare providers, and answer questions. How can I help you today? 🇧🇩";
        
        set(state => ({
          conversations: {
            ...state.conversations,
            [id]: {
              id,
              messages: [
                { role: 'assistant', content: welcomeMsg, timestamp: Date.now() }
              ],
              userRole,
              createdAt: Date.now()
            }
          },
          currentConversationId: id,
          isOpen: true
        }));
        return id;
      },

      setCurrentConversation: (id) => set({ currentConversationId: id }),

      addMessage: (conversationId, message) => set(state => {
        const conv = state.conversations[conversationId];
        if (!conv) return state;
        return {
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conv,
              messages: [...conv.messages, { ...message, timestamp: Date.now() }]
            }
          }
        };
      }),

      updateLastMessage: (conversationId, content) => set(state => {
        const conv = state.conversations[conversationId];
        if (!conv || conv.messages.length === 0) return state;
        const messages = [...conv.messages];
        messages[messages.length - 1] = { ...messages[messages.length - 1], content };
        return {
          conversations: {
            ...state.conversations,
            [conversationId]: { ...conv, messages }
          }
        };
      }),

      appendToLastMessage: (conversationId, content) => set(state => {
        const conv = state.conversations[conversationId];
        if (!conv || conv.messages.length === 0) return state;
        const messages = [...conv.messages];
        messages[messages.length - 1] = { 
          ...messages[messages.length - 1], 
          content: messages[messages.length - 1].content + content 
        };
        return {
          conversations: {
            ...state.conversations,
            [conversationId]: { ...conv, messages }
          }
        };
      }),

      setStreaming: (streaming) => set({ streaming }),

      toggleOpen: () => set(state => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
      toggleMinimize: () => set(state => ({ isMinimized: !state.isMinimized })),

      clearConversation: (conversationId) => set(state => {
        const { [conversationId]: removed, ...rest } = state.conversations;
        return {
          conversations: rest,
          currentConversationId: state.currentConversationId === conversationId 
            ? Object.keys(rest)[0] || null 
            : state.currentConversationId
        };
      }),

      getCurrentConversation: () => {
        const { conversations, currentConversationId } = get();
        return conversations[currentConversationId] || null;
      },

      exportConversation: (conversationId) => {
        const conv = get().conversations[conversationId];
        if (!conv) return null;
        return JSON.stringify(conv, null, 2);
      }
    }),
    {
      name: 'servio-chat',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId
      })
    }
  )
);