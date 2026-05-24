import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

/**
 * POST /api/projects/[projectId]/stripe/onboard
 *
 * Creates (or reuses) a per-project Express account distinct from the user's
 * default. For users who run multiple businesses and want each site to settle
 * into a different bank account.
 *
 * Mirrors /api/stripe/connect/onboard but writes to projects.* instead of
 * profiles.*.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id, name, stripe_connect_account_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const stripe = getStripe();
  let accountId = project.stripe_connect_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      // business_profile.name helps the merchant identify the account in their dashboard.
      business_profile: project.name ? { name: project.name } : undefined,
      metadata: {
        user_id: user.id,
        project_id: projectId,
        scope: 'project_override',
      },
    });
    accountId = account.id;
    await supabase
      .from('projects')
      .update({ stripe_connect_account_id: accountId })
      .eq('id', projectId);
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing';
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/projects/${projectId}/payments?stripe=refresh`,
    return_url:  `${origin}/projects/${projectId}/payments?stripe=success`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: accountLink.url });
}
