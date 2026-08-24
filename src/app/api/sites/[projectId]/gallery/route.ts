import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Gallery images for a published site.
 *
 * Read-only and public, but it still needs CORS and its own service-role
 * client for the same reason reviews does: the caller is the owner's site on
 * another origin, sending no cookies. Without the headers the request fails
 * before it gets here, which is why nothing on a generated site was ever
 * showing gallery images the owner had uploaded.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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
      return NextResponse.json({ error: fetchError.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ images: images || [] }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch gallery images' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
