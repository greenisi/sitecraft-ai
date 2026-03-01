import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const { data: posts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, featured_image, author, published_at, created_at')
      .eq('project_id', projectId)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ posts: posts || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}
