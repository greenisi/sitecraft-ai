'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { useCreateProject } from '@/lib/hooks/use-projects';
import { useUser } from '@/lib/hooks/use-user';
import { toast } from 'sonner';

/**
 * /projects/new
 *
 * Landing point for users coming from the marketing welcome email
 * (/start → login → here). Reads the prefill payload from URL query
 * (and sessionStorage as backup), creates a project with the right
 * vertical/industry baked into generation_config, then redirects to
 * the workspace ready to generate.
 *
 * Without a prefill the page becomes a thin "what kind of site" picker —
 * but for the home-pro funnel, every visit arrives with vertical+business.
 */

const VERTICAL_LABELS: Record<string, string> = {
  'pressure-washing': 'pressure washing',
  'lawn-care':        'lawn care',
  'junk-removal':     'junk removal',
  'painting':         'painting',
  'hvac':             'HVAC',
  'roofing':          'roofing',
  'plumbing':         'plumbing',
  'electrical':       'electrical',
  'landscaping':      'landscaping',
  'general':          'home service',
};

export default function NewProjectPage() {
  return (
    <Suspense fallback={null}>
      <NewProjectClient />
    </Suspense>
  );
}

function NewProjectClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const createProject = useCreateProject();
  const triggeredRef = useRef(false);
  const [stage, setStage] = useState<'reading' | 'creating' | 'error'>('reading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading || triggeredRef.current) return;
    if (!user) {
      // Not authed — bounce to login with this page as the next destination.
      const here = window.location.pathname + window.location.search;
      router.replace('/login?redirect=' + encodeURIComponent(here));
      return;
    }
    triggeredRef.current = true;

    // Resolve prefill: query params win, sessionStorage as backup.
    let vertical = (params.get('vertical') || '').toLowerCase();
    let businessName = params.get('business') || '';
    if (!vertical && typeof sessionStorage !== 'undefined') {
      try {
        const stash = JSON.parse(sessionStorage.getItem('sitecraft.start_prefill') || '{}');
        if (typeof stash.vertical === 'string') vertical = stash.vertical.toLowerCase();
        if (!businessName && typeof stash.businessName === 'string') businessName = stash.businessName;
      } catch {}
    }

    const verticalLabel = VERTICAL_LABELS[vertical] ?? vertical;
    const projectName = businessName || (verticalLabel ? `My ${verticalLabel} site` : 'New site');

    setStage('creating');
    createProject.mutate(
      {
        name: projectName,
        siteType: 'local-service', // home pros go through local-service routing
        prefill: vertical ? { industry: vertical, businessName, verticalLabel } : undefined,
      },
      {
        onSuccess: (project) => {
          // Clear the stash now that we've consumed it.
          try { sessionStorage.removeItem('sitecraft.start_prefill'); } catch {}
          router.replace(`/projects/${project.id}/workspace`);
        },
        onError: (e) => {
          const msg = e instanceof Error ? e.message : 'Could not create project';
          setErrorMsg(msg);
          setStage('error');
          toast.error('Could not create project', { description: msg });
        },
      },
    );
  }, [user, userLoading, params, router, createProject]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 text-center">
        {stage === 'error' ? (
          <>
            <h1 className="text-2xl font-semibold mb-3">Couldn't start your project</h1>
            <p className="text-gray-400 mb-6">{errorMsg}</p>
            <button
              onClick={() => router.replace('/dashboard')}
              className="rounded-full bg-white text-gray-950 px-5 py-2 font-medium"
            >
              Go to dashboard
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-semibold mb-3">Setting up your site…</h1>
            <p className="text-gray-300 mb-4">
              {stage === 'reading' ? 'Reading your details' : 'Creating your project'}
            </p>
            <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Almost there
            </div>
          </>
        )}
      </div>
    </div>
  );
}
