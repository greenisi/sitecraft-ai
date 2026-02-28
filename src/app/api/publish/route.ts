import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { publishToSubdomain } from '@/lib/export/platform-publisher';
import { formatErrorResponse } from '@/lib/utils/errors';

export const maxDuration = 300; // 5 minutes for deploy + build + domain setup

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'AUTH_ERROR' } },
        { status: 401 }
      );
    }

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: { message: 'Project ID is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, status, slug')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: { message: 'Project not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Must be generated, deployed, or already published to publish
    if (!['generated', 'deployed', 'published'].includes(project.status)) {
      return NextResponse.json(
        {
          error: {
            message: 'Project must be generated before publishing',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    // Publish to subdomain
    const result = await publishToSubdomain(projectId, user.id);

    return NextResponse.json({ data: result });
  } catch (error) {
    const { error: errBody, status } = formatErrorResponse(error);
    return NextResponse.json({ error: errBody }, { status });
  }
}
