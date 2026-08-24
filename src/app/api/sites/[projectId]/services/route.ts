import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Services for a published site.
 *
 * Published sites live on their own origin and call back here, so this needs
 * CORS and a preflight the same way bookings, submit-form, reviews and gallery
 * do. Without them the browser blocks the request before it arrives, which is
 * why a generated site could never render the services its owner maintains in
 * the dashboard.
 *
 * Service-role rather than the cookie-scoped client for the same reason: a
 * visitor on another origin sends no cookies, so the old client was only ever
 * working by falling through to anon. The is_active filter below is the gate
 * on what leaves this endpoint.
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

    const { data: services, error } = await supabase
      .from('services')
      .select('id, name, description, price, duration, image_url, features, is_active, sort_order')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json(services || [], { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
