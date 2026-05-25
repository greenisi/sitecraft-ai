'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/project';
import type { SiteType } from '@/lib/utils/constants';
import { toast } from 'sonner';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      siteType,
      prefill,
    }: {
      name: string;
      siteType: SiteType;
      // Optional prefill from the /for/[vertical] → /start funnel.
      // When set, the new project lands ready-to-generate for the right trade.
      prefill?: {
        industry?: string;        // e.g. 'pressure-washing' — the local-service prompt
                                   // detects this and injects trade-tuned hints
        businessName?: string;    // mirrored into generation_config.business.name
        verticalLabel?: string;   // friendly label used in the AI prompt seed
      };
    }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const slug = `${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}-${Date.now().toString(36).slice(-4)}`;

      const seededBusiness = {
        name:           prefill?.businessName || '',
        description:    '',
        industry:       prefill?.industry || '',
        targetAudience: '',
      };
      const seededAiPrompt = prefill?.verticalLabel
        ? `Generate a ${prefill.verticalLabel} business website` +
          (prefill.businessName ? ` for "${prefill.businessName}"` : '') +
          '.'
        : '';

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          slug,
          site_type: siteType,
          generation_config: {
            siteType,
            business: seededBusiness,
            branding: {
              primaryColor: '#0f172a',
              secondaryColor: '#64748b',
              accentColor: '#3b82f6',
              fontHeading: 'Inter',
              fontBody: 'Inter',
              style: 'minimal',
            },
            sections: [],
            aiPrompt: seededAiPrompt,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
    },
    onError: (error) => {
      toast.error('Failed to create project', {
        description: error.message,
      });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete project', {
        description: error.message,
      });
    },
  });
}
