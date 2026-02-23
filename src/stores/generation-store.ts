import { create } from 'zustand';
import type { GenerationStage, GenerationEvent } from '@/types/generation';

export type ComponentStatus = 'pending' | 'generating' | 'complete' | 'error';

export interface ComponentState {
  name: string;
  status: ComponentStatus;
  filePath?: string;
  chunks: string[];
}

interface GenerationProgress {
  total: number;
  completed: number;
}

interface GenerationState {
  // State
  projectId: string | null;
  currentStage: GenerationStage | null;
  progress: GenerationProgress;
  components: Map<string, ComponentState>;
  isGenerating: boolean;
  error: string | null;
  events: GenerationEvent[];
  files: Record<string, string>;

  // Actions
  startGeneration: (projectId: string) => void;
  processEvent: (event: GenerationEvent) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  projectId: null as string | null,
  currentStage: null as GenerationStage | null,
  progress: { total: 0, completed: 0 },
  components: new Map<string, ComponentState>(),
  isGenerating: false,
  error: null as string | null,
  events: [] as GenerationEvent[],
  files: {} as Record<string, string>,
};

export const useGenerationStore = create<GenerationState>((set, get) => ({
  ...INITIAL_STATE,

  startGeneration: (projectId: string) => {
    set({
      ...INITIAL_STATE,
      projectId,
      isGenerating: true,
      components: new Map(),
      events: [],
      files: {},
    });
  },

  processEvent: (event: GenerationEvent) => {
    const state = get();
    const events = [...state.events, event].slice(-2000);

    switch (event.type) {
      case 'stage-start': {
        set({
          currentStage: event.stage ?? null,
          events,
          ...(event.stage === 'components' && event.totalFiles
            ? { progress: { total: event.totalFiles, completed: 0 } }
            : {}),
        });
        break;
      }
      case 'stage-complete': {
        set({ events });
        break;
      }
      case 'component-start': {
        if (event.componentName) {
          const components = new Map(state.components);
          components.set(event.componentName, {
            name: event.componentName,
            status: 'generating',
            chunks: [],
          });
          set({ components, events });
        }
        break;
      }
      case 'component-chunk': {
        if (event.componentName && event.chunk) {
          const components = new Map(state.components);
          const existing = components.get(event.componentName);
          if (existing) {
            components.set(event.componentName, {
              ...existing,
              chunks: [...existing.chunks, event.chunk],
            });
            set({ components, events });
          }
        }
        break;
      }
      case 'component-complete': {
        if (event.componentName) {
          const components = new Map(state.components);
          components.set(event.componentName, {
            name: event.componentName,
            status: 'complete',
            filePath: event.file?.path,
            chunks: components.get(event.componentName)?.chunks ?? [],
          });

          const progress = {
            total: event.totalFiles ?? state.progress.total,
            completed: event.completedFiles ?? state.progress.completed + 1,
          };

          const files = event.file
            ? { ...state.files, [event.file.path]: event.file.content }
            : state.files;

          set({ components, progress, events, files });
        }
        break;
      }
      case 'generation-complete': {
        set({
          currentStage: 'complete',
          isGenerating: false,
          progress: {
            total: event.totalFiles ?? state.progress.total,
            completed: event.totalFiles ?? state.progress.completed,
          },
          events,
        });
        break;
      }
      case 'error': {
        set({
          currentStage: 'error',
          isGenerating: false,
          error: event.error ?? 'An unknown error occurred',
          events,
        });
        break;
      }
    }
  },

  setError: (error: string) => {
    set({
      currentStage: 'error',
      isGenerating: false,
      error,
    });
  },

  reset: () => {
    set({
      ...INITIAL_STATE,
      components: new Map(),
      events: [],
      files: {},
    });
  },
}));
