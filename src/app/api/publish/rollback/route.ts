import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { publishToSubdomain } from '@/lib/export/platform-publisher';
import { formatErrorResponse } from '@/lib/utils/errors';

export const maxDuration = 300;

/**
 * POST /api/publish/rollback  body: { projectId, versionId }
 *
 * Re-runs the publish flow against a SPECIFIC historical generation_version
 * instead of the latest one. Used when a recent generation looks bad and the
 * user wants to revert their live site to a previous working version.
 *
 * The version must belong to this project, be 'complete', and the user must
 * own the project (both enforced in publishToSubdomain's resolver).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'AUTH_ERROR' } },
        { status: 401 }
      );
    }

    const { projectId, versionId } = await request.json();
    if (!projectId || !versionId) {
      return NextResponse.json(
        { error: { message: 'projectId and versionId required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id, status, slug')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();
    if (!project) {
      return NextResponse.json(
        { error: { message: 'Project not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const result = await publishToSubdomain(projectId, user.id, { versionId });
    return NextResponse.json({ data: result });
  } catch (error) {
    const { error: errBody, status } = formatErrorResponse(error);
    return NextResponse.json({ error: errBody }, { status });
  }
}
