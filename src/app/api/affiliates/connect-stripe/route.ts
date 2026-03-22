import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : (null as unknown as ReturnType<typeof createAdminClient>);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, display_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    const stripe = getStripe();
    let accountId = profile?.stripe_connect_account_id;

    // Create a new Express account if one doesn't exist yet
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        metadata: {
          supabase_user_id: user.id,
        },
      });

      accountId = account.id;

      // Save the account ID to the profile
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', user.id);

      if (updateError) {
        console.error('[connect-stripe] Failed to save Connect account ID:', updateError);
        return NextResponse.json({ error: 'Failed to save Connect account' }, { status: 500 });
      }
    }

    // Generate the onboarding link
    const origin = request.headers.get('origin') || 'https://app.innovated.marketing';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/affiliates?connect=refresh`,
      return_url: `${origin}/affiliates?connect=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: unknown) {
    console.error('[connect-stripe] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create Connect account';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
