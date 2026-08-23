'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearGeneration } from '@/lib/generation/background-generation';
import {
  fetchGenerationStatus,
  isGenerationComplete,
  isGenerationError,
  isGenerationInFlight,
} from '@/lib/generation/status';
import { createClient } from '@/lib/supabase/client';
import { useChatStore } from '@/stores/chat-store';
import { useGenerationStore } from '@/stores/generation-store';

/**
 * Hook that restores generation state on mount and keeps it live via
 * Supabase Realtime. This is what makes the editor resilient to tab close,
 * refresh, and project switching: when the user lands on a project (for any
 * reason), we look at the latest version row and:
 *
 *   - If status is terminal, clear any stale local "generating" state and
 *     force the preview back to the persisted DB-backed files.
 *   - If status === 'generating', seed the generation store with whatever
 *     files have already landed in the DB and subscribe to Realtime updates
 *     on `generated_files` (new file inserts) and `generation_versions`
 *     (status flip to complete/error). The user sees the in-flight build
 *     resume right where the original tab left off.
 *
 * The original tab's SSE stream may have died, but the server-side pipeline
 * keeps writing to the DB regardless (see stream-handler.ts cancel() no-op),
 * so live progress just keeps flowing through Realtime.
 */
export function useResumeGeneration(projectId: string | null | undefined) {
  const startGeneration = useGenerationStore((s) => s.startGeneration);
  const processEvent = useGenerationStore((s) => s.processEvent);
  const reset = useGenerationStore((s) => s.reset);
  const currentStoreProjectId = useGenerationStore((s) => s.projectId);
  const setProcessing = useChatStore((s) => s.setProcessing);
  const queryClient = useQueryClient();

  // Track which project we're subscribed to so we can clean up on switch
  const activeSubscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    // If the store is already tracking a different project, clear it. This
    // keeps multi-project hops clean — switching from A to B doesn't carry
    // A's progress into B's view.
    if (currentStoreProjectId && currentStoreProjectId !== projectId) {
      reset();
    }

    let cancelled = false;
    const supabase = createClient();

    const reconcileFromDatabase = async () => {
      try {
        const status = await fetchGenerationStatus(projectId);
        if (cancelled) return null;

        if (isGenerationComplete(status)) {
          reset();
          setProcessing(false, 'complete');
          clearGeneration(projectId);
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ['generated-files', projectId],
            }),
            queryClient.invalidateQueries({
              queryKey: ['project', projectId],
            }),
          ]);
          return null;
        }

        if (isGenerationError(status)) {
          reset();
          setProcessing(false, 'error');
          clearGeneration(projectId);
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ['generated-files', projectId],
            }),
            queryClient.invalidateQueries({
              queryKey: ['project', projectId],
            }),
          ]);
          return null;
        }

        return status;
      } catch {
        return null;
      }
    };

    const init = async () => {
      // Always trust the persisted DB status before looking at any local
      // generation state. This lets a remount recover immediately if the
      // SSE stream already died but the backend finished in the background.
      const status = await reconcileFromDatabase();
      if (cancelled || !status?.latestVersion) return;

      if (!isGenerationInFlight(status)) return;

      const latest = status.latestVersion;

      // Seed the store from any files that have already been persisted.
      const { data: existingFiles } = await supabase
        .from('generated_files')
        .select('file_path, content')
        .eq('version_id', latest.id)
        .order('file_path');

      if (cancelled) return;

      setProcessing(true, 'generating');
      startGeneration(projectId);
      processEvent({
        type: 'stage-start',
        stage: 'components',
        totalFiles: (existingFiles?.length ?? 0) + 1,
        completedFiles: existingFiles?.length ?? 0,
      });

      for (const f of existingFiles ?? []) {
        const componentName = extractComponentName(f.file_path);
        processEvent({
          type: 'component-complete',
          stage: 'components',
          componentName,
          file: { path: f.file_path, content: f.content },
        });
      }

      // Subscribe to live file inserts and the version status flip.
      const channel = supabase
        .channel(`generation:${latest.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'generated_files',
            filter: `version_id=eq.${latest.id}`,
          },
          (payload) => {
            const row = payload.new as { file_path: string; content: string };
            processEvent({
              type: 'component-complete',
              stage: 'components',
              componentName: extractComponentName(row.file_path),
              file: { path: row.file_path, content: row.content },
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'generation_versions',
            filter: `id=eq.${latest.id}`,
          },
          (payload) => {
            const row = payload.new as { status: string };
            if (row.status === 'complete') {
              void reconcileFromDatabase();
            } else if (row.status === 'error') {
              void reconcileFromDatabase();
            }
          }
        );

      await channel.subscribe((subscriptionStatus) => {
        if (
          subscriptionStatus === 'CHANNEL_ERROR' ||
          subscriptionStatus === 'TIMED_OUT' ||
          subscriptionStatus === 'CLOSED'
        ) {
          void reconcileFromDatabase();
        }
      });
      activeSubscriptionRef.current = latest.id;

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanupPromise = init();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void reconcileFromDatabase();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      activeSubscriptionRef.current = null;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanupPromise.then((cleanup) => cleanup?.());
    };
    // We intentionally exclude store actions from deps — they're stable
    // refs from zustand. Re-running on every render would tear down and
    // recreate the subscription needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
}

function extractComponentName(filePath: string): string {
  const match = filePath.match(/\/([^/]+)\.(tsx?|jsx?|css)$/);
  return match ? match[1] : filePath;
}
