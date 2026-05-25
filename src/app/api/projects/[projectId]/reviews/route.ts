import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const { data: reviews, error: fetchError } = await supabase!
      .from('reviews')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ reviews: reviews || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

/**
 * Manually add a review (owner-only). Used for pasting in reviews from
 * Yelp, Facebook, Angi, HomeAdvisor, or anywhere else the owner has
 * legit social proof we can't pull via an official API.
 *
 * Auto-approved + auto-featured because the owner is the one entering it.
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
    const customer_name = String(body.customer_name ?? '').trim();
    const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 0)));
    const review_text = String(body.review_text ?? '').trim();
    const source = String(body.source ?? 'manual').trim() || 'manual';
    const external_url = body.external_url ? String(body.external_url).trim() : null;

    if (!customer_name || !rating) {
      return NextResponse.json(
        { error: 'customer_name and rating (1-5) required' },
        { status: 400 }
      );
    }

    const { data: review, error: insErr } = await supabase!
      .from('reviews')
      .insert({
        project_id: projectId,
        customer_name,
        rating,
        review_text,
        source,
        external_url,
        is_approved: true,
        is_featured: false,
        posted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    return NextResponse.json({ review });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
