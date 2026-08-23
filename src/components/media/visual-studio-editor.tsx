'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Check,
  ChevronDown,
  CircleAlert,
  Film,
  History,
  Loader2,
  MessageSquareText,
  Play,
  Plus,
  Sparkles,
  Upload,
} from 'lucide-react';

type Brief = {
  instruction?: string;
  goal?: string;
  audience?: string;
  platform?: string;
  tone?: string;
  length?: string;
  mustKeep?: string;
  brandStyle?: string;
  sensitiveContent?: string;
};

type Question = {
  id: keyof Brief;
  prompt: string;
  help: string;
  options: string[];
};

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  availability: 'foundation' | 'renderer';
  reason: string;
};

type Plan = {
  headline: string;
  summary: string;
  estimatedLength: string;
  outputFormat: string;
  assumptions: string[];
  sequence: Array<{ label: string; purpose: string }>;
  capabilityBoundary: string;
};

type PlanningResult = {
  brief: Brief;
  assumptions: string[];
  confidence: number;
  questions: Question[];
  checklist: ChecklistItem[];
  plan: Plan;
  assistantMessage: string;
};

type AssetRelation = { public_url?: string; file_type?: string } | Array<{ public_url?: string; file_type?: string }> | null;

type Clip = {
  id: string;
  asset_id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number | null;
  duration_ms: number | null;
  width: number | null;
  height: number | null;
  sort_order: number;
  assets?: AssetRelation;
};

type LibraryVideo = {
  id: string;
  file_name: string;
  file_type: string;
  public_url: string;
  size_bytes: number | null;
};

type PlanVersion = {
  id: string;
  version_number: number;
  brief: Brief;
  checklist: ChecklistItem[];
  plan: Plan;
  change_summary: string;
  approved_at: string | null;
  created_at: string;
};

type StudioSession = {
  id: string;
  status: string;
  brief: Brief;
  assumptions: string[];
  current_plan_version: number | null;
};

type StudioPayload = {
  session: StudioSession | null;
  clips?: Clip[];
  versions?: PlanVersion[];
  currentPlan?: PlanVersion | null;
  latestAnalysis?: PlanningResult | null;
  libraryVideos: LibraryVideo[];
};

function clipUrl(clip: Clip) {
  const relation = clip.assets;
  if (Array.isArray(relation)) return relation[0]?.public_url || '';
  return relation?.public_url || '';
}

