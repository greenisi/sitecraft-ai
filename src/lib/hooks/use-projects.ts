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
    }: {
      name: string;
      siteType: SiteType;
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

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          slug,
          site_type: siteType,
          generation_config: {
            siteType,
            business: { name: '', description: '', industry: '', targetAudience: '' },
            branding: {
              primaryColor: '#0f172a',
              secondaryColor: '#64748b',
              accentColor: '#3b82f6',
              fontHeading: 'Inter',
              fontBody: 'Inter',
              style: 'minimal',
            },
            sections: [],
            aiPrompt: '',
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
