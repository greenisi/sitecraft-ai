import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import {
  classifyStripeConnectError,
  getAppOrigin,
} from '@/lib/billing/stripe-connect-errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const origin = getAppOrigin();

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        `${origin}/login?redirect=/projects/${projectId}/payments`,
      );
    }

    const { data: project } = await supabase
      .from('projects')
      .select('stripe_connect_account_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project?.stripe_connect_account_id) {
      return NextResponse.redirect(
        `${origin}/projects/${projectId}/payments?stripe=not_connected`,
      );
    }

    const loginLink = await getStripe().accounts.createLoginLink(
      project.stripe_connect_account_id,
    );
    return NextResponse.redirect(loginLink.url);
  } catch (error) {
    console.error('Project Stripe dashboard link error:', error);
    const classified = classifyStripeConnectError(error);
    const returnUrl = new URL(`/projects/${projectId}/payments`, origin);
    returnUrl.searchParams.set('stripe', 'error');
    returnUrl.searchParams.set('reason', classified.code);
    return NextResponse.redirect(returnUrl);
  }
}
