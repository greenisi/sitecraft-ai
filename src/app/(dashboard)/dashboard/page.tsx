'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Clock, Pencil, Trash2, Sparkles, Loader2, Inbox, Settings, Megaphone, ArrowRight, CreditCard, GraduationCap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';
import { usePageTour } from '@/components/tour/use-page-tour';
import {
  subscribeGlobal,
  getAllActiveGenerations,
  isGenerating as bgIsGenerating,
} from '@/lib/generation/background-generation';
import { toast } from 'sonner';
import { Portal } from '@/components/ui/portal';
import { FreePlanAd } from '@/components/monetization/free-plan-ad';

interface Project {
  id: string;
  name: string;
  description: string | null;
  site_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  thumbnail_url: string | null;
  published_url: string | null;
  slug: string;
}


// Mini browser-frame preview for project cards
function ProjectPreview({ project, isGenerating: generating }: { project: Project; isGenerating: boolean }) {
  const hasPreview = project.status === 'published' && project.published_url;
  const isGenerated = ['generated', 'deployed', 'published'].includes(project.status);
  const previewLabel = project.status === 'deployed'
    ? 'Deployment in progress'
    : 'Ready to publish';

  // Generating animation
  if (generating) {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: '#0a0f1a' }}>
        {/* Animated code lines */}
        <div className="absolute inset-0 flex flex-col gap-2 p-4 opacity-60">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center" style={{ animationDelay: `${i * 0.15}s` }}>
              <div
                className="h-2 rounded-full shrink-0"
                style={{
                  width: `${12 + ((i * 7) % 20)}%`,
                  background: 'rgba(139,92,246,0.3)',
                  animation: `shimmer 2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${20 + ((i * 11) % 40)}%`,
                  background: 'rgba(56,189,248,0.2)',
                  animation: `shimmer 2s ease-in-out ${i * 0.2 + 0.3}s infinite`,
                }}
              />
            </div>
          ))}
        </div>
        {/* Center spinner */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-violet-500/30" />
              <div
                className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-violet-500"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-violet-400" />
            </div>
            <span className="text-[10px] font-medium text-violet-300/80">Building...</span>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
          @keyframes spin { to { transform: rotate(360deg); } }
        ` }} />
      </div>
    );
  }

  // Published site — show live iframe preview
  if (hasPreview && project.published_url) {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: '#0f172a' }}>
        {/* Mini browser chrome */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b" style={{ background: 'rgba(30,41,59,0.9)', borderColor: 'rgba(71,85,105,0.3)' }}>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 mx-2 px-2 py-0.5 rounded text-[8px] text-gray-500 truncate font-mono"
            style={{ background: 'rgba(15,23,42,0.6)' }}
          >
            {project.published_url.replace('https://', '')}
          </div>
        </div>
        {/* Scaled iframe */}
        <div className="relative w-[300%] h-[300%] origin-top-left" style={{ transform: 'scale(0.333)' }}>
          <iframe
            src={project.published_url}
            className="w-full h-full border-0"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
            tabIndex={-1}
            style={{ pointerEvents: 'none' }}
          />
        </div>
      </div>
    );
  }

  // Generated but not published — show code preview placeholder
  if (isGenerated) {
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}>
        <div className="text-center">
          <div className="w-16 h-10 mx-auto mb-2 rounded border border-violet-500/30 overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)' }}>
            <div className="p-1 space-y-0.5">
              <div className="h-1 w-8 rounded-full bg-violet-500/30" />
              <div className="h-1 w-6 rounded-full bg-blue-500/20" />
              <div className="h-1 w-10 rounded-full bg-violet-500/20" />
            </div>
          </div>
          <span className="text-[10px] text-violet-300/60">{previewLabel}</span>
        </div>
      </div>
    );
  }

  // Draft — show initial
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(15,23,42,0.6)' }}>
      <div className="text-3xl text-gray-600">
        {project.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  usePageTour('dashboard');

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState('free');
  const [planLoaded, setPlanLoaded] = useState(false);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());


  // Helper to refresh project list from Supabase
  const refreshProjects = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (data) setProjects(data);
  }, [user]);

  // Poll server for generating projects that the client doesn't know about
  // (e.g. after page refresh or new tab)
  const pollingRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const serverCheckRanRef = useRef(false);

  useEffect(() => {
    if (!user || !projects.length) return;
    if (serverCheckRanRef.current) return;
    serverCheckRanRef.current = true;

    // Find projects with 'generating' status in DB that we don't already
    // know about via the module-level background generation tracker
    const serverGenerating = projects.filter(
      (p) => p.status === 'generating' && !bgIsGenerating(p.id)
    );

    if (serverGenerating.length > 0) {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        serverGenerating.forEach((p) => next.add(p.id));
        return next;
      });

      // Poll the server for these projects until they complete
      pollingRef.current = setInterval(async () => {
        let anyStillGenerating = false;

        for (const proj of serverGenerating) {
          try {
            const res = await fetch(
              `/api/generate/status?projectId=${encodeURIComponent(proj.id)}`
            );
            if (!res.ok) continue;
            const data = await res.json();

            const isComplete =
              data.projectStatus === 'generated' ||
              data.projectStatus === 'published' ||
              data.projectStatus === 'deployed' ||
              (data.latestVersion && data.latestVersion.status === 'complete');

            const isError =
              data.projectStatus === 'error' ||
              (data.latestVersion && data.latestVersion.status === 'error');

            if (isComplete) {
              setGeneratingIds((prev) => {
                const next = new Set(prev);
                next.delete(proj.id);
                return next;
              });
              toast.success('Website generated!', {
                description: `${proj.name} is ready. Click the project to view it.`,
                duration: 5000,
              });
              refreshProjects();
            } else if (isError) {
              setGeneratingIds((prev) => {
                const next = new Set(prev);
                next.delete(proj.id);
                return next;
              });
              refreshProjects();
            } else {
              anyStillGenerating = true;
            }
          } catch {
            anyStillGenerating = true;
          }
        }

        if (!anyStillGenerating && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = undefined;
        }
      }, 5000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = undefined;
      }
    };
  }, [user, projects.length, refreshProjects]);

  // Track background generations (module-level — survives in-app navigation)
  useEffect(() => {
    // Initialize with currently active generations
    const active = getAllActiveGenerations();
    if (active.length > 0) {
      setGeneratingIds(new Set(active.map((g) => g.projectId)));
    }

    // Subscribe to generation state changes
    const unsub = subscribeGlobal((state) => {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        if (state.status === 'generating') {
          next.add(state.projectId);
        } else {
          next.delete(state.projectId);
        }
        return next;
      });

      // Refresh project list and show toast when background generation completes
      if (state.status === 'complete') {
        toast.success('Website generated!', {
          description: 'Your site is ready. Click the project to view it.',
          duration: 5000,
        });
        refreshProjects();
      }
      if (state.status === 'error') {
        refreshProjects();
      }
    });

    return unsub;
  }, [refreshProjects]);

  useEffect(() => {
    if (user) {
      const supabase = createClient();

      supabase
        .from('profiles')
        .select('generation_credits, plan')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCredits(data.generation_credits);
            setPlan(data.plan);
          }
          setPlanLoaded(true);
        });

      supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .then(({ data }) => {
          if (data) setProjects(data);
          setLoading(false);
        });
    }
  }, [user]);

  // Skip the setup modal entirely: create a blank draft and drop the user
  // straight into the chat editor. Their first prompt describes the site and
  // the generator auto-names the project (smart title), so there's nothing to
  // fill in up front. Name starts as 'Untitled Project' — the sentinel the
  // editor welcome screen uses to show its clean generic prompt.
  const createAndOpenProject = async () => {
    if (creating || !user) return;
    setCreating(true);
    try {
      const supabase = createClient();
      const slug = 'site-' + Date.now().toString(36);

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: 'Untitled Project',
          slug,
          site_type: 'business',
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      if (data) router.push(`/projects/${data.id}`);
    } catch {
      toast.error('Failed to create project');
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (bgIsGenerating(id)) {
      toast.error('Cannot delete while generating', {
        description: 'Wait for the generation to complete first.',
      });
      return;
    }
    setDeletingId(id);
    try {
      const supabase = createClient();
      await supabase.from('projects').delete().eq('id', id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="pt-4 md:pt-8 max-w-7xl mx-auto">
      {/* Mobbin-inspired command header: one primary action, supporting tools stay secondary. */}
      <section className="premium-feature-card relative mb-6 overflow-hidden rounded-[26px] border border-white/10 bg-[#0d1220]/90 p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-violet-300">
              <Sparkles className="h-3.5 w-3.5" /> Sitecraft workspace
            </div>
            <h1 className="max-w-xl text-3xl font-semibold tracking-[-.045em] text-white sm:text-4xl">
              What are we building today?
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-white/45">
              Start with one idea. Sitecraft handles the structure, design, and business tools around it.
            </p>
          </div>

          <button
            onClick={createAndOpenProject}
            disabled={creating}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-violet-100 disabled:opacity-70 sm:w-auto"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create a website
            {!creating && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:flex sm:items-center">
        <Link href="/cards" className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-medium text-white/75 transition hover:border-violet-400/30 hover:bg-white/[0.06]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><CreditCard className="h-4 w-4" /></span>
          Business cards
        </Link>
        <Link href="/academy" className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-medium text-white/75 transition hover:border-cyan-400/30 hover:bg-white/[0.06]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300"><GraduationCap className="h-4 w-4" /></span>
          Academy
        </Link>
        <div className="col-span-2 ml-auto flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-amber-400"
            style={{ background: 'rgba(245,158,11,0.1)' }}
          >
            <Sparkles className="h-3 w-3" />
            <span className="tabular-nums">
              {credits >= 999999 ? '\u221e' : credits}
            </span>
          </div>
          {plan !== 'free' && (
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{
                background: 'rgba(139,92,246,0.15)',
                color: '#a78bfa',
              }}
            >
              <Sparkles className="h-3 w-3" />
              {plan === 'pro' ? 'Pro' : 'Beta Pro'}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Recent websites</h2>
          <p className="mt-0.5 text-xs text-white/35">Continue where you left off</p>
        </div>
        <span className="text-xs text-white/30">{projects.length} total</span>
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">No projects yet</p>
          <button
            onClick={createAndOpenProject}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-70"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            }}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {projects.map((project) => {
            const isProjectGenerating = generatingIds.has(project.id);

            return (
              <div
                key={project.id}
                className="group min-w-[84vw] snap-center overflow-hidden rounded-2xl transition-all hover:-translate-y-1 sm:min-w-0"
                style={{
                  background: 'rgba(30,41,59,0.5)',
                  border: isProjectGenerating
                    ? '1px solid rgba(139,92,246,0.5)'
                    : '1px solid rgba(71,85,105,0.3)',
                }}
              >
                <div
                  className="aspect-[16/10] overflow-hidden cursor-pointer relative"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <ProjectPreview project={project} isGenerating={isProjectGenerating} />
                </div>

                <div className="p-4 sm:p-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-base truncate flex-1">
                      {project.name}
                    </h3>
                    {isProjectGenerating && (
                      <span className="flex h-2.5 w-2.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-violet-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {isProjectGenerating
                      ? 'Building your website...'
                      : project.description || project.site_type || 'No description'}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(project.updated_at || project.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setConfirmDeleteId(project.id)}
                        disabled={deletingId === project.id || isProjectGenerating}
                        className="hidden items-center justify-center w-11 h-11 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-50 sm:flex"
                      >
                        {deletingId === project.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/projects/${project.id}/leads`);
                        }}
                        className="hidden items-center justify-center w-11 h-11 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-white/5 transition-colors sm:flex"
                        title="View leads & orders"
                      >
                        <Inbox className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/projects/${project.id}/admin/marketing`);
                        }}
                        className="hidden sm:flex items-center justify-center w-11 h-11 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-white/5 transition-colors"
                        title="Marketing"
                      >
                        <Megaphone className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/projects/${project.id}/admin`);
                        }}
                        className="hidden sm:flex items-center justify-center w-11 h-11 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-white/5 transition-colors"
                        title="Settings"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/projects/${project.id}`)
                        }
                        className="flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg text-base text-violet-400 hover:text-violet-300 hover:bg-white/5 font-medium transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                        {isProjectGenerating ? 'View' : 'Edit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {planLoaded && plan === 'free' && (
        <FreePlanAd slot={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_DASHBOARD_SLOT || ''} />
      )}

            {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <Portal>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDeleteId(null)}
          />
          <div
            className="relative w-full max-w-sm rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'rgba(239,68,68,0.15)' }}
              >
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Delete Project</h2>
                <p className="text-xs text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">
                {projects.find((p) => p.id === confirmDeleteId)?.name || 'this project'}
              </span>
              ? All data including generated files, chat history, and settings will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-4 rounded-xl text-base font-medium text-gray-400 transition-colors hover:text-white"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 py-4 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}
              >
                {deletingId === confirmDeleteId ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

    </div>
  );
  }
