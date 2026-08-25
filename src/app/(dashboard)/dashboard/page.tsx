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

  // Generated but not published. Most of the library sits in this state,
  // so it used to be a wall of navy gradient boxes with a tiny fake
  // browser in the middle, which read as unfinished. A quiet page
  // skeleton at least says what the thing is.
  if (isGenerated) {
    return (
      <div className="relative flex h-full w-full flex-col justify-center gap-2 overflow-hidden bg-[color:var(--surface-2)] px-6">
        <div className="h-1.5 w-9 rounded-full bg-white/[0.14]" />
        <div className="h-1.5 w-full max-w-[7rem] rounded-full bg-white/[0.09]" />
        <div className="h-1.5 w-full max-w-[5rem] rounded-full bg-white/[0.09]" />
        <div className="mt-1.5 flex gap-1.5">
          <div className="h-4 w-11 rounded-[5px] bg-[color:var(--accent)]/25" />
          <div className="h-4 w-8 rounded-[5px] bg-white/[0.07]" />
        </div>
        <span className="absolute bottom-2.5 right-3 text-[10px] text-[color:var(--label-3)]">{previewLabel}</span>
      </div>
    );
  }

  // Draft — show initial
  return (
    <div className="flex h-full w-full items-center justify-center bg-[color:var(--surface-2)]">
      <div className="text-3xl font-semibold text-[color:var(--label-3)]">
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
      {/* One screen, one primary action. The accent is spent here and
          nowhere else on this page. */}
      <section className="ios-card relative mb-5 overflow-hidden p-5 sm:p-7">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="ios-title max-w-xl sm:text-[38px]">What are we building today?</h1>
            <p className="ios-body mt-2 max-w-lg">
              Start with one idea. Sitecraft handles the structure, design, and business tools around it.
            </p>
            {/* Credits used to sit in an amber pill on a row of their own,
                floating right with nothing to attach to. */}
            <p className="ios-footnote mt-3 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              <span>
                <span className="tabular-nums">{credits >= 999999 ? '\u221e' : credits}</span> credits
              </span>
              {plan !== 'free' && <span className="ml-1">· {plan === 'pro' ? 'Pro' : 'Beta Pro'}</span>}
            </p>
          </div>

          <button
            onClick={createAndOpenProject}
            disabled={creating}
            className="ios-btn ios-btn-primary w-full shrink-0 disabled:opacity-70 sm:w-auto"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create a website
          </button>
        </div>
      </section>

      {/* Grouped rows, the way iOS stacks secondary destinations. */}
      <div className="ios-group mb-7">
        <Link href="/cards" className="flex min-h-[54px] items-center gap-3 px-4 text-[15px] font-medium text-[color:var(--label)] transition active:bg-white/[0.04]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[color:var(--surface-3)] text-[color:var(--label-2)]"><CreditCard className="h-4 w-4" /></span>
          <span className="flex-1 truncate">Business cards</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--label-3)]" />
        </Link>
        <Link href="/academy" className="flex min-h-[54px] items-center gap-3 px-4 text-[15px] font-medium text-[color:var(--label)] transition active:bg-white/[0.04]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[color:var(--surface-3)] text-[color:var(--label-2)]"><GraduationCap className="h-4 w-4" /></span>
          <span className="flex-1 truncate">Academy</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--label-3)]" />
        </Link>
      </div>

      <div className="mb-3.5 flex items-end justify-between">
        <h2 className="ios-title-2">Recent websites</h2>
        <span className="ios-footnote">{projects.length} total</span>
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
                className="group min-w-[84vw] snap-center overflow-hidden rounded-[18px] transition active:scale-[0.985] sm:min-w-0 sm:hover:-translate-y-1"
                style={{
                  background: 'var(--surface-1)',
                  border: isProjectGenerating
                    ? '1px solid var(--accent)'
                    : '1px solid var(--hairline)',
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
                  <p className="ios-footnote mt-1 truncate">
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
