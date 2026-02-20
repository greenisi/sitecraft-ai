'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, User, CreditCard, Sparkles, Crown, ExternalLink, Zap } from 'lucide-react';
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
  const [activating, setActivating] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
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

  // Check for payment success/cancel URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast.success('Payment successful!', {
        description: 'Your plan has been updated. It may take a moment to reflect.',
      });
      // Refresh profile data
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
      // Clean URL
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
        description:
          error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleActivateBeta = async () => {
    setActivating(true);
    try {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'beta', generation_credits: 25 })
        .eq('id', currentUser.id);
      if (error) throw error;

      setPlan('beta');
      setCredits(25);
      toast.success('Beta plan activated!', {
        description: 'You now have 25 generation credits to build websites.',
      });
    } catch (error) {
      toast.error('Failed to activate', {
        description:
          error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setActivating(false);
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
        description:
          error instanceof Error ? error.message : 'Unknown error',
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
        description:
          error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/50 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
            <User className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Profile</h2>
            <p className="text-xs text-muted-foreground">
              Your personal information
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">
              Email
            </Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="h-11 rounded-xl bg-muted border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium">
              Display Name
            </Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="h-11 rounded-xl border-border/50"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 rounded-xl"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save changes
          </Button>
        </div>
      </div>

      {/* Plan & Credits Card */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/50 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
            <CreditCard className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Plan & Credits</h2>
            <p className="text-xs text-muted-foreground">
              Your current subscription
            </p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold capitalize">
                  {plan === 'beta' ? 'Beta' : plan}
                </span>
                <span className="text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full uppercase">
                  {plan}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {plan === 'pro'
                  ? 'Unlimited generations available'
                  : plan === 'beta'
                  ? 'Beta access with generation credits'
                  : 'Activate the Beta plan to start building'}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span className="tabular-nums">
                  {plan === 'pro' ? '\u221e' : credits}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                credits remaining
              </p>
            </div>
          </div>

          {/* Free plan — show Beta activation */}
          {plan === 'free' && (
            <Button
              onClick={handleActivateBeta}
              disabled={activating}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
            >
              {activating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Activate Beta Plan — 25 Free Credits
            </Button>
          )}

          {/* Beta plan — show upgrade to Pro */}
          {plan === 'beta' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-semibold">
                    Upgrade to Pro
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Unlimited generations, priority support, and all premium
                  features.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCheckout('pro_monthly')}
                    disabled={checkoutLoading !== null}
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                    size="sm"
                  >
                    {checkoutLoading === 'pro_monthly' ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-3 w-3" />
                    )}
                    $29/mo
                  </Button>
                  <Button
                    onClick={() => handleCheckout('pro_yearly')}
                    disabled={checkoutLoading !== null}
                    variant="outline"
                    className="flex-1 rounded-xl border-violet-500/30"
                    size="sm"
                  >
                    {checkoutLoading === 'pro_yearly' ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-3 w-3" />
                    )}
                    $290/yr
                    <span className="ml-1 text-[10px] text-emerald-500 font-bold">
                      SAVE 17%
                    </span>
                  </Button>
                </div>
              </div>

              {credits <= 5 && (
                <div className="text-center text-xs text-amber-500 font-medium">
                  Running low on credits! Upgrade to Pro for unlimited.
                </div>
              )}
            </div>
          )}

          {/* Pro plan — show manage subscription */}
          {plan === 'pro' && hasStripeCustomer && (
            <Button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              variant="outline"
              className="w-full rounded-xl border-border/50"
            >
              {portalLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Manage Subscription
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
