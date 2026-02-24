'use client';

import { useState } from 'react';
import { Copy, Check, Link2, Users, DollarSign, Gift, TrendingUp, MousePointerClick, UserPlus, CreditCard, Clock } from 'lucide-react';

interface Affiliate {
  id: string;
  affiliate_code: string;
  referral_link: string;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  total_earnings: number;
  free_months_earned: number;
  free_months_used: number;
  status: string;
  created_at: string;
}

interface Referral {
  id: string;
  referred_email: string | null;
  status: string;
  plan_purchased: string | null;
  reward_type: string;
  reward_value: number;
  created_at: string;
  signed_up_at: string | null;
  converted_at: string | null;
  rewarded_at: string | null;
}

interface Props {
  affiliate: Affiliate | null;
  referrals: Referral[];
  userPlan: string;
}

export function AffiliateClient({ affiliate, referrals, userPlan }: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyLink = async () => {
    if (affiliate?.referral_link) {
      await navigator.clipboard.writeText(affiliate.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyCode = async () => {
    if (affiliate?.affiliate_code) {
      await navigator.clipboard.writeText(affiliate.affiliate_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const statusColors: Record<string, string> = {
    clicked: 'bg-gray-500/20 text-gray-400',
    signed_up: 'bg-blue-500/20 text-blue-400',
    converted: 'bg-green-500/20 text-green-400',
    rewarded: 'bg-amber-500/20 text-amber-400',
    expired: 'bg-red-500/20 text-red-400',
  };

  const freeMonthsAvailable = (affiliate?.free_months_earned || 0) - (affiliate?.free_months_used || 0);

  return (
    <div className="max-w-6xl mx-auto pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Affiliate Program</h1>
        <p className="text-gray-400 mt-2">Earn a free month for every referral that purchases a plan. Share your link, track conversions, and grow your rewards.</p>
      </div>

      {/* Reward Banner */}
      <div className="mb-8 rounded-2xl p-6 border border-emerald-500/20" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.08) 100%)' }}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/15">
            <Gift className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-1">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-4 mt-3">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
                <p className="text-sm text-gray-300">Share your unique referral link with friends and on social media</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
                <p className="text-sm text-gray-300">When someone signs up and purchases any paid plan using your link</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">3</span>
                <p className="text-sm text-gray-300">You earn a <span className="text-emerald-400 font-semibold">free month</span> of your current plan automatically!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-violet-400" />
          Your Referral Link
        </h2>
        <div className="flex gap-3">
          <div className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300 font-mono overflow-x-auto">
            {affiliate?.referral_link || 'Loading...'}
          </div>
          <button onClick={copyLink} className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all bg-violet-600 hover:bg-violet-500 text-white">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Your Code:</span>
            <code className="text-sm font-mono text-violet-400 bg-gray-800 px-2 py-0.5 rounded">{affiliate?.affiliate_code}</code>
            <button onClick={copyCode} className="text-gray-500 hover:text-white transition-colors">
              {copiedCode ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <span className="text-xs text-gray-600">|</span>
          <span className="text-xs text-gray-500">Status: <span className="text-emerald-400 font-medium">{affiliate?.status || 'active'}</span></span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MousePointerClick className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Clicks</span>
          </div>
          <p className="text-2xl font-bold text-white">{affiliate?.total_clicks || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Signups</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{affiliate?.total_signups || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Conversions</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{affiliate?.total_conversions || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Conv. Rate</span>
          </div>
          <p className="text-2xl font-bold text-violet-400">
            {affiliate?.total_clicks ? ((affiliate.total_conversions / affiliate.total_clicks) * 100).toFixed(1) : '0.0'}%
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Free Months</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{affiliate?.free_months_earned || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 border-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Available</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{freeMonthsAvailable}</p>
          <p className="text-xs text-gray-600 mt-0.5">months to redeem</p>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-400" />
            Referral History
          </h2>
          <span className="text-xs text-gray-500">{referrals.length} referrals</span>
        </div>
        {referrals.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">No referrals yet</p>
            <p className="text-sm text-gray-600">Share your referral link to start earning free months!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-gray-400">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Referred User</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Reward</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-6 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      {r.referred_email || <span className="text-gray-600">Anonymous click</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[r.status] || 'bg-gray-700 text-gray-300'}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 capitalize">{r.plan_purchased || '—'}</td>
                    <td className="px-6 py-3">
                      {r.status === 'rewarded' ? (
                        <span className="text-emerald-400 font-medium">+1 free month</span>
                      ) : r.status === 'converted' ? (
                        <span className="text-amber-400 text-xs">Pending reward</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Share Tips */}
      <div className="mt-8 bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Tips to Maximize Referrals</h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-500">
          <p>Share your link on social media profiles and bios</p>
          <p>Include it in your email signature for outreach</p>
          <p>Create content showcasing websites you built with our platform</p>
          <p>Recommend it to other businesses and entrepreneurs you know</p>
        </div>
      </div>
    </div>
  );
}
