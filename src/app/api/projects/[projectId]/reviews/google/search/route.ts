import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { searchPlace } from '@/lib/googlePlaces';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error } = await requireProjectOwner(projectId);
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const query = String(body.query ?? '').trim();
    const city = String(body.city ?? '').trim();

    if (!query) {
      return NextResponse.json({ error: 'query required' }, { status: 400 });
    }

    const candidates = await searchPlace(query, city || undefined);
    return NextResponse.json({ candidates });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'search failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
