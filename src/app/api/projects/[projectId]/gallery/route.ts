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

    const { data: images, error: fetchError } = await supabase!
      .from('gallery_images')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ images: images || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch gallery images' }, { status: 500 });
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
    const { image_url, title, description, category } = body;

    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const { data: lastImage } = await supabase!
      .from('gallery_images')
      .select('sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const { data: image, error: insertError } = await supabase!
      .from('gallery_images')
      .insert({
        project_id: projectId,
        image_url,
        title: title || null,
        description: description || null,
        category: category || null,
        sort_order: (lastImage?.sort_order || 0) + 1,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ image }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create gallery image' }, { status: 500 });
  }
}
