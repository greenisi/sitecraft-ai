import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { getPlaceDetails } from '@/lib/googlePlaces';
import { syncGoogleReviewsForProject } from '@/lib/googleReviewsSync';

/**
 * Manual refresh. Rate-limited to once per hour per project.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const { data: conn } = await supabase!
      .from('google_places_connections')
      .select('place_id, last_synced_at')
      .eq('project_id', projectId)
      .single();

    if (!conn) {
      return NextResponse.json({ error: 'no connection' }, { status: 404 });
    }

    const lastSync = conn.last_synced_at ? new Date(conn.last_synced_at).getTime() : 0;
    if (Date.now() - lastSync < 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Already refreshed recently. Try again later.' },
        { status: 429 }
      );
    }

    const details = await getPlaceDetails(conn.place_id);
    const result = await syncGoogleReviewsForProject(supabase!, projectId, details);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'refresh failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
