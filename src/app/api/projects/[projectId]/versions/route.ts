import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';

/**
 * GET /api/projects/[projectId]/versions
 *
 * Lists this project's generation versions, newest first, with which one
 * is currently published. Feeds the rollback UI: "current is v7, here are
 * v6, v5, v4 — click to roll back."
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', code: 'AUTH_ERROR' } },
      { status: 401 }
    );
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id, published_version_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();
  if (!project) {
    return NextResponse.json(
      { error: { message: 'Project not found', code: 'NOT_FOUND' } },
      { status: 404 }
    );
  }

  const { data: versions } = await supabase
    .from('generation_versions')
    .select('id, version_number, status, created_at')
    .eq('project_id', projectId)
    .eq('status', 'complete')
    .order('version_number', { ascending: false })
    .limit(50);

  return NextResponse.json({
    publishedVersionId: project.published_version_id,
    versions: (versions ?? []).map(v => ({
      ...v,
      isPublished: v.id === project.published_version_id,
    })),
  });
}
