import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Property listings for a published site.
 *
 * Published sites call in from their own origin, so this needs CORS, a
 * preflight, and a service-role client rather than the cookie-scoped one a
 * cross-origin visitor never sends cookies to.
 *
 * is_active is the gate on what leaves here and matches the RLS policy that
 * was previously doing the work ("Public read active properties"), so a
 * listing the owner has taken down stays down.
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
    const propertyType = url.searchParams.get('type');
    const status = url.searchParams.get('status');

    let query = supabase
      .from('properties')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (propertyType) {
      query = query.eq('property_type', propertyType);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: properties, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json(properties || [], { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
