'use client';

import { useCallback, useRef } from 'react';
import { useGenerationStore, type ComponentState } from '@/stores/generation-store';
import { readSSEStream } from '@/lib/ai/stream-handler';
import type { GenerationConfig } from '@/types/project';
import type { GenerationStage, GenerationEvent } from '@/types/generation';

interface UseGenerationOptions {
  /** Called when the entire generation completes successfully. */
  onComplete?: () => void;
  /** Called when the generation encounters an error. */
  onError?: (error: string) => void;
}

interface UseGenerationReturn {
  /** Starts the generation pipeline for the given project. */
  startGeneration: (projectId: string, config: GenerationConfig) => Promise<void>;
  /** Aborts an in-progress generation. */
  abort: () => void;
  /** Current generation stage. */
  currentStage: GenerationStage | null;
  /** File progress (total and completed counts). */
  progress: { total: number; completed: number };
  /** Per-component generation status map. */
  components: Map<string, ComponentState>;
  /** Whether a generation is currently in progress. */
  isGenerating: boolean;
  /** Error message, if any. */
  error: string | null;
  /** Log of recent generation events. */
  events: GenerationEvent[];
  /** Resets all generation state. */
  reset: () => void;
}

/**
 * Hook for triggering and tracking site generation via SSE.
 *
 * Connects to `/api/generate/stream`, parses the SSE event stream,
 * and keeps the Zustand generation store updated in real-time.
 */
export function useGeneration(options: UseGenerationOptions = {}): UseGenerationReturn {
  const { onComplete, onError } = options;

  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    currentStage,
    progress,
    components,
    isGenerating,
    error,
    events,
    startGeneration: storeStart,
    processEvent,
    setError,
    reset,
  } = useGenerationStore();

  const startGeneration = useCallback(
    async (projectId: string, config: GenerationConfig) => {
      // Abort any existing generation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Reset and mark as generating
      storeStart(projectId);

      try {
        const response = await fetch('/api/generate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, config }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          let message = `Generation request failed (${response.status})`;
          try {
            const errorBody = await response.json();
            if (errorBody.error) {
              message = errorBody.error;
            }
          } catch {
            // Ignore JSON parse errors for error response
          }
          throw new Error(message);
        }

        if (!response.body) {
          throw new Error('No response body -- SSE streaming not supported');
        }

        // Read and process the SSE stream
        for await (const event of readSSEStream(response.body)) {
          // Check if aborted
          if (abortController.signal.aborted) {
            break;
          }

          processEvent(event);

          // Handle terminal events
          if (event.type === 'generation-complete') {
            onComplete?.();
          } else if (event.type === 'error') {
            onError?.(event.error ?? 'Unknown error');
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // User-initiated abort -- not an error
          reset();
          return;
        }

        const message = err instanceof Error ? err.message : 'Generation failed unexpectedly';
        setError(message);
        onError?.(message);
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [storeStart, processEvent, setError, reset, onComplete, onError]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    startGeneration,
    abort,
    currentStage,
    progress,
    components,
    isGenerating,
    error,
    events,
    reset,
  };
}
