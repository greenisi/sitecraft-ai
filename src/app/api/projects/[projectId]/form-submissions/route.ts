import { NextRequest, NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { getSharedProjectIds } from '@/lib/projects/data-group';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase, user } = await requireProjectOwner(projectId);
    if (error) return error;

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    // Customer data pools across a user's projects only when they opted in;
    // otherwise this is just [projectId] and nothing changes.
    const sharedProjectIds = await getSharedProjectIds(
      supabase!,
      projectId,
      user!.id
    );

    let query = supabase!
      .from('form_submissions')
      .select('*')
      .in('project_id', sharedProjectIds)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: submissions, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ submissions: submissions || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
