'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PublishResult } from '@/types/api';

export function usePublish(projectId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (): Promise<PublishResult> => {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Publishing failed');
      }

      const { data } = await response.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (data.status === 'published') {
        toast.success('Published successfully!', {
          description: data.url,
        });
        return;
      }

      toast.info('Deployment in progress', {
        description: 'Your site is still building. Check back shortly.',
      });
    },
    onError: (error) => {
      toast.error('Publishing failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  return {
    publish: mutation.mutateAsync,
    isPublishing: mutation.isPending,
    publishedUrl:
      mutation.data?.status === 'published' ? mutation.data.url : null,
    publishStatus: mutation.data?.status ?? null,
    reset: mutation.reset,
  };
}
