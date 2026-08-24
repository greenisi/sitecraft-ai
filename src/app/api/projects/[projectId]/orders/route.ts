import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSharedProjectIds } from '@/lib/projects/data-group';

export async function GET(
    request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

  if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const url = new URL(request.url);
    const status = url.searchParams.get('status');

  // Customer data pools across a user's projects only when they opted in;
  // otherwise this is just [projectId] and nothing changes.
  const sharedProjectIds = await getSharedProjectIds(
    supabase!,
    projectId,
    user!.id
  );

  let query = supabase
      .from('orders')
      .select('*')
      .in('project_id', sharedProjectIds)
      .order('created_at', { ascending: false });

  if (status) {
        query = query.eq('status', status);
  }

  const { data: orders, error } = await query;

  if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(orders);
}
