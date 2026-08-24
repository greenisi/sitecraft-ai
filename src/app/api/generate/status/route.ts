import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';

/**
 * GET /api/generate/status?projectId=xxx
 *
 * Lightweight polling endpoint that checks the current generation status
 * for a project. Used by the client to recover when SSE connections drop
 * (common on mobile browsers / flaky networks).
 *
 * Returns:
 * - project status (draft | generating | generated | error)
 * - latest generation version status
 * - whether files were generated
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get projectId from query params
  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json(
      { error: 'Missing projectId parameter' },
      { status: 400 }
    );
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, user_id, status, last_generated_at')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get latest generation version
  const { data: latestVersion } = await supabase
    .from('generation_versions')
    .select('id, version_number, status, generation_time_ms, completed_at, created_at')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Check if files exist for the latest version
  let fileCount = 0;
  if (latestVersion) {
    const { count } = await supabase
      .from('generated_files')
      .select('id', { count: 'exact', head: true })
      .eq('version_id', latestVersion.id);
    fileCount = count ?? 0;
  }

  // ── Auto-recovery for stuck generations ─────────────────────────────
  // The generation route can run for up to 800 seconds on Fluid Compute. If
  // the function is killed after that window, its post-pipeline cleanup never
  // runs and both records remain stuck in "generating". Allow the full route
  // window plus a small propagation buffer before recovering it.
  if (latestVersion && latestVersion.status === 'generating') {
    const createdAt = new Date(latestVersion.created_at).getTime();
    const now = Date.now();
    const staleThreshold = 14 * 60 * 1000;

    if (now - createdAt > staleThreshold) {
      if (fileCount > 0) {
        // Files were generated before timeout — mark as complete
        await supabase
          .from('generation_versions')
          .update({
            status: 'complete',
            generation_time_ms: now - createdAt,
            completed_at: new Date().toISOString(),
          })
          .eq('id', latestVersion.id);

        await supabase
          .from('projects')
          .update({
            status: 'generated',
            last_generated_at: new Date().toISOString(),
          })
          .eq('id', projectId);

        latestVersion.status = 'complete';
        latestVersion.completed_at = new Date().toISOString();
        latestVersion.generation_time_ms = now - createdAt;
        project.status = 'generated';
        project.last_generated_at = new Date().toISOString();
      } else {
        // No files at all — generation failed before producing anything
        await supabase
          .from('generation_versions')
          .update({
            status: 'error',
            generation_time_ms: now - createdAt,
            completed_at: new Date().toISOString(),
          })
          .eq('id', latestVersion.id);

        await supabase
          .from('projects')
          .update({ status: 'error' })
          .eq('id', projectId);

        latestVersion.status = 'error';
        latestVersion.completed_at = new Date().toISOString();
        latestVersion.generation_time_ms = now - createdAt;
        project.status = 'error';
      }
    }
  }

  // The latest version is authoritative while a generation is active. Repair
  // a stale project row so polling can never mistake an older successful
  // version for completion of the current run.
  if (
    latestVersion &&
    latestVersion.status === 'generating' &&
    project.status !== 'generating'
  ) {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'generating' })
      .eq('id', projectId);

    if (!error) project.status = 'generating';
  }

  // ── Auto-recovery for stuck project status ─────────────────────────
  // If the version completed but the project is still 'generating', fix it.
  if (
    latestVersion &&
    latestVersion.status === 'complete' &&
    project.status === 'generating' &&
    fileCount > 0
  ) {
    const { error } = await supabase
      .from('projects')
      .update({
        status: 'generated',
        last_generated_at: latestVersion.completed_at || new Date().toISOString(),
      })
      .eq('id', projectId);

    if (!error) {
      project.status = 'generated';
      project.last_generated_at = latestVersion.completed_at || new Date().toISOString();
    }
  }

  return NextResponse.json({
    projectStatus: project.status,
    lastGeneratedAt: project.last_generated_at,
    latestVersion: latestVersion
      ? {
          id: latestVersion.id,
          versionNumber: latestVersion.version_number,
          status: latestVersion.status,
          generationTimeMs: latestVersion.generation_time_ms,
          completedAt: latestVersion.completed_at,
          createdAt: latestVersion.created_at,
        }
      : null,
    fileCount,
  });
}
