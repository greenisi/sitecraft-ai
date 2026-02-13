'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useVisualEditorStore } from '@/stores/visual-editor-store';
import { toast } from 'sonner';

export function useVisualEditorSave(projectId: string) {
  const queryClient = useQueryClient();
  const { pendingChanges, setSaving, clearPendingChanges } =
    useVisualEditorStore();

  const save = useCallback(async () => {
    if (pendingChanges.length === 0) return;

    setSaving(true);

    try {
      const response = await fetch('/api/visual-editor/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          changes: pendingChanges,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Save failed');
      }

      const data = await response.json();

      // Invalidate cached files so preview reloads with new version
      await queryClient.invalidateQueries({
        queryKey: ['generated-files', projectId],
      });

      clearPendingChanges();

      toast.success('Changes saved', {
        description: `Version ${data.versionNumber} created with ${data.changesApplied} changes.`,
      });
    } catch (error) {
      toast.error('Failed to save changes', {
        description:
          error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  }, [projectId, pendingChanges, setSaving, clearPendingChanges, queryClient]);

  return { save };
}
