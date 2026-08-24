'use client';

import { useEffect, useState } from 'react';
import {
  Loader2, Save, User, CreditCard, Sparkles, Crown,
  ExternalLink, Zap, Coins, ShoppingCart, AlertCircle,
  Link as LinkIcon,
  Wallet,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';
import { toast } from 'sonner';
import { usePageTour } from '@/components/tour/use-page-tour';

export default function SettingsPage() {
  const { user } = useUser();
  usePageTour('settings');

  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState('free');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [stripeConnectLoading, setStripeConnectLoading] = useState(false);
  const [stripeConnect, setStripeConnect] = useState<{
    configured?: boolean;
    connected: boolean;
    chargesEnabled: boolean;
    onboardingComplete: boolean;
    dashboardUrl?: string | null;
    error?: string;
    code?: string;
  } | null>(null);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(
        user.user_metadata?.full_name || user.email?.split('@')[0] || ''
      );
      const supabase = createClient();
      supabase
        .from('profiles')
        .select('generation_credits, plan, stripe_customer_id')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCredits(data.generation_credits);
            setPlan(data.plan);
            setHasStripeCustomer(!!data.stripe_customer_id);
          }
        });
    }
  }, [user]);

  // Fetch Stripe Connect status
  useEffect(() => {
    if (user) {
      fetch('/api/stripe/connect/status')
        .then(async (res) => {
          const data = await res.json();
          setStripeConnect({
            connected: false,
            chargesEnabled: false,
            onboardingComplete: false,
            ...data,
          });
        })
        .catch(() => setStripeConnect({
          configured: true,
          connected: false,
          chargesEnabled: false,
          onboardingComplete: false,
          error: 'Could not check the Stripe connection right now.',
          code: 'status_unavailable',
        }));
    }
  }, [user]);

  // Explain the result when Stripe returns from hosted onboarding.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeResult = params.get('stripe');
    if (!stripeResult) return;

    if (stripeResult === 'success') {
      toast.success('Returned from Stripe', {
        description: 'We are checking whether your payment setup is complete.',
      });
    } else if (stripeResult === 'not_connected') {
      toast.info('Connect Stripe before opening its dashboard.');
    } else if (stripeResult === 'error') {
      const reason = params.get('reason');
      toast.error(
        reason === 'connect_not_configured'
          ? 'Stripe Connect is not available yet'
          : 'Stripe could not complete that request',
        {
          description: reason === 'connect_not_configured'
            ? 'The platform owner needs to finish Stripe Connect setup.'
            : 'Your existing account was not changed. Please try again.',
        },
      );
    }

    params.delete('stripe');
    params.delete('reason');
    const nextUrl = params.toString() ? `/settings?${params.toString()}` : '/settings';
    window.history.replaceState({}, '', nextUrl);
  }, []);

  // Check for payment success/cancel URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast.success('Payment successful!', {
        description: 'Your account has been updated. It may take a moment to reflect.',
      });
      if (user) {
        const supabase = createClient();
        setTimeout(() => {
          supabase
            .from('profiles')
            .select('generation_credits, plan, stripe_customer_id')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setCredits(data.generation_credits);
                setPlan(data.plan);
                setHasStripeCustomer(!!data.stripe_customer_id);
              }
            });
        }, 2000);
      }
      window.history.replaceState({}, '', '/settings');
    } else if (params.get('payment') === 'cancelled') {
      toast.info('Payment cancelled');
      window.history.replaceState({}, '', '/settings');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: displayName },
      });
      if (authError) throw authError;

      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', user.id);
        if (profileError) throw profileError;
      }
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async (priceType: string) => {
    setCheckoutLoading(priceType);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Checkout failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Failed to open billing portal', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setStripeConnectLoading(true);
    try {
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start Stripe Connect');
      if (data.url) window.location.href = data.url;
    } catch (error) {
      toast.error('Stripe Connect failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setStripeConnectLoading(false);
    }
  };

  const isFreePlan = plan === 'free';
  const isBetaPlan = plan === 'beta';
  const isProPlan = plan === 'pro';
  const hasNoCredits = credits <= 0;
  const planName = isBetaPlan ? 'Beta Pro' : isProPlan ? 'Pro' : 'Free';
  const paymentStatus = stripeConnect === null
    ? 'Checking'
    : stripeConnect.configured === false
      ? 'Unavailable'
      : stripeConnect.code === 'connect_account_unavailable'
        ? 'Reconnect needed'
    : stripeConnect.connected && stripeConnect.chargesEnabled
      ? 'Ready'
      : stripeConnect.connected
        ? 'Action needed'
        : 'Not connected';
  const paymentStatusTone = stripeConnect?.configured === false
    ? 'border-rose-400/20 bg-rose-400/10 text-rose-300'
    : stripeConnect?.connected && stripeConnect?.chargesEnabled
    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
    : stripeConnect?.connected
      ? 'border-amber-400/20 bg-amber-400/10 text-amber-300'
      : 'border-white/10 bg-white/[0.04] text-gray-300';

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl py-1 animate-fade-in md:py-2">
      <header className="mb-7 md:mb-9">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300/80">
          Workspace settings
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Settings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400 md:text-base">
              Update your account, review your AI usage, and configure how your websites receive payments.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Account secured by email sign-in
          </div>
        </div>
      </header>

      {/* No credits warning */}
      {hasNoCredits && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400/10">
            <AlertCircle className="h-4 w-4 text-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-200">
              Add credits to keep building
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-400">
              {isFreePlan
                ? 'Subscribe to the Pro plan or purchase a credit pack to start building websites.'
                : 'Purchase a credit pack below or upgrade to Pro for 100 credits/month.'}
            </p>
          </div>
          <a
            href="#plan-and-credits"
            className="hidden items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/10 sm:flex"
          >
            View options
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* At-a-glance account summary */}
      <section
        aria-labelledby="account-overview-heading"
        className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1323]/80 shadow-2xl shadow-black/10 backdrop-blur-sm"
      >
        <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <h2 id="account-overview-heading" className="text-sm font-semibold text-white">
            Account overview
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            The essentials, all in one place
          </p>
        </div>
        <div className="grid sm:grid-cols-3">
          <a
            href="#plan-and-credits"
            className="group flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-5 transition-colors hover:bg-white/[0.025] sm:border-b-0 sm:border-r sm:px-6"
          >
            <div>
              <p className="text-xs font-medium text-gray-500">Current plan</p>
              <p className="mt-1 text-lg font-semibold text-white">{planName}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <Crown className="h-4 w-4" />
            </div>
          </a>
          <a
            href="#plan-and-credits"
            className="group flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-5 transition-colors hover:bg-white/[0.025] sm:border-b-0 sm:border-r sm:px-6"
          >
            <div>
              <p className="text-xs font-medium text-gray-500">AI balance</p>
              <p className="mt-1 text-lg font-semibold text-white">
                <span className="tabular-nums">{credits}</span>{' '}
                <span className="text-sm font-normal text-gray-400">credits</span>
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
              <Sparkles className="h-4 w-4" />
            </div>
          </a>
          <a
            href="#payments"
            className="group flex items-center justify-between gap-4 px-5 py-5 transition-colors hover:bg-white/[0.025] sm:px-6"
          >
            <div>
              <p className="text-xs font-medium text-gray-500">Website payments</p>
              <p className="mt-1 text-lg font-semibold text-white">{paymentStatus}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <Wallet className="h-4 w-4" />
            </div>
          </a>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <nav
            aria-label="Settings sections"
            className="-mx-4 flex gap-2 overflow-x-auto border-y border-white/[0.08] bg-[#0d1323]/70 p-2 px-4 backdrop-blur-sm sm:mx-0 sm:rounded-2xl sm:border lg:flex-col lg:px-2"
          >
            <a
              href="#profile"
              className="group flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white lg:min-w-0"
            >
              <User className="h-4 w-4 text-violet-300" />
              <span className="flex-1">Account</span>
              <ChevronRight className="hidden h-3.5 w-3.5 text-gray-600 transition-transform group-hover:translate-x-0.5 lg:block" />
            </a>
            <a
              href="#plan-and-credits"
              className="group flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white lg:min-w-0"
            >
              <CreditCard className="h-4 w-4 text-amber-300" />
              <span className="flex-1">Plan & usage</span>
              <ChevronRight className="hidden h-3.5 w-3.5 text-gray-600 transition-transform group-hover:translate-x-0.5 lg:block" />
            </a>
            <a
              href="#payments"
              className="group flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white lg:min-w-0"
            >
              <Wallet className="h-4 w-4 text-emerald-300" />
              <span className="flex-1">Payments</span>
              <ChevronRight className="hidden h-3.5 w-3.5 text-gray-600 transition-transform group-hover:translate-x-0.5 lg:block" />
            </a>
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          {/* Profile Card */}
          <section
            id="profile"
            aria-labelledby="profile-heading"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1323]/80 shadow-xl shadow-black/10"
          >
            <div className="flex items-start gap-3 border-b border-white/[0.07] px-5 py-5 sm:px-6">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                <User className="h-4 w-4 text-violet-300" />
              </div>
              <div>
                <h2 id="profile-heading" className="text-base font-semibold text-white">Account details</h2>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Manage the name shown across your workspace.
                </p>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-300">
                    Sign-in email
                  </Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="h-11 rounded-xl border-white/[0.08] bg-white/[0.035] text-gray-400 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                  <p className="text-[11px] leading-4 text-gray-600">
                    This email is used to access your account.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-medium text-gray-300">
                    Display name
                  </Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="h-11 rounded-xl border-white/[0.1] bg-[#090e1a]/80 text-white placeholder:text-gray-600 focus-visible:ring-violet-400/40"
                  />
                  <p className="text-[11px] leading-4 text-gray-600">
                    Shown on your projects and account menus.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end border-t border-white/[0.07] pt-5">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl border-0 bg-violet-600 text-white shadow-lg shadow-violet-950/20 hover:bg-violet-500"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save account
                </Button>
              </div>
            </div>
          </section>

          {/* Plan & Credits Card */}
          <section
            id="plan-and-credits"
            aria-labelledby="plan-heading"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1323]/80 shadow-xl shadow-black/10"
          >
            <div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400/10">
                  <CreditCard className="h-4 w-4 text-amber-300" />
                </div>
                <div>
                  <h2 id="plan-heading" className="text-base font-semibold text-white">Plan & AI usage</h2>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Review your subscription and generation balance.
                  </p>
                </div>
              </div>
              <span className="w-fit rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[11px] font-semibold text-violet-200">
                {planName} plan
              </span>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <Crown className="h-3.5 w-3.5 text-violet-300" />
                    Subscription
                  </div>
                  <p className="mt-3 text-xl font-semibold text-white">{planName}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {isProPlan
                      ? 'Premium features and monthly credits are active.'
                      : isBetaPlan
                        ? 'Early access features are enabled.'
                        : 'Upgrade when you need more projects and credits.'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    Generation balance
                  </div>
                  <p className="mt-3 text-xl font-semibold text-white">
                    <span className="tabular-nums">{credits}</span>{' '}
                    <span className="text-sm font-normal text-gray-400">credits</span>
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Each new AI website build uses generation credits.
                  </p>
                </div>
              </div>

              {/* Free or Beta plan — show Pro upgrade */}
              {!isProPlan && (
                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-xl border border-violet-400/20 bg-violet-400/[0.06] p-4">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-violet-300" />
                      <h3 className="text-sm font-semibold text-white">Upgrade to Pro</h3>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-gray-400">
                      Get 100 credits each month, priority support, and every premium feature.
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      <Button
                        onClick={() => handleCheckout('pro_monthly')}
                        disabled={checkoutLoading !== null}
                        className="rounded-xl border-0 bg-violet-600 text-white hover:bg-violet-500"
                        size="sm"
                      >
                        {checkoutLoading === 'pro_monthly' ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Zap className="mr-2 h-3.5 w-3.5" />
                        )}
                        Monthly · $29
                      </Button>
                      <Button
                        onClick={() => handleCheckout('pro_yearly')}
                        disabled={checkoutLoading !== null}
                        variant="outline"
                        className="rounded-xl border-violet-400/20 bg-transparent text-white hover:bg-violet-400/10 hover:text-white"
                        size="sm"
                      >
                        {checkoutLoading === 'pro_yearly' ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Zap className="mr-2 h-3.5 w-3.5" />
                        )}
                        Yearly · $290
                        <span className="ml-1 text-[9px] font-bold text-emerald-300">SAVE 17%</span>
                      </Button>
                    </div>
                  </div>

                  {/* Credit Packs */}
                  <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.045] p-4">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-amber-300" />
                      <h3 className="text-sm font-semibold text-white">One-time credit packs</h3>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-gray-400">
                      Add credits without changing your current subscription.
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      <Button
                        onClick={() => handleCheckout('credits_10')}
                        disabled={checkoutLoading !== null}
                        variant="outline"
                        className="rounded-xl border-white/10 bg-transparent text-white hover:bg-white/[0.05] hover:text-white"
                        size="sm"
                      >
                        {checkoutLoading === 'credits_10' ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShoppingCart className="mr-2 h-3.5 w-3.5" />
                        )}
                        10 credits · $9
                      </Button>
                      <Button
                        onClick={() => handleCheckout('credits_50')}
                        disabled={checkoutLoading !== null}
                        variant="outline"
                        className="rounded-xl border-amber-400/20 bg-transparent text-white hover:bg-amber-400/10 hover:text-white"
                        size="sm"
                      >
                        {checkoutLoading === 'credits_50' ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShoppingCart className="mr-2 h-3.5 w-3.5" />
                        )}
                        50 credits · $39
                        <span className="ml-1 text-[9px] font-bold text-emerald-300">BEST VALUE</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pro plan — show manage subscription */}
              {isProPlan && hasStripeCustomer && (
                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Subscription billing</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Update your payment method, invoices, or plan in Stripe.
                    </p>
                  </div>
                  <Button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    variant="outline"
                    className="flex-shrink-0 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/[0.05] hover:text-white"
                  >
                    {portalLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    Manage billing
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Stripe Connect - Accept Payments */}
          <section
            id="payments"
            aria-labelledby="payments-heading"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1323]/80 shadow-xl shadow-black/10"
          >
            <div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                  <Wallet className="h-4 w-4 text-emerald-300" />
                </div>
                <div>
                  <h2 id="payments-heading" className="text-base font-semibold text-white">Website payments</h2>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Connect Stripe so customers can pay you from published websites.
                  </p>
                </div>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-[11px] font-semibold ${paymentStatusTone}`}>
                {paymentStatus}
              </span>
            </div>

            <div className="p-5 sm:p-6">
              {stripeConnect === null ? (
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
                  Checking your Stripe connection…
                </div>
              ) : stripeConnect.configured === false ? (
                <div className="flex items-start gap-3 rounded-xl border border-rose-400/15 bg-rose-400/[0.05] p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">Stripe Connect is temporarily unavailable</p>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-400">
                      The payment platform still needs to be activated by the account owner. Your account and any existing Stripe details have not been changed.
                    </p>
                  </div>
                </div>
              ) : stripeConnect.connected && stripeConnect.chargesEnabled ? (
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
                    <div>
                      <p className="text-sm font-semibold text-white">Stripe is ready</p>
                      <p className="mt-1 max-w-xl text-xs leading-5 text-gray-400">
                        Your generated e-commerce websites can accept card payments, and funds go directly to your Stripe account.
                      </p>
                    </div>
                  </div>
                  {stripeConnect.dashboardUrl && (
                    <Button
                      variant="outline"
                      className="flex-shrink-0 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/[0.05] hover:text-white"
                      size="sm"
                      onClick={() => window.open(stripeConnect.dashboardUrl!, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Open Stripe
                    </Button>
                  )}
                </div>
              ) : stripeConnect.connected && !stripeConnect.chargesEnabled ? (
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-300" />
                    <div>
                      <p className="text-sm font-semibold text-white">Finish Stripe setup</p>
                      <p className="mt-1 max-w-xl text-xs leading-5 text-gray-400">
                        Your account is connected, but Stripe still needs a few details before your websites can accept payments.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleConnectStripe}
                    disabled={stripeConnectLoading}
                    className="flex-shrink-0 rounded-xl border-0 bg-emerald-600 text-white hover:bg-emerald-500"
                    size="sm"
                  >
                    {stripeConnectLoading ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LinkIcon className="mr-2 h-3.5 w-3.5" />
                    )}
                    Continue setup
                  </Button>
                </div>
              ) : (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {stripeConnect.code === 'connect_account_unavailable'
                        ? 'Reconnect your Stripe account'
                        : 'Get paid directly from your sites'}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
                      {stripeConnect.code === 'connect_account_unavailable'
                        ? 'The saved Stripe connection no longer belongs to this platform. Starting again creates a fresh connection without deleting the previous Stripe account.'
                        : 'Link a Stripe account once. Eligible generated stores can then send customer payments straight to your connected bank account.'}
                    </p>
                    <Button
                      onClick={handleConnectStripe}
                      disabled={stripeConnectLoading}
                      className="mt-5 rounded-xl border-0 bg-emerald-600 text-white shadow-lg shadow-emerald-950/20 hover:bg-emerald-500"
                    >
                      {stripeConnectLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LinkIcon className="mr-2 h-4 w-4" />
                      )}
                      {stripeConnect.code === 'connect_account_unavailable' ? 'Reconnect Stripe' : 'Connect Stripe'}
                    </Button>
                    <p className="mt-3 text-[11px] leading-4 text-gray-600">
                      You’ll continue securely on Stripe to complete setup.
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] p-4">
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-emerald-300" />
                      <h3 className="text-xs font-semibold text-white">How payments flow</h3>
                    </div>
                    <ol className="mt-4 space-y-3">
                      {[
                        'Connect or create your Stripe account',
                        'Publish a website with checkout enabled',
                        'Customer payments deposit to your bank',
                      ].map((item, index) => (
                        <li key={item} className="flex gap-3 text-xs leading-5 text-gray-400">
                          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] font-semibold text-emerald-300">
                            {index + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
