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

    const { data: seoEntries, error: fetchError } = await supabase!
      .from('seo_metadata')
      .select('*')
      .eq('project_id', projectId)
      .order('page_path');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ seo: seoEntries || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch SEO metadata' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase } = await requireProjectOwner(projectId);
    if (error) return error;

    const body = await request.json();
    const { page_path, ...updates } = body;

    if (!page_path) {
      return NextResponse.json({ error: 'page_path is required' }, { status: 400 });
    }

    const { data: entry, error: upsertError } = await supabase!
      .from('seo_metadata')
      .upsert(
        {
          project_id: projectId,
          page_path,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'project_id,page_path' }
      )
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ seo: entry });
  } catch {
    return NextResponse.json({ error: 'Failed to update SEO metadata' }, { status: 500 });
  }
}
