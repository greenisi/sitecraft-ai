import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { getPlaceDetails } from '@/lib/googlePlaces';
import { syncGoogleReviewsForProject } from '@/lib/googleReviewsSync';

/**
 * Connect a Google place to this project and import reviews.
 * Body: { place_id: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const place_id = String(body.place_id ?? '').trim();
    if (!place_id) {
      return NextResponse.json({ error: 'place_id required' }, { status: 400 });
    }

    const details = await getPlaceDetails(place_id);
    const result = await syncGoogleReviewsForProject(supabase!, projectId, details);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'connect failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    // Delete the connection and any reviews sourced from Google
    await supabase!.from('google_places_connections').delete().eq('project_id', projectId);
    await supabase!.from('reviews').delete().eq('project_id', projectId).eq('source', 'google');

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'disconnect failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
