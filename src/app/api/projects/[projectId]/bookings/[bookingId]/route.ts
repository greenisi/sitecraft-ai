import { NextRequest, NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; bookingId: string }> }
) {
  try {
    const { projectId, bookingId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const body = await request.json();
    const { status } = body;

    const { data: booking, error: updateError } = await supabase!
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
