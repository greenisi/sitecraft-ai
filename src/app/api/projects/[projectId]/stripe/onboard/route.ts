import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import {
  classifyStripeConnectError,
  getAppOrigin,
} from '@/lib/billing/stripe-connect-errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type Project = {
  id: string;
  user_id: string;
  name: string | null;
  stripe_connect_account_id: string | null;
};

async function getRequestContext(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, project: null };
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id, name, stripe_connect_account_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  return {
    supabase,
    user,
    project: (project as Project | null),
  };
}

async function getOrCreateProjectAccount(
  supabase: SupabaseClient,
  user: User,
  project: Project,
) {
  const stripe = getStripe();

  if (project.stripe_connect_account_id) {
    try {
      await stripe.accounts.retrieve(project.stripe_connect_account_id);
      return project.stripe_connect_account_id;
    } catch (error) {
      const classified = classifyStripeConnectError(error);
      if (classified.code !== 'connect_account_unavailable') {
        throw error;
      }
    }
  }

  const account = await stripe.accounts.create({
    type: 'express',
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: project.name ? { name: project.name } : undefined,
    metadata: {
      user_id: user.id,
      project_id: project.id,
      scope: 'project_override',
    },
  });

  const { error: updateError } = await supabase
    .from('projects')
    .update({
      stripe_connect_account_id: account.id,
      stripe_connect_charges_enabled: false,
      stripe_connect_onboarding_complete: false,
    })
    .eq('id', project.id)
    .eq('user_id', user.id);

  if (updateError) {
    console.error('Project Stripe account update failed:', updateError);
    throw new Error('Unable to save the project Stripe connection');
  }

  return account.id;
}

async function createProjectOnboardingLink(projectId: string, accountId: string) {
  const origin = getAppOrigin();
  return getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/api/projects/${projectId}/stripe/onboard`,
    return_url: `${origin}/projects/${projectId}/payments?stripe=success`,
    type: 'account_onboarding',
  });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  try {
    const { supabase, user, project } = await getRequestContext(projectId);
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in again to connect Stripe.', code: 'unauthorized' },
        { status: 401 },
      );
    }
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const accountId = await getOrCreateProjectAccount(supabase, user, project);
    const accountLink = await createProjectOnboardingLink(projectId, accountId);
    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Project Stripe Connect onboard error:', error);
    const classified = classifyStripeConnectError(error);
    return NextResponse.json(
      { error: classified.message, code: classified.code },
      { status: classified.status },
    );
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const origin = getAppOrigin();

  try {
    const { supabase, user, project } = await getRequestContext(projectId);
    if (!user) {
      return NextResponse.redirect(
        `${origin}/login?redirect=/projects/${projectId}/payments`,
      );
    }
    if (!project) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    const accountId = await getOrCreateProjectAccount(supabase, user, project);
    const accountLink = await createProjectOnboardingLink(projectId, accountId);
    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    console.error('Project Stripe Connect refresh error:', error);
    const classified = classifyStripeConnectError(error);
    const returnUrl = new URL(`/projects/${projectId}/payments`, origin);
    returnUrl.searchParams.set('stripe', 'error');
    returnUrl.searchParams.set('reason', classified.code);
    return NextResponse.redirect(returnUrl);
  }
}
