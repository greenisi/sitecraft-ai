import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : (null as unknown as ReturnType<typeof createAdminClient>);

/**
 * PATCH /api/affiliates/settings
 * Update affiliate payout_method ('free_month' | 'cash')
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { payout_method } = body;

    if (!payout_method || !['free_month', 'cash'].includes(payout_method)) {
      return NextResponse.json(
        { error: 'Invalid payout_method. Must be "free_month" or "cash".' },
        { status: 400 }
      );
    }

    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (affiliateError || !affiliate) {
      return NextResponse.json({ error: 'No affiliate account found' }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('affiliates')
      .update({ payout_method, updated_at: new Date().toISOString() })
      .eq('id', affiliate.id);

    if (updateError) {
      console.error('[affiliate settings] Update failed:', updateError);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, payout_method });
  } catch (error: unknown) {
    console.error('[affiliate settings] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
