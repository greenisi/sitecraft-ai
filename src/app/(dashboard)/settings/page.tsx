'use client';

import { useEffect, useState } from 'react';
import {
  Loader2, Save, User, CreditCard, Sparkles, Crown,
  ExternalLink, Zap, Coins, ShoppingCart, AlertCircle,
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

  const isFreePlan = plan === 'free';
  const isBetaPlan = plan === 'beta';
  const isProPlan = plan === 'pro';
  const hasNoCredits = credits <= 0;

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

      {/* No credits warning */}
      {hasNoCredits && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              You have no generation credits
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isFreePlan
                ? 'Subscribe to the Pro plan or purchase a credit pack to start building websites.'
                : 'Purchase a credit pack below or upgrade to Pro for 100 credits/month.'}
            </p>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/50 px-4 sm:px-6 py-4">
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
        <div className="p-4 sm:p-6 space-y-4">
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
        <div className="flex items-center gap-3 border-b border-border/50 px-4 sm:px-6 py-4">
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
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
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
                {isProPlan
                  ? `${credits} generation credits remaining`
                  : isFreePlan
                  ? 'Subscribe to a plan to start building'
                  : credits > 0
                  ? `${credits} generation credits remaining`
                  : 'No credits — purchase below to continue'}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <span className="tabular-nums">
                  {credits}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                credits remaining
              </p>
            </div>
          </div>

          {/* Free or Beta plan — show Pro upgrade */}
          {!isProPlan && (
            <div className="space-y-4">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-semibold">
                    Upgrade to Pro
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  100 credits/month, priority support, and all premium features.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
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

              {/* Credit Packs */}
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold">
                    Buy Credit Packs
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Need just a few more generations? Purchase credits individually.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => handleCheckout('credits_10')}
                    disabled={checkoutLoading !== null}
                    variant="outline"
                    className="flex-1 rounded-xl"
                    size="sm"
                  >
                    {checkoutLoading === 'credits_10' ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <ShoppingCart className="mr-2 h-3 w-3" />
                    )}
                    10 Credits — $9
                  </Button>
                  <Button
                    onClick={() => handleCheckout('credits_50')}
                    disabled={checkoutLoading !== null}
                    variant="outline"
                    className="flex-1 rounded-xl border-amber-500/30"
                    size="sm"
                  >
                    {checkoutLoading === 'credits_50' ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <ShoppingCart className="mr-2 h-3 w-3" />
                    )}
                    50 Credits — $39
                    <span className="ml-1 text-[10px] text-emerald-500 font-bold">
                      SAVE 13%
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Pro plan — show manage subscription */}
          {isProPlan && hasStripeCustomer && (
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
