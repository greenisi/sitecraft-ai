import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; assetId: string }> }
) {
  try {
    const { projectId, assetId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const { data: asset, error: fetchError } = await supabase!
      .from('marketing_assets')
      .select('*')
      .eq('id', assetId)
      .eq('project_id', projectId)
      .single();

    if (fetchError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ asset });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string; assetId: string }> }
) {
  try {
    const { projectId, assetId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const body = await request.json();

    const { data: asset, error: updateError } = await supabase!
      .from('marketing_assets')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assetId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ asset });
  } catch {
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; assetId: string }> }
) {
  try {
    const { projectId, assetId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const { error: deleteError } = await supabase!
      .from('marketing_assets')
      .delete()
      .eq('id', assetId)
      .eq('project_id', projectId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
