import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Products for a published site.
 *
 * Same fix as services: published sites call in from their own origin, so this
 * needs CORS, a preflight, and a service-role client rather than the
 * cookie-scoped one a cross-origin visitor never sends cookies to. Without
 * them a storefront could not read its own catalogue.
 *
 * Returns a bare array, unchanged, because that is what existing callers read.
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
      .from('products')
      .select(
        'id, name, description, price, compare_at_price, images, category, sku, inventory_count, variants, is_active, sort_order'
      )
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: products, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json(products || [], { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
