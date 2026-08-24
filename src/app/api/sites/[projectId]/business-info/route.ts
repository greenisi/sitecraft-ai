import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Business info -- phone, address, hours, socials -- for a published site.
 *
 * Published sites call in from their own origin, so this needs CORS, a
 * preflight, and a service-role client rather than the cookie-scoped one a
 * cross-origin visitor never sends cookies to.
 *
 * WARNING ON `select('*')`: this row is already fully public by policy
 * ("Public can view business info" USING true), so selecting everything is
 * status quo rather than a widening, and it is kept because generated sites
 * read fields directly off the object and an explicit column list would drop
 * whatever was added most recently. The cost is that ANY column added to
 * business_info later becomes public the moment it exists. Anything that is
 * not meant for the site's own footer needs excluding here deliberately.
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

    const { data: business_info, error: fetchError } = await supabase
      .from('business_info')
      .select('*')
      .eq('project_id', projectId)
      .single();

    // PGRST116 is "no rows", which is a normal state for a site whose owner
    // has not filled this in yet, not an error worth failing the page over.
    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json({ error: fetchError.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ business_info: business_info || null }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch business info' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
