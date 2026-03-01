import { NextRequest, NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; reviewId: string }> }
) {
  try {
    const { projectId, reviewId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.is_approved !== undefined) updates.is_approved = body.is_approved;
    if (body.is_featured !== undefined) updates.is_featured = body.is_featured;

    const { data: review, error: updateError } = await supabase!
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; reviewId: string }> }
) {
  try {
    const { projectId, reviewId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const { error: deleteError } = await supabase!
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('project_id', projectId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
