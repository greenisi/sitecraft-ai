import { create } from 'zustand';

export interface ChatMessageLocal {
  id: string;
  project_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: {
    stage?: 'parsing' | 'generating' | 'complete' | 'error';
    generationVersionId?: string;
    followUpSuggestions?: string[];
  };
  created_at: string;
}

type ProcessingStage = 'idle' | 'parsing' | 'generating' | 'complete' | 'error';

interface ChatState {
  messages: ChatMessageLocal[];
  isProcessing: boolean;
  processingStage: ProcessingStage;

  setMessages: (messages: ChatMessageLocal[]) => void;
  addMessage: (message: ChatMessageLocal) => void;
  updateLastAssistantMessage: (content: string, metadata?: ChatMessageLocal['metadata']) => void;
  setProcessing: (isProcessing: boolean, stage?: ProcessingStage) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isProcessing: false,
  processingStage: 'idle',

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateLastAssistantMessage: (content, metadata) =>
    set((state) => {
      const messages = [...state.messages];
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          messages[i] = {
            ...messages[i],
            content,
            ...(metadata ? { metadata } : {}),
          };
          break;
        }
      }
      return { messages };
    }),

  setProcessing: (isProcessing, stage = 'idle') =>
    set({ isProcessing, processingStage: stage }),

  reset: () =>
    set({
      messages: [],
      isProcessing: false,
      processingStage: 'idle',
    }),
}));
