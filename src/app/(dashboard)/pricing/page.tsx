'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Check, Coins, Loader2, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';

export default function PricingPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [credits, setCredits] = useState<number>(0);
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Refresh profile data from DB
  const refreshProfile = async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('generation_credits, plan')
      .eq('id', user.id)
      .single();
    if (data) {
      setCredits(data.generation_credits);
      setPlan(data.plan);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [user]);

  // When returning from Stripe checkout, verify the session and fulfill the order
  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (payment === 'success' && sessionId && user) {
      (async () => {
        try {
          const res = await fetch('/api/stripe/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          const data = await res.json();
          if (data.status === 'fulfilled' || data.status === 'already_fulfilled') {
            setSuccessMsg('Payment successful! Your account has been updated.');
            await refreshProfile();
          }
        } catch (err) {
          console.error('Failed to verify session:', err);
        }

        // Clean up URL params
        const url = new URL(window.location.href);
        url.searchParams.delete('payment');
        url.searchParams.delete('session_id');
        window.history.replaceState({}, '', url.toString());
      })();
    } else if (payment === 'cancelled') {
      setSuccessMsg(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, user]);

  const handleCheckout = async (priceType: string) => {
    setLoading(priceType);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch {
      alert('Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const planBadgeLabel = (plan === 'pro' || plan === 'beta') ? 'Beta Pro Member' : 'Free Plan';

  return (
    <div className="max-w-5xl mx-auto py-8 md:py-16">
      {/* Success banner */}
      {successMsg && (
        <div
          className="mb-8 mx-auto max-w-3xl flex items-center gap-3 rounded-xl px-5 py-4 text-sm font-medium"
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            color: '#4ade80',
          }}
        >
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Pricing</h1>
        <p className="text-gray-400 text-lg mb-6">Start for free. Upgrade for more power.</p>

        <div
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium border"
          style={{
            background: 'rgba(139,92,246,0.1)',
            borderColor: 'rgba(139,92,246,0.3)',
            color: '#c4b5fd',
          }}
        >
          <Sparkles className="h-4 w-4" />
          {planBadgeLabel}
        </div>

        <div className="flex items-center justify-center gap-2 mt-5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <Coins className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-400">Your Balance</p>
            <p className="text-xl font-bold text-white tabular-nums">
              {credits} <span className="text-sm font-normal text-gray-400">credits</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 max-w-3xl mx-auto">
        <div
          className="rounded-2xl p-8 border"
          style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <h3 className="text-xl font-bold text-white mb-1">Free</h3>
          <p className="text-gray-500 text-sm mb-4">Get started building</p>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$0</span>
          </div>
          <ul className="space-y-3 mb-8">
            {['1 project', 'Basic AI generation', '0 starter credits', 'Single page sites'].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                {f}
              </li>
            ))}
          </ul>
          {plan === 'free' ? (
            <div
              className="w-full py-3 rounded-xl text-center text-sm font-medium text-gray-400 border"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
            >
              Current Plan
            </div>
          ) : (
            <div
              className="w-full py-3 rounded-xl text-center text-sm font-medium text-gray-500"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              —
            </div>
          )}
        </div>

        <div
          className="rounded-2xl p-8 border relative"
          style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(139,92,246,0.4)' }}
        >
          <div
            className="absolute -top-3 right-6 rounded-full px-4 py-1 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff' }}
          >
            BETA PRICE
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Beta Pro</h3>
          <p className="text-gray-500 text-sm mb-4">
            Exclusive early adopter pricing — locked forever
          </p>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$49</span>
            <span className="text-gray-400 text-sm">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              'Unlimited projects',
              'All AI features',
              '100 credits/month included',
              'Multi-page websites',
              'Priority generation',
              'Visual editor',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                {f}
              </li>
            ))}
          </ul>
          {plan === 'pro' || plan === 'beta' ? (
            <div
              className="w-full py-3 rounded-xl text-center text-sm font-medium text-gray-400 border"
              style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)' }}
            >
              Current Plan
            </div>
          ) : (
            <button
              onClick={() => handleCheckout('pro_monthly')}
              disabled={loading === 'pro_monthly'}
              className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
            >
              {loading === 'pro_monthly' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                'Upgrade to Pro'
              )}
            </button>
          )}
        </div>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">Credit Store</h2>
        <p className="text-gray-400">
          Purchase credits for AI generations — each build uses 1 credit
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div
          className="rounded-2xl p-8 border text-center"
          style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <Coins className="h-6 w-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">10</p>
          <p className="text-gray-400 text-sm mb-1">credits</p>
          <p className="text-2xl font-bold text-white mb-1">$9</p>
          <p className="text-xs text-gray-500 mb-6">$0.90 per credit</p>
          <button
            onClick={() => handleCheckout('credits_10')}
            disabled={loading === 'credits_10'}
            className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 border"
            style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
          >
            {loading === 'credits_10' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              'Buy Now'
            )}
          </button>
        </div>

        <div
          className="rounded-2xl p-8 border text-center relative"
          style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(139,92,246,0.4)' }}
        >
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}
          >
            BEST VALUE
          </div>
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            <Coins className="h-6 w-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">50</p>
          <p className="text-gray-400 text-sm mb-1">credits</p>
          <p className="text-2xl font-bold text-white mb-1">$39</p>
          <p className="text-xs text-gray-500 mb-6">$0.78 per credit</p>
          <button
            onClick={() => handleCheckout('credits_50')}
            disabled={loading === 'credits_50'}
            className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 border"
            style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.15)' }}
          >
            {loading === 'credits_50' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              'Buy Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Check, Coins, Loader2, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';

export default function PricingPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [credits, setCredits] = useState<number>(0);
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Refresh profile data from DB
  const refreshProfile = async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('generation_credits, plan')
      .eq('id', user.id)
      .single();
    if (data) {
      setCredits(data.generation_credits);
      setPlan(data.plan);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [user]);

  // When returning from Stripe checkout, verify the session and fulfill the order
  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (payment === 'success' && sessionId && user) {
      (async () => {
        try {
          const res = await fetch('/api/stripe/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          const data = await res.json();
          if (data.status === 'fulfilled' || data.status === 'already_fulfilled') {
            setSuccessMsg('Payment successful! Your account has been updated.');
            await refreshProfile();
          }
        } catch (err) {
          console.error('Failed to verify session:', err);
        }

        // Clean up URL params
        const url = new URL(window.location.href);
        url.searchParams.delete('payment');
        url.searchParams.delete('session_id');
        window.history.replaceState({}, '', url.toString());
      })();
    } else if (payment === 'cancelled') {
      setSuccessMsg(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, user]);

  const handleCheckout = async (priceType: string) => {
    setLoading(priceType);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch {
      alert('Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const planBadgeLabel = (plan === 'pro' || plan === 'beta') ? 'Beta Pro Member' : 'Free Plan';

  return (
    <div className="max-w-5xl mx-auto py-8 md:py-16">
      {/* Success banner */}
      {successMsg && (
        <div
          className="mb-8 mx-auto max-w-3xl flex items-center gap-3 rounded-xl px-5 py-4 text-sm font-medium"
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            color: '#4ade80',
          }}
        >
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Pricing</h1>
        <p className="text-gray-400 text-lg mb-6">Start for free. Upgrade for more power.</p>

        <div
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium border"
          style={{
            background: 'rgba(139,92,246,0.1)',
            borderColor: 'rgba(139,92,246,0.3)',
            color: '#c4b5fd',
          }}
        >
          <Sparkles className="h-4 w-4" />
          {planBadgeLabel}
        </div>

        <div className="flex items-center justify-center gap-2 mt-5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <Coins className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-400">Your Balance</p>
            <p className="text-xl font-bold text-white tabular-nums">
              {credits} <span className="text-sm font-normal text-gray-400">credits</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-20 max-w-3xl mx-auto">
        <div
          className="rounded-2xl p-8 border"
          style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <h3 className="text-xl font-bold text-white mb-1">Free</h3>
          <p className="text-gray-500 text-sm mb-4">Get started building</p>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$0</span>
          </div>
          <ul className="space-y-3 mb-8">
            {['1 project', 'Basic AI generation', '0 starter credits', 'Single page sites'].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                {f}
              </li>
            ))}
          </ul>
          {plan === 'free' ? (
            <div
              className="w-full py-3 rounded-xl text-center text-sm font-medium text-gray-400 border"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
            >
              Current Plan
            </div>
          ) : (
            <div
              className="w-full py-3 rounded-xl text-center text-sm font-medium text-gray-500"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              —
            </div>
          )}
        </div>

        <div
          className="rounded-2xl p-8 border relative"
          style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(139,92,246,0.4)' }}
        >
          <div
            className="absolute -top-3 right-6 rounded-full px-4 py-1 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff' }}
          >
            BETA PRICE
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Beta Pro</h3>
          <p className="text-gray-500 text-sm mb-4">
            Exclusive early adopter pricing — locked forever
          </p>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$49</span>
            <span className="text-gray-400 text-sm">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              'Unlimited projects',
              'All AI features',
              '100 credits/month included',
              'Multi-page websites',
              'Priority generation',
              'Visual editor',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                {f}
              </li>
            ))}
          </ul>
          {plan === 'pro' || plan === 'beta' ? (
            <div
              className="w-full py-3 rounded-xl text-center text-sm font-medium text-gray-400 border"
              style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)' }}
            >
              Current Plan
            </div>
          ) : (
            <button
              onClick={() => handleCheckout('pro_monthly')}
              disabled={loading === 'pro_monthly'}
              className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
            >
              {loading === 'pro_monthly' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                'Upgrade to Pro'
              )}
            </button>
          )}
        </div>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">Credit Store</h2>
        <p className="text-gray-400">
          Purchase credits for AI generations — each build uses 1 credit
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div
          className="rounded-2xl p-8 border text-center"
          style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <Coins className="h-6 w-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">10</p>
          <p className="text-gray-400 text-sm mb-1">credits</p>
          <p className="text-2xl font-bold text-white mb-1">$9</p>
          <p className="text-xs text-gray-500 mb-6">$0.90 per credit</p>
          <button
            onClick={() => handleCheckout('credits_10')}
            disabled={loading === 'credits_10'}
            className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 border"
            style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
          >
            {loading === 'credits_10' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              'Buy Now'
            )}
          </button>
        </div>

        <div
          className="rounded-2xl p-8 border text-center relative"
          style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(139,92,246,0.4)' }}
        >
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}
          >
            BEST VALUE
          </div>
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            <Coins className="h-6 w-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">50</p>
          <p className="text-gray-400 text-sm mb-1">credits</p>
          <p className="text-2xl font-bold text-white mb-1">$39</p>
          <p className="text-xs text-gray-500 mb-6">$0.78 per credit</p>
          <button
            onClick={() => handleCheckout('credits_50')}
            disabled={loading === 'credits_50'}
            className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 border"
            style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.15)' }}
          >
            {loading === 'credits_50' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              'Buy Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
