'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/project';
import type { SiteType } from '@/lib/utils/constants';
import {
  buildWebsiteBrief,
  modelTierForJourney,
  siteTypeForJourney,
  type WebsiteJourneyAnswers,
} from '@/lib/intake/website-journey';
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
      journey,
      shareDataWithProjectId,
    }: {
      name: string;
      siteType: SiteType;
      /**
       * Pool this project's customer data (leads, bookings, orders) with an
       * existing project of the same owner. Omitted means its own island,
       * which is the default and what every existing project does.
       */
      shareDataWithProjectId?: string;
      // Optional prefill from the /for/[vertical] → /start funnel.
      // When set, the new project lands ready-to-generate for the right trade.
      prefill?: {
        industry?: string;        // e.g. 'pressure-washing' — the local-service prompt
                                   // detects this and injects trade-tuned hints
        businessName?: string;    // mirrored into generation_config.business.name
        verticalLabel?: string;   // friendly label used in the AI prompt seed
      };
      journey?: WebsiteJourneyAnswers;
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

      const resolvedSiteType = journey ? siteTypeForJourney(journey.businessModel) : siteType;
      const seededBusiness = {
        name: journey?.businessName || prefill?.businessName || '',
        description: journey?.offer || '',
        industry: journey?.industry || prefill?.industry || '',
        targetAudience: journey?.idealCustomer || '',
      };
      const seededAiPrompt = journey
        ? buildWebsiteBrief(journey)
        : prefill?.verticalLabel
          ? `Generate a ${prefill.verticalLabel} business website` +
            (prefill.businessName ? ` for "${prefill.businessName}"` : '') +
            '.'
          : '';

      // Resolve the group to join BEFORE inserting. The lookup is scoped to
      // this user so a stale or tampered id can never pool a stranger's
      // customers into the new project.
      let dataGroupId: string | undefined;
      if (shareDataWithProjectId) {
        const { data: sibling } = await supabase
          .from('projects')
          .select('data_group_id')
          .eq('id', shareDataWithProjectId)
          .eq('user_id', user.id)
          .maybeSingle();
        dataGroupId = (sibling as { data_group_id?: string } | null)?.data_group_id;
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          slug,
          site_type: resolvedSiteType,
          ...(dataGroupId ? { data_group_id: dataGroupId } : {}),
          generation_config: {
            siteType: resolvedSiteType,
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
            ...(journey ? { modelTier: modelTierForJourney(journey) } : {}),
            ...(journey
              ? {
                  intake: {
                    version: 1,
                    completedAt: new Date().toISOString(),
                    answers: journey,
                  },
                }
              : {}),
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
