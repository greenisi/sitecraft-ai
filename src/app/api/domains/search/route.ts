import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { searchDomains } from '@/lib/domains/namecom';
import { formatErrorResponse } from '@/lib/utils/errors';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'AUTH_ERROR' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: { message: 'Search query must be at least 2 characters', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const results = await searchDomains(query);

    // Filter to only purchasable domains and format prices
    const available = results
      .filter((r) => r.purchasable)
      .map((r) => ({
        domain: r.domainName,
        available: true,
        price: r.purchasePrice ? '$' + Number(r.purchasePrice).toFixed(2) : 'N/A',
        premium: r.premium,
      }));

    return NextResponse.json({ results: available });
  } catch (error) {
    const { error: errBody, status } = formatErrorResponse(error);
    return NextResponse.json({ error: errBody }, { status });
  }
}
