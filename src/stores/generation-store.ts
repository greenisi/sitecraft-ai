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
            // Strip markdown fences from chunks so the live code viewer
            // only shows clean source code (not ```tsx:path headers).
            let cleanChunk = event.chunk;
            // Remove opening fence lines like ```tsx:src/components/Hero.tsx
            cleanChunk = cleanChunk.replace(/```\w*:[^\n]*\n?/g, '');
            // Remove closing fences
            cleanChunk = cleanChunk.replace(/^```\s*$/gm, '');

            if (cleanChunk) {
              components.set(event.componentName, {
                ...existing,
                chunks: [...existing.chunks, cleanChunk],
              });
              set({ components, events });
            }
          } else {
            // Auto-register component on first chunk if component-start
            // was missed (e.g. header split across chunks)
            let cleanChunk = event.chunk;
            cleanChunk = cleanChunk.replace(/```\w*:[^\n]*\n?/g, '');
            cleanChunk = cleanChunk.replace(/^```\s*$/gm, '');

            if (cleanChunk) {
              components.set(event.componentName, {
                name: event.componentName,
                status: 'generating',
                chunks: [cleanChunk],
              });
              set({ components, events });
            }
          }
        }
        break;
      }
      case 'component-complete': {
        if (event.componentName) {
          const components = new Map(state.components);
          const existing = components.get(event.componentName);

          // For components that were streamed, preserve their code chunks.
          // For scaffold/assembly files that had no streaming phase,
          // use the file content as a single chunk so the code viewer
          // always has something to display.
          let chunks = existing?.chunks ?? [];
          if (chunks.length === 0 && event.file?.content) {
            chunks = [event.file.content];
          }

          components.set(event.componentName, {
            name: event.componentName,
            status: 'complete',
            filePath: event.file?.path,
            chunks,
          });

          // Only update progress counters from the components stage.
          // Assembly-stage completions (scaffold files) should NOT
          // inflate the counter beyond the total.
          const isAssemblyStage = event.stage === 'assembly';
          const progress = isAssemblyStage
            ? state.progress
            : {
                total: event.totalFiles ?? state.progress.total,
                completed: Math.min(
                  event.completedFiles ?? state.progress.completed + 1,
                  event.totalFiles ?? state.progress.total
                ),
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
