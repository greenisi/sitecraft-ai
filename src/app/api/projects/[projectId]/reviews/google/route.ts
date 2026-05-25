import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

/**
 * Returns the current Google connection (if any) for this project + sourced reviews.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const { data: connection } = await supabase!
      .from('google_places_connections')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    const { data: reviews } = await supabase!
      .from('reviews')
      .select('*')
      .eq('project_id', projectId)
      .eq('source', 'google')
      .order('posted_at', { ascending: false });

    return NextResponse.json({ connection, reviews: reviews ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
