import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';

/**
 * POST /api/projects/[projectId]/stripe/use-default
 *
 * Reverts this project from "use a different Stripe" back to the user's
 * default Stripe account. The previously-attached project-level Stripe
 * account itself is NOT deleted at Stripe — the merchant still controls it
 * and can reattach to a different project later, or close it from their
 * Stripe dashboard. We only clear the link.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('projects')
    .update({
      stripe_connect_account_id: null,
      stripe_connect_onboarding_complete: false,
      stripe_connect_charges_enabled: false,
    })
    .eq('id', projectId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
