/**
 * Background Generation Manager
 * 
 * Module-level singleton that manages SSE generation streams independently
 * of React component lifecycle. This allows users to navigate away from the
 * editor while generation continues in the background.
 */

import { readSSEStream } from '@/lib/ai/stream-handler';
import type { GenerationEvent } from '@/types/generation';

export type BGStatus = 'idle' | 'generating' | 'complete' | 'error';

export interface BGState {
    projectId: string;
    status: BGStatus;
    events: GenerationEvent[];
    error: string | null;
    startedAt: string;
    completedAt: string | null;
}

type Listener = (state: BGState) => void;

// Module-level state: survives component remounts and route changes
const activeGenerations = new Map<string, BGState>();
const listeners = new Map<string, Set<Listener>>();

function notifyListeners(projectId: string) {
    const state = activeGenerations.get(projectId);
    if (!state) return;
    const projectListeners = listeners.get(projectId);
    if (projectListeners) {
          projectListeners.forEach((fn) => {
                  try { fn(state); } catch {}
          });
    }
    // Also notify global listeners (for dashboard)
  const globalListeners = listeners.get('__global__');
    if (globalListeners) {
          globalListeners.forEach((fn) => {
                  try { fn(state); } catch {}
          });
    }
}

export function subscribe(projectId: string, fn: Listener): () => void {
    if (!listeners.has(projectId)) listeners.set(projectId, new Set());
    listeners.get(projectId)!.add(fn);
    // Immediately call with current state if exists
  const current = activeGenerations.get(projectId);
    if (current) fn(current);
    return () => {
          listeners.get(projectId)?.delete(fn);
    };
}

export function subscribeGlobal(fn: Listener): () => void {
    if (!listeners.has('__global__')) listeners.set('__global__', new Set());
    listeners.get('__global__')!.add(fn);
    return () => {
          listeners.get('__global__')?.delete(fn);
    };
}

export function getGenerationState(projectId: string): BGState | null {
    return activeGenerations.get(projectId) || null;
}

export function getAllActiveGenerations(): BGState[] {
    return Array.from(activeGenerations.values()).filter(
          (s) => s.status === 'generating'
        );
}

export function isGenerating(projectId: string): boolean {
    const state = activeGenerations.get(projectId);
    return state?.status === 'generating' || false;
}

export function clearGeneration(projectId: string): void {
    activeGenerations.delete(projectId);
    listeners.delete(projectId);
}

/**
 * Start a background generation. Reads the SSE stream and stores all events.
 * Returns a promise that resolves when generation completes or rejects on error.
 */
export async function startBackgroundGeneration(
    projectId: string,
    config: Record<string, unknown>,
    onEvent?: (event: GenerationEvent) => void
  ): Promise<BGState> {
    // If already generating for this project, don't start another
  if (isGenerating(projectId)) {
        return activeGenerations.get(projectId)!;
  }

  const state: BGState = {
        projectId,
        status: 'generating',
        events: [],
        error: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
  };

  activeGenerations.set(projectId, state);
    notifyListeners(projectId);

  try {
        const response = await fetch((config._editMode ? '/api/generate/edit' : '/api/generate/stream'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config._editMode ? { projectId, editInstructions: config.editInstructions, targetFiles: config.targetFiles } : { projectId, config }),
        });

      if (!response.ok) {
              let errMsg = `Generation failed (${response.status})`;
              try {
                        const errData = await response.json();
                        errMsg = errData.error || errMsg;
              } catch {}
              throw new Error(errMsg);
      }

      if (!response.body) {
              throw new Error('No response stream');
      }

      for await (const event of readSSEStream(response.body)) {
              state.events.push(event);
              // Keep events bounded
          if (state.events.length > 2000) {
                    state.events = state.events.slice(-1500);
          }

          if (onEvent) {
                    try { onEvent(event); } catch {}
          }

          notifyListeners(projectId);

          if (event.type === 'generation-complete') {
                    state.status = 'complete';
                    state.completedAt = new Date().toISOString();
                    activeGenerations.set(projectId, { ...state });
                    notifyListeners(projectId);
                    return state;
          }

          if (event.type === 'error') {
                    state.status = 'error';
                    state.error = event.error || 'Unknown error';
                    activeGenerations.set(projectId, { ...state });
                    notifyListeners(projectId);
                    return state;
          }
      }

      // Stream ended without explicit complete event
      state.status = 'complete';
        state.completedAt = new Date().toISOString();
        activeGenerations.set(projectId, { ...state });
        notifyListeners(projectId);
        return state;
  } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        state.status = 'error';
        state.error = errMsg;
        activeGenerations.set(projectId, { ...state });
        notifyListeners(projectId);
        throw error;
  }
}
