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

    const url = new URL(request.url);
    const assetType = url.searchParams.get('type');
    const platform = url.searchParams.get('platform');
    const status = url.searchParams.get('status');

    let query = supabase!
      .from('marketing_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (assetType) query = query.eq('asset_type', assetType);
    if (platform) query = query.eq('platform', platform);
    if (status) query = query.eq('status', status);

    const { data: assets, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ assets: assets || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch marketing assets' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const body = await request.json();
    const { asset_type, platform, title, content, metadata, status: assetStatus } = body;

    if (!asset_type || !content) {
      return NextResponse.json({ error: 'asset_type and content are required' }, { status: 400 });
    }

    const { data: asset, error: insertError } = await supabase!
      .from('marketing_assets')
      .insert({
        project_id: projectId,
        asset_type,
        platform: platform || null,
        title: title || null,
        content,
        metadata: metadata || {},
        status: assetStatus || 'draft',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ asset }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create marketing asset' }, { status: 500 });
  }
}
