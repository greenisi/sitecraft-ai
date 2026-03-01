import { NextRequest, NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; imageId: string }> }
) {
  try {
    const { projectId, imageId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) updates.title = body.title || null;
    if (body.description !== undefined) updates.description = body.description || null;
    if (body.category !== undefined) updates.category = body.category || null;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

    const { data: image, error: updateError } = await supabase!
      .from('gallery_images')
      .update(updates)
      .eq('id', imageId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ image });
  } catch {
    return NextResponse.json({ error: 'Failed to update gallery image' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; imageId: string }> }
) {
  try {
    const { projectId, imageId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const { error: deleteError } = await supabase!
      .from('gallery_images')
      .delete()
      .eq('id', imageId)
      .eq('project_id', projectId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete gallery image' }, { status: 500 });
  }
}
