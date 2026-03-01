import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase, project } = await requireProjectOwner(projectId);
    if (error) return error;

    // Get full project details
    const { data: fullProject, error: fetchError } = await supabase!
      .from('projects')
      .select('id, name, slug, status, published_url, business_type, created_at, updated_at')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(fullProject);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}
