import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    let query = supabase
      .from('gallery_images')
      .select('id, image_url, title, description, category')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: images, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ images: images || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch gallery images' }, { status: 500 });
  }
}
