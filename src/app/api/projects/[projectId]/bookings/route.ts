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
    const date = url.searchParams.get('date');
    const status = url.searchParams.get('status');

    // Customer data pools across a user's projects only when they opted in;
    // otherwise this is just [projectId] and nothing changes.
    const sharedProjectIds = await getSharedProjectIds(
      supabase!,
      projectId,
      user!.id
    );

    let query = supabase!
      .from('bookings')
      .select('*')
      .in('project_id', sharedProjectIds)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    if (date) query = query.eq('booking_date', date);
    if (status) query = query.eq('status', status);

    const { data: bookings, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
