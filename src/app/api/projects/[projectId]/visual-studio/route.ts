import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  planVisualEdit,
  reviseVisualPlan,
  type ClipSummary,
  type VisualBrief,
  type VisualChecklistItem,
  type VisualPlanningResult,
} from '@/lib/visual-studio/planner';

export const runtime = 'nodejs';
export const maxDuration = 45;

type RouteContext = { params: Promise<{ projectId: string }> };

function safeFileName(name: string) {
  const clean = name
    .normalize('NFKD')
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
  return clean || 'clip.mp4';
}

async function ownedSession(
  supabase: NonNullable<Awaited<ReturnType<typeof requireProjectOwner>>['supabase']>,
  projectId: string,
  sessionId: string,
) {
  const { data } = await supabase
    .from('visual_studio_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('project_id', projectId)
    .single();
  return data;
}

async function loadClips(
  supabase: NonNullable<Awaited<ReturnType<typeof requireProjectOwner>>['supabase']>,
  sessionId: string,
) {
  const { data } = await supabase
    .from('visual_studio_clips')
    .select('id, asset_id, original_name, mime_type, size_bytes, duration_ms, width, height, sort_order, analysis, created_at, assets(public_url, file_type)')
    .eq('session_id', sessionId)
    .order('sort_order');
  return data || [];
}

function clipSummaries(clips: Array<Record<string, unknown>>): ClipSummary[] {
  return clips.map((clip) => ({
    name: String(clip.original_name || 'Untitled clip'),
    durationMs: typeof clip.duration_ms === 'number' ? clip.duration_ms : null,
    width: typeof clip.width === 'number' ? clip.width : null,
    height: typeof clip.height === 'number' ? clip.height : null,
  }));
}

async function nextPlanVersion(
  supabase: NonNullable<Awaited<ReturnType<typeof requireProjectOwner>>['supabase']>,
  sessionId: string,
) {
  const { data } = await supabase
    .from('visual_studio_plan_versions')
    .select('version_number')
    .eq('session_id', sessionId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.version_number || 0) + 1;
}

async function insertPlanVersion({
  supabase,
  sessionId,
  result,
  instruction,
  changeSummary,
  parentVersionId,
  createdBy = 'ai',
}: {
  supabase: NonNullable<Awaited<ReturnType<typeof requireProjectOwner>>['supabase']>;
  sessionId: string;
  result: VisualPlanningResult;
  instruction?: string;
  changeSummary: string;
  parentVersionId?: string | null;
  createdBy?: 'ai' | 'user' | 'system';
}) {
  const versionNumber = await nextPlanVersion(supabase, sessionId);
  const { data: version, error } = await supabase
    .from('visual_studio_plan_versions')
    .insert({
      session_id: sessionId,
      version_number: versionNumber,
      parent_version_id: parentVersionId || null,
      instruction: instruction || null,
      brief: result.brief,
      checklist: result.checklist,
      plan: result.plan,
      change_summary: changeSummary,
      created_by: createdBy,
    })
    .select('*')
    .single();
  if (error || !version) throw new Error(error?.message || 'Could not save the edit plan');

  await supabase
    .from('visual_studio_sessions')
    .update({
      status: 'plan_ready',
      brief: result.brief,
      assumptions: result.assumptions,
      current_plan_version: versionNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  return version;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { projectId } = await params;
  const { error, supabase } = await requireProjectOwner(projectId);
  if (error) return error;

  const { data: session } = await supabase!
    .from('visual_studio_sessions')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: libraryVideos } = await supabase!
    .from('assets')
    .select('id, file_name, file_type, public_url, size_bytes, created_at')
    .eq('project_id', projectId)
    .in('file_type', ['ai_video', 'raw_video', 'video_export'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (!session) {
    return NextResponse.json({ session: null, libraryVideos: libraryVideos || [] });
  }

  const [clips, jobsResult, versionsResult, messagesResult] = await Promise.all([
    loadClips(supabase!, session.id),
    supabase!
      .from('visual_studio_jobs')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase!
      .from('visual_studio_plan_versions')
      .select('*')
      .eq('session_id', session.id)
      .order('version_number', { ascending: false })
      .limit(30),
    supabase!
      .from('visual_studio_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at')
      .limit(100),
  ]);

  const versions = versionsResult.data || [];
  const jobs = jobsResult.data || [];
  const latestAnalysis = jobs.find(
    (job) => job.job_type === 'footage_analysis' && job.status === 'complete',
  )?.result || null;
  return NextResponse.json({
    session,
    clips,
    jobs,
    versions,
    messages: messagesResult.data || [],
    latestAnalysis,
    currentPlan:
      versions.find((version) => version.version_number === session.current_plan_version) || null,
    libraryVideos: libraryVideos || [],
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { projectId } = await params;
  const { error, user, supabase, project } = await requireProjectOwner(projectId);
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const action = String(body.action || '');
  const admin = createAdminClient();

  try {
    if (action === 'create_session') {
      const { data: session, error: insertError } = await supabase!
        .from('visual_studio_sessions')
        .insert({
          project_id: projectId,
          user_id: user!.id,
          title: `${project!.name || 'Project'} video`,
        })
        .select('*')
        .single();
      if (insertError || !session) throw new Error(insertError?.message || 'Could not start an edit');
      return NextResponse.json({ session }, { status: 201 });
    }

    const sessionId = String(body.sessionId || '');
    if (!sessionId) {
      return NextResponse.json({ error: 'Start an edit first' }, { status: 400 });
    }
    const session = await ownedSession(supabase!, projectId, sessionId);
    if (!session) return NextResponse.json({ error: 'Edit not found' }, { status: 404 });

    if (action === 'prepare_upload') {
      const name = safeFileName(String(body.name || 'clip.mp4'));
      const mimeType = String(body.mimeType || '');
      const sizeBytes = Number(body.sizeBytes || 0);
      if (!mimeType.startsWith('video/')) {
        return NextResponse.json({ error: 'Choose video clips only' }, { status: 400 });
      }
      if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > 2 * 1024 ** 3) {
        return NextResponse.json({ error: 'Each clip must be smaller than 2 GB' }, { status: 400 });
      }
      const { count } = await supabase!
        .from('visual_studio_clips')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
      if ((count || 0) >= 20) {
        return NextResponse.json({ error: 'This first version supports up to 20 clips' }, { status: 400 });
      }

      const storagePath = `${projectId}/visual-studio/raw/${crypto.randomUUID()}-${name}`;
      const { data, error: signedError } = await admin.storage
        .from('project-assets')
        .createSignedUploadUrl(storagePath);
      if (signedError || !data) throw new Error(signedError?.message || 'Could not prepare upload');
      return NextResponse.json({
        path: storagePath,
        token: data.token,
      });
    }

    if (action === 'complete_upload') {
      const storagePath = String(body.path || '');
      const expectedPrefix = `${projectId}/visual-studio/raw/`;
      if (!storagePath.startsWith(expectedPrefix)) {
        return NextResponse.json({ error: 'Invalid upload path' }, { status: 400 });
      }
      const fileName = storagePath.split('/').pop() || 'clip.mp4';
      const folder = storagePath.slice(0, storagePath.length - fileName.length - 1);
      const { data: stored } = await admin.storage
        .from('project-assets')
        .list(folder, { search: fileName, limit: 1 });
      if (!stored?.some((item) => item.name === fileName)) {
        return NextResponse.json({ error: 'Upload has not finished yet' }, { status: 409 });
      }

      const { data: { publicUrl } } = admin.storage.from('project-assets').getPublicUrl(storagePath);
      const { data: asset, error: assetError } = await admin
        .from('assets')
        .insert({
          project_id: projectId,
          file_name: String(body.originalName || fileName),
          file_type: 'raw_video',
          storage_path: storagePath,
          public_url: publicUrl,
          size_bytes: Number(body.sizeBytes || 0) || null,
        })
        .select('*')
        .single();
      if (assetError || !asset) throw new Error(assetError?.message || 'Could not save uploaded clip');

      const { count } = await supabase!
        .from('visual_studio_clips')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
      const { data: clip, error: clipError } = await supabase!
        .from('visual_studio_clips')
        .insert({
          session_id: sessionId,
          asset_id: asset.id,
          original_name: String(body.originalName || fileName),
          mime_type: String(body.mimeType || 'video/mp4'),
          size_bytes: Number(body.sizeBytes || 0) || null,
          duration_ms: Number(body.durationMs || 0) || null,
          width: Number(body.width || 0) || null,
          height: Number(body.height || 0) || null,
          sort_order: count || 0,
          analysis: {
            source: 'browser_metadata',
            deepAnalysisAvailable: false,
          },
        })
        .select('*, assets(public_url, file_type)')
        .single();
      if (clipError || !clip) throw new Error(clipError?.message || 'Could not attach clip');

      await supabase!
        .from('visual_studio_sessions')
        .update({ status: 'collecting', updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      return NextResponse.json({ clip }, { status: 201 });
    }

    if (action === 'add_library_asset') {
      const assetId = String(body.assetId || '');
      const { data: asset } = await supabase!
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .eq('project_id', projectId)
        .in('file_type', ['ai_video', 'raw_video', 'video_export'])
        .single();
      if (!asset) return NextResponse.json({ error: 'Video not found in this project' }, { status: 404 });

      const { count } = await supabase!
        .from('visual_studio_clips')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
      const { data: clip, error: clipError } = await supabase!
        .from('visual_studio_clips')
        .upsert({
          session_id: sessionId,
          asset_id: asset.id,
          original_name: asset.file_name,
          mime_type: 'video/mp4',
          size_bytes: asset.size_bytes,
          sort_order: count || 0,
          analysis: { source: 'project_library', deepAnalysisAvailable: false },
        }, { onConflict: 'session_id,asset_id' })
        .select('*, assets(public_url, file_type)')
        .single();
      if (clipError || !clip) throw new Error(clipError?.message || 'Could not add library video');
      return NextResponse.json({ clip });
    }

    if (action === 'analyze') {
      const clips = await loadClips(supabase!, sessionId);
      if (!clips.length) {
        return NextResponse.json({ error: 'Add at least one clip first' }, { status: 400 });
      }
      const brief = (body.brief || {}) as VisualBrief;
      const idempotencyKey = `analysis-${Date.now()}`;
      const { data: job, error: jobError } = await supabase!
        .from('visual_studio_jobs')
        .insert({
          session_id: sessionId,
          job_type: 'footage_analysis',
          status: 'running',
          progress: 20,
          stage: 'Reading clip details',
          input: { brief, clipCount: clips.length },
          attempts: 1,
          idempotency_key: idempotencyKey,
          started_at: new Date().toISOString(),
          heartbeat_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (jobError || !job) throw new Error(jobError?.message || 'Could not start analysis');

      await supabase!
        .from('visual_studio_sessions')
        .update({ status: 'analyzing', updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      try {
        const result = await planVisualEdit(
          clipSummaries(clips as Array<Record<string, unknown>>),
          brief,
        );
        await supabase!
          .from('visual_studio_jobs')
          .update({
            status: 'complete',
            progress: 100,
            stage: 'Brief ready',
            result,
            completed_at: new Date().toISOString(),
            heartbeat_at: new Date().toISOString(),
          })
          .eq('id', job.id);
        await supabase!
          .from('visual_studio_sessions')
          .update({
            status: result.questions.length ? 'briefing' : 'plan_ready',
            brief: result.brief,
            assumptions: result.assumptions,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
        await supabase!.from('visual_studio_messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: result.assistantMessage,
          metadata: { questions: result.questions, confidence: result.confidence },
        });
        return NextResponse.json({ job: { ...job, status: 'complete', progress: 100 }, result });
      } catch (analysisError) {
        const message = analysisError instanceof Error ? analysisError.message : 'Analysis failed';
        await supabase!
          .from('visual_studio_jobs')
          .update({
            status: 'error',
            error_message: message,
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id);
        await supabase!
          .from('visual_studio_sessions')
          .update({ status: 'error', updated_at: new Date().toISOString() })
          .eq('id', sessionId);
        throw analysisError;
      }
    }

    if (action === 'create_plan') {
      const clips = await loadClips(supabase!, sessionId);
      if (!clips.length) {
        return NextResponse.json({ error: 'Add at least one clip first' }, { status: 400 });
      }
      const brief = (body.brief || {}) as VisualBrief;
      const result = await planVisualEdit(
        clipSummaries(clips as Array<Record<string, unknown>>),
        brief,
      );
      result.questions = [];
      result.assistantMessage = 'Here is the edit I recommend. Nothing will render until you approve this plan.';
      const version = await insertPlanVersion({
        supabase: supabase!,
        sessionId,
        result,
        instruction: brief.instruction,
        changeSummary: 'Created the first AI-recommended edit plan.',
      });
      if (brief.instruction) {
        await supabase!.from('visual_studio_messages').insert({
          session_id: sessionId,
          role: 'user',
          content: brief.instruction,
        });
      }
      await supabase!.from('visual_studio_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: result.assistantMessage,
        metadata: { planVersion: version.version_number },
      });
      return NextResponse.json({ version, result }, { status: 201 });
    }

    const { data: current } = await supabase!
      .from('visual_studio_plan_versions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('version_number', session.current_plan_version)
      .single();

    if (action === 'revise_plan') {
      if (!current) return NextResponse.json({ error: 'Create a plan first' }, { status: 400 });
      const instruction = String(body.instruction || '').trim();
      if (!instruction) return NextResponse.json({ error: 'Tell us what to change' }, { status: 400 });
      const result = reviseVisualPlan({
        brief: current.brief,
        assumptions: current.plan?.assumptions || [],
        confidence: 1,
        questions: [],
        checklist: current.checklist,
        plan: current.plan,
        assistantMessage: '',
      }, instruction);
      const version = await insertPlanVersion({
        supabase: supabase!,
        sessionId,
        result,
        instruction,
        changeSummary: `Revised from your instruction: ${instruction}`,
        parentVersionId: current.id,
        createdBy: 'user',
      });
      await supabase!.from('visual_studio_messages').insert([
        { session_id: sessionId, role: 'user', content: instruction },
        {
          session_id: sessionId,
          role: 'assistant',
          content: result.assistantMessage,
          metadata: { planVersion: version.version_number },
        },
      ]);
      return NextResponse.json({ version, result }, { status: 201 });
    }

    if (action === 'update_checklist') {
      if (!current) return NextResponse.json({ error: 'Create a plan first' }, { status: 400 });
      const checklist = Array.isArray(body.checklist)
        ? body.checklist as VisualChecklistItem[]
        : null;
      if (!checklist) return NextResponse.json({ error: 'Invalid checklist' }, { status: 400 });
      const result: VisualPlanningResult = {
        brief: current.brief,
        assumptions: current.plan?.assumptions || [],
        confidence: 1,
        questions: [],
        checklist: checklist.map((item) => ({
          ...item,
          enabled: Boolean(item.enabled),
        })),
        plan: current.plan,
        assistantMessage: 'I saved those checklist choices as a new version.',
      };
      const version = await insertPlanVersion({
        supabase: supabase!,
        sessionId,
        result,
        changeSummary: 'Updated the advanced edit checklist.',
        parentVersionId: current.id,
        createdBy: 'user',
      });
      return NextResponse.json({ version, result }, { status: 201 });
    }

    if (action === 'restore_version') {
      const versionNumber = Number(body.versionNumber);
      const { data: version } = await supabase!
        .from('visual_studio_plan_versions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('version_number', versionNumber)
        .single();
      if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      await supabase!
        .from('visual_studio_sessions')
        .update({
          current_plan_version: versionNumber,
          status: 'plan_ready',
          brief: version.brief,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
      return NextResponse.json({ version });
    }

    if (action === 'approve_plan') {
      if (!current) return NextResponse.json({ error: 'Create a plan first' }, { status: 400 });
      const approvedAt = new Date().toISOString();
      await supabase!
        .from('visual_studio_plan_versions')
        .update({ approved_at: approvedAt })
        .eq('id', current.id);
      await supabase!
        .from('visual_studio_sessions')
        .update({
          status: 'rendering_unavailable',
          updated_at: approvedAt,
        })
        .eq('id', sessionId);
      await supabase!.from('visual_studio_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: 'Plan approved and saved. Final rendering is not enabled in this foundation yet.',
        metadata: { planVersion: current.version_number },
      });
      return NextResponse.json({
        approved: true,
        approvedAt,
        message:
          'Your edit plan is approved and saved. Rendering will be enabled in the next processing phase.',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (actionError) {
    const message = actionError instanceof Error ? actionError.message : 'Visual Studio request failed';
    console.error('[Visual Studio]', actionError);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
