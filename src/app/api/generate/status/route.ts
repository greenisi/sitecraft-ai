import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/generate/status?projectId=xxx
 *
 * Lightweight polling endpoint that checks the current generation status
 * for a project. Used by the client to recover when SSE connections drop
 * (common on mobile browsers / flaky networks).
 *
 * Returns:
 *  - project status (draft | generating | generated | error)
 *  - latest generation version status
 *  - whether files were generated
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
