import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';

// List AI-generated media for the Media Studio (images + videos in assets).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const { data: assets, error: fetchError } = await supabase!
      .from('assets')
      .select('id, file_name, file_type, public_url, size_bytes, created_at')
      .eq('project_id', projectId)
      .in('file_type', ['ai_image', 'ai_video'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ assets: assets || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
