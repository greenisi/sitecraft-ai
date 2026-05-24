import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

/**
 * GET /api/projects/[projectId]/stripe/status
 *
 * Returns:
 *   {
 *     mode: 'project' | 'user' | 'none',
 *     accountId: string | null,
 *     chargesEnabled: boolean,
 *     onboardingComplete: boolean,
 *     dashboardUrl: string | null,
 *     userDefault: { connected, chargesEnabled, accountId } | null  // for "use my default" UX
 *   }
 */
export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id, stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_connect_charges_enabled')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_onboarding_complete')
    .eq('id', user.id)
    .single();

  const userDefault = profile?.stripe_connect_account_id
    ? {
        connected: true,
        accountId: profile.stripe_connect_account_id,
        chargesEnabled: Boolean(profile.stripe_connect_charges_enabled),
        onboardingComplete: Boolean(profile.stripe_connect_onboarding_complete),
      }
    : null;

  // Determine which mode applies right now.
  if (project.stripe_connect_account_id) {
    // Refresh live status from Stripe.
    const stripe = getStripe();
    let chargesEnabled = Boolean(project.stripe_connect_charges_enabled);
    let onboardingComplete = Boolean(project.stripe_connect_onboarding_complete);
    try {
      const account = await stripe.accounts.retrieve(project.stripe_connect_account_id);
      chargesEnabled = Boolean(account.charges_enabled);
      onboardingComplete = Boolean(account.details_submitted);
      if (
        chargesEnabled !== project.stripe_connect_charges_enabled ||
        onboardingComplete !== project.stripe_connect_onboarding_complete
      ) {
        await supabase
          .from('projects')
          .update({
            stripe_connect_charges_enabled: chargesEnabled,
            stripe_connect_onboarding_complete: onboardingComplete,
          })
          .eq('id', projectId);
      }
    } catch (e) {
      console.warn('Failed to retrieve project Stripe account:', e);
    }
    return NextResponse.json({
      mode: 'project',
      accountId: project.stripe_connect_account_id,
      chargesEnabled,
      onboardingComplete,
      dashboardUrl: chargesEnabled
        ? `https://dashboard.stripe.com/${project.stripe_connect_account_id}`
        : null,
      userDefault,
    });
  }

  if (userDefault) {
    return NextResponse.json({
      mode: 'user',
      accountId: userDefault.accountId,
      chargesEnabled: userDefault.chargesEnabled,
      onboardingComplete: userDefault.onboardingComplete,
      dashboardUrl: userDefault.chargesEnabled
        ? `https://dashboard.stripe.com/${userDefault.accountId}`
        : null,
      userDefault,
    });
  }

  return NextResponse.json({
    mode: 'none',
    accountId: null,
    chargesEnabled: false,
    onboardingComplete: false,
    dashboardUrl: null,
    userDefault: null,
  });
}
