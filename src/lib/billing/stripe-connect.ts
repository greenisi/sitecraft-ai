// Helper for resolving the Stripe Connect account that should receive
// payments from a given project.
//
// Architecture note: sitecraft-ai-fresh uses Stripe Connect EXPRESS, with the
// account stored per-USER on `profiles.stripe_connect_account_id`. All of a
// user's projects share their single Stripe account. Onboarding flow lives at
// /api/stripe/connect/onboard (creates the account + returns an account link).

type LooseSupabase = { from: (table: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Look up the Stripe Connect account for the merchant who owns the project.
 *
 * Resolution order:
 *   1. Project's own connected account (if user opted to override per-site)
 *   2. Project owner's profile-level account (the default for most users)
 *
 * Returns null if neither is connected. `source` tells the caller which one
 * answered, so UIs can show "this site uses your default Stripe" vs.
 * "this site has its own Stripe."
 */
export async function getProjectStripeAccount(
  admin: LooseSupabase,
  projectId: string,
): Promise<{ accountId: string; chargesEnabled: boolean; source: 'project' | 'user' } | null> {
  const { data: project } = await admin
    .from('projects')
    .select('user_id, stripe_connect_account_id, stripe_connect_charges_enabled')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) return null;

  // Per-project override wins.
  if (project.stripe_connect_account_id) {
    return {
      accountId: project.stripe_connect_account_id,
      chargesEnabled: Boolean(project.stripe_connect_charges_enabled),
      source: 'project',
    };
  }

  // Fall back to the user's default account on their profile.
  if (!project.user_id) return null;
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_connect_account_id, stripe_connect_charges_enabled')
    .eq('id', project.user_id)
    .maybeSingle();
  if (!profile?.stripe_connect_account_id) return null;
  return {
    accountId: profile.stripe_connect_account_id,
    chargesEnabled: Boolean(profile.stripe_connect_charges_enabled),
    source: 'user',
  };
}