function formatDuration(durationMs: number | null) {
  if (!durationMs) return 'Length not read';
  const seconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}:${String(seconds % 60).padStart(2, '0')}` : `${seconds}s`;
}

function readVideoMetadata(file: File) {
  return new Promise<{ durationMs: number | null; width: number | null; height: number | null }>((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    const finish = (value: { durationMs: number | null; width: number | null; height: number | null }) => {
      URL.revokeObjectURL(url);
      video.remove();
      resolve(value);
    };
    video.preload = 'metadata';
    video.onloadedmetadata = () => finish({
      durationMs: Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : null,
      width: video.videoWidth || null,
      height: video.videoHeight || null,
    });
    video.onerror = () => finish({ durationMs: null, width: null, height: null });
    video.src = url;
  });
}

export function VisualStudioEditor({ projectId }: { projectId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<StudioPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<Brief>({});
  const [analysis, setAnalysis] = useState<PlanningResult | null>(null);
  const [revision, setRevision] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/visual-studio`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load Visual Studio');
      setData(payload);
      if (payload.session?.brief) setBrief(payload.session.brief);
      if (!payload.currentPlan && payload.latestAnalysis) {
        setAnalysis(payload.latestAnalysis);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load Visual Studio');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function api(action: string, body: Record<string, unknown> = {}) {
    const response = await fetch(`/api/projects/${projectId}/visual-studio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Visual Studio request failed');
    return payload;
  }

  async function ensureSession() {
    if (data?.session) return data.session;
    const payload = await api('create_session');
    const session = payload.session as StudioSession;
    setData((current) => ({
      session,
      clips: [],
      versions: [],
      currentPlan: null,
      libraryVideos: current?.libraryVideos || [],
    }));
    return session;
  }

  async function uploadFiles(files: FileList | File[]) {
    const videos = Array.from(files).filter((file) => file.type.startsWith('video/'));
    if (!videos.length) {
      setError('Choose one or more video clips.');
      return;
    }
    setBusy('upload');
    setError(null);
    try {
      const session = await ensureSession();
      for (let index = 0; index < videos.length; index += 1) {
        const file = videos[index];
        setUploadStatus(`Uploading ${index + 1} of ${videos.length}: ${file.name}`);
        const metadata = await readVideoMetadata(file);
        const prepared = await api('prepare_upload', {
          sessionId: session.id,
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });
        const { error: uploadError } = await supabase.storage
          .from('project-assets')
          .uploadToSignedUrl(prepared.path, prepared.token, file, {
            contentType: file.type,
          });
        if (uploadError) throw uploadError;
        await api('complete_upload', {
          sessionId: session.id,
          path: prepared.path,
          originalName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          ...metadata,
        });
      }
      setUploadStatus(null);
      await load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
    } finally {
      setBusy(null);
      setUploadStatus(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function addLibraryVideo(assetId: string) {
    const session = await ensureSession();
    setBusy(`library-${assetId}`);
    setError(null);
    try {
      await api('add_library_asset', { sessionId: session.id, assetId });
      await load();
    } catch (libraryError) {
      setError(libraryError instanceof Error ? libraryError.message : 'Could not add video');
    } finally {
      setBusy(null);
    }
  }

  async function analyzeFootage() {
    if (!data?.session) return;
    setBusy('analyze');
    setError(null);
    try {
      const payload = await api('analyze', { sessionId: data.session.id, brief });
      setAnalysis(payload.result);
      setBrief(payload.result.brief);
      await load();
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Analysis failed');
    } finally {
      setBusy(null);
    }
  }

  async function createPlan() {
    if (!data?.session) return;
    setBusy('plan');
    setError(null);
    try {
      await api('create_plan', { sessionId: data.session.id, brief });
      setAnalysis(null);
      await load();
    } catch (planError) {
      setError(planError instanceof Error ? planError.message : 'Could not make plan');
    } finally {
      setBusy(null);
    }
  }

  async function revisePlan() {
    if (!data?.session || !revision.trim()) return;
    setBusy('revise');
    setError(null);
    try {
      await api('revise_plan', {
        sessionId: data.session.id,
        instruction: revision.trim(),
      });
      setRevision('');
      await load();
    } catch (revisionError) {
      setError(revisionError instanceof Error ? revisionError.message : 'Could not revise plan');
    } finally {
      setBusy(null);
    }
  }

  async function updateChecklist(checklist: ChecklistItem[]) {
    if (!data?.session) return;
    setBusy('checklist');
    setError(null);
    try {
      await api('update_checklist', { sessionId: data.session.id, checklist });
      await load();
    } catch (checklistError) {
      setError(checklistError instanceof Error ? checklistError.message : 'Could not save options');
    } finally {
      setBusy(null);
    }
  }

  async function restoreVersion(versionNumber: number) {
    if (!data?.session) return;
    setBusy(`restore-${versionNumber}`);
    setError(null);
    try {
      await api('restore_version', { sessionId: data.session.id, versionNumber });
      await load();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Could not restore version');
    } finally {
      setBusy(null);
    }
  }

  async function approvePlan() {
    if (!data?.session) return;
    setBusy('approve');
    setError(null);
    try {
      await api('approve_plan', { sessionId: data.session.id });
      await load();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Could not approve plan');
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-8 text-sm text-gray-400">Opening Visual Studio…</div>;
  }

  const clips = data?.clips || [];
  const currentPlan = data?.currentPlan || null;
  const versions = data?.versions || [];
  const questions = analysis?.questions || [];
  const questionAnswersReady = questions.every((question) => Boolean(brief[question.id]));
  const approved = Boolean(currentPlan?.approved_at) || data?.session?.status === 'rendering_unavailable';
  const activeStep = currentPlan ? 3 : analysis ? 2 : 1;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-purple-900/50 bg-gradient-to-br from-purple-950/35 via-gray-950 to-gray-950 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">AI Visual Studio</span>
            </div>
            <h2 className="mt-2 text-xl font-semibold text-white">Turn raw phone clips into polished business content</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-400">
              Make a testimonial, promo, ad, or social post. Answer only what the AI cannot infer, then approve the plan before anything renders.
            </p>
          </div>
          <div className="flex items-center gap-2" aria-label={`Step ${activeStep} of 3`}>
            {['Footage', 'Brief', 'Plan'].map((label, index) => {
              const number = index + 1;
              const complete = number < activeStep;
              const active = number === activeStep;
              return (
                <div key={label} className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  complete ? 'bg-emerald-500/15 text-emerald-300'
                    : active ? 'bg-purple-500 text-white'
                      : 'bg-gray-900 text-gray-500'
                }`}>
                  {complete ? '✓' : number} {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-200">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!currentPlan && !analysis && (
        <section className="space-y-5 rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
          <div>
            <h3 className="text-lg font-semibold text-white">1. Add your footage</h3>
            <p className="mt-1 text-sm text-gray-400">Choose one clip or many. We will keep them together in this project.</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(event) => event.target.files && uploadFiles(event.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy === 'upload'}
            className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-800/70 bg-purple-950/20 px-6 text-center transition hover:border-purple-500 hover:bg-purple-950/35 disabled:opacity-60"
          >
            {busy === 'upload' ? <Loader2 className="h-8 w-8 animate-spin text-purple-300" /> : <Upload className="h-8 w-8 text-purple-300" />}
            <span className="mt-3 font-semibold text-white">{busy === 'upload' ? 'Uploading your clips…' : 'Choose video clips'}</span>
            <span className="mt-1 text-xs text-gray-500">{uploadStatus || 'MP4, MOV, WebM, or another browser-supported video format'}</span>
          </button>

          {clips.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clips.map((clip) => (
                <div key={clip.id} className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
                  {clipUrl(clip) ? (
                    <video src={clipUrl(clip)} preload="metadata" className="aspect-video w-full bg-black object-cover" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-gray-900"><Film className="h-7 w-7 text-gray-600" /></div>
                  )}
                  <div className="p-3">
                    <div className="truncate text-sm font-medium text-gray-200">{clip.original_name}</div>
                    <div className="mt-1 text-xs text-gray-500">{formatDuration(clip.duration_ms)}{clip.width && clip.height ? ` · ${clip.width}×${clip.height}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data?.libraryVideos.length ? (
            <div>
              <button
                type="button"
                onClick={() => setShowLibrary((value) => !value)}
                className="inline-flex items-center gap-2 text-sm font-medium text-purple-300 hover:text-purple-200"
              >
                <Plus className="h-4 w-4" /> Use a video already in this project
                <ChevronDown className={`h-4 w-4 transition ${showLibrary ? 'rotate-180' : ''}`} />
              </button>
              {showLibrary && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {data.libraryVideos.map((asset) => {
                    const alreadyAdded = clips.some((clip) => clip.asset_id === asset.id);
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => addLibraryVideo(asset.id)}
                        disabled={alreadyAdded || busy === `library-${asset.id}`}
                        className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-950 p-3 text-left hover:border-purple-700 disabled:opacity-50"
                      >
                        <Play className="h-5 w-5 shrink-0 text-purple-300" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-gray-200">{asset.file_name}</span>
                          <span className="text-xs text-gray-500">{alreadyAdded ? 'Already selected' : 'Add to this edit'}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {clips.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
              <label htmlFor="visual-instruction" className="text-sm font-semibold text-white">
                Know what you want? Tell the AI in one sentence.
              </label>
              <textarea
                id="visual-instruction"
                value={brief.instruction || ''}
                onChange={(event) => setBrief((current) => ({ ...current, instruction: event.target.value }))}
                rows={3}
                placeholder="Example: Make a fast 30-second Instagram reel with captions and keep the customer reaction."
                className="mt-2 w-full resize-none rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
              />
              <p className="mt-2 text-xs leading-5 text-gray-500">
                First-phase analysis reads clip names, length, and shape. Deep scene detection, transcription, and audio inspection are not enabled yet.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={analyzeFootage}
              disabled={!clips.length || busy === 'analyze'}
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === 'analyze' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Review my footage
            </button>
          </div>
        </section>
      )}

      {analysis && !currentPlan && (
        <section className="space-y-5 rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-purple-500/15 p-2"><MessageSquareText className="h-5 w-5 text-purple-300" /></div>
            <div>
              <h3 className="text-lg font-semibold text-white">2. Confirm the brief</h3>
              <p className="mt-1 text-sm leading-6 text-gray-300">{analysis.assistantMessage}</p>
            </div>
          </div>

          {analysis.assumptions.length > 0 && (
            <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-4">
              <div className="text-sm font-semibold text-blue-200">What I inferred</div>
              <ul className="mt-2 space-y-1 text-sm text-blue-100/75">
                {analysis.assumptions.map((assumption) => <li key={assumption}>• {assumption}</li>)}
              </ul>
            </div>
          )}

          {questions.map((question) => (
            <div key={question.id} className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
              <div className="text-sm font-semibold text-white">{question.prompt}</div>
              <div className="mt-1 text-xs text-gray-500">{question.help}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {question.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setBrief((current) => ({ ...current, [question.id]: option }))}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                      brief[question.id] === option
                        ? 'border-purple-400 bg-purple-500 text-white'
                        : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-purple-600'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="grid gap-3 rounded-xl border border-gray-800 bg-gray-950/70 p-4 sm:grid-cols-2">
            <BriefLine label="Goal" value={brief.goal || brief.instruction || 'Use the strongest story'} />
            <BriefLine label="Platform" value={brief.platform || 'Best fit from the footage'} />
            <BriefLine label="Tone" value={brief.tone || 'Clear and natural'} />
            <BriefLine label="Length" value={brief.length || 'AI recommended'} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => setAnalysis(null)} className="text-sm text-gray-400 hover:text-white">
              Back to footage
            </button>
            <button
              type="button"
              onClick={createPlan}
              disabled={!questionAnswersReady || busy === 'plan'}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
            >
              {busy === 'plan' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirm brief and make my plan
            </button>
          </div>
        </section>
      )}

      {currentPlan && (
        <section className="space-y-5 rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">Plan preview · Version {currentPlan.version_number}</div>
              <h3 className="mt-2 text-xl font-semibold text-white">{currentPlan.plan.headline}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">{currentPlan.plan.summary}</p>
            </div>
            {approved && <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300">Approved</span>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <BriefLine label="Planned length" value={currentPlan.plan.estimatedLength} />
            <BriefLine label="Output" value={currentPlan.plan.outputFormat} />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">What the AI will change</h4>
            <div className="mt-3 grid gap-2">
              {currentPlan.checklist.filter((item) => item.enabled).map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-200">{item.label}</div>
                    <div className="mt-0.5 text-xs leading-5 text-gray-500">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentPlan.plan.sequence.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white">Story order</h4>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {currentPlan.plan.sequence.map((scene) => (
                  <div key={scene.label} className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                    <div className="text-sm font-medium text-gray-200">{scene.label}</div>
                    <div className="mt-1 text-xs leading-5 text-gray-500">{scene.purpose}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100/80">
            <strong className="text-amber-200">Preview boundary:</strong> {currentPlan.plan.capabilityBoundary}
          </div>

          <details className="rounded-xl border border-gray-800 bg-gray-950/60">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-200">
              Advanced edit checklist
              <span className="ml-2 text-xs font-normal text-gray-500">Optional</span>
            </summary>
            <div className="space-y-3 border-t border-gray-800 p-4">
              {currentPlan.checklist.map((item) => (
                <label key={item.id} className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    disabled={busy === 'checklist'}
                    onChange={(event) => updateChecklist(currentPlan.checklist.map((candidate) => (
                      candidate.id === item.id ? { ...candidate, enabled: event.target.checked } : candidate
                    )))}
                    className="mt-1 h-4 w-4 accent-purple-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-200">{item.label}</span>
                    <span className="block text-xs leading-5 text-gray-500">{item.reason}</span>
                    {item.availability === 'renderer' && (
                      <span className="mt-1 inline-block rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">Runs when rendering is enabled</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </details>

          <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
            <label htmlFor="visual-revision" className="text-sm font-semibold text-white">Want a change? Just say it.</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="visual-revision"
                value={revision}
                onChange={(event) => setRevision(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    revisePlan();
                  }
                }}
                placeholder="Make it shorter and add branded titles."
                className="min-w-0 flex-1 rounded-full border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={revisePlan}
                disabled={!revision.trim() || busy === 'revise'}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-purple-700 bg-purple-950/40 px-5 py-2.5 text-sm font-semibold text-purple-200 hover:bg-purple-900/50 disabled:opacity-50"
              >
                {busy === 'revise' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />}
                Update plan
              </button>
            </div>
          </div>

          {versions.length > 1 && (
            <details className="rounded-xl border border-gray-800 bg-gray-950/60">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-200">
                <History className="h-4 w-4" /> Version history
              </summary>
              <div className="space-y-2 border-t border-gray-800 p-4">
                {versions.map((version) => (
                  <div key={version.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 p-3">
                    <div>
                      <div className="text-sm text-gray-200">Version {version.version_number}</div>
                      <div className="text-xs text-gray-500">{version.change_summary}</div>
                    </div>
                    {version.version_number === currentPlan.version_number ? (
                      <span className="text-xs text-purple-300">Current</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => restoreVersion(version.version_number)}
                        disabled={busy === `restore-${version.version_number}`}
                        className="text-xs font-medium text-purple-300 hover:text-purple-200"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

          {!approved ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={approvePlan}
                disabled={busy === 'approve'}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {busy === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve this edit plan
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 text-sm leading-6 text-emerald-100/80">
              <strong className="text-emerald-200">Plan saved.</strong> Rendering is deliberately unavailable in this foundation, so no credits or external render jobs were started.
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function BriefLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-gray-200">{value}</div>
    </div>
  );
}
