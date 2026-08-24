import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Blog posts for a published site.
 *
 * Published sites call in from their own origin, so this needs CORS, a
 * preflight, and a service-role client rather than the cookie-scoped one a
 * cross-origin visitor never sends cookies to.
 *
 * The status filter is the gate on what leaves here, and it matches the RLS
 * policy that was previously doing the work ("Public can view published blog
 * posts"): drafts must never be returned.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: posts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, featured_image, author, published_at, created_at')
      .eq('project_id', projectId)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ posts: posts || [] }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
