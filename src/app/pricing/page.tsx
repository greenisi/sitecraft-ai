'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Check, Coins, Sparkles, Clock, LayoutDashboard, Zap, Shield, Star } from 'lucide-react';
import { useUser } from '@/lib/hooks/use-user';

export default function PublicPricingPage() {
  const { user, loading: userLoading } = useUser();

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#050810' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-slow { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-30px); } }
        @keyframes float-medium { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.3); } 50% { box-shadow: 0 0 40px rgba(139,92,246,0.6), 0 0 80px rgba(139,92,246,0.2); } }
        @keyframes shimmer { 0% { background-position: -200% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes countdown-pulse { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.02); } }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .anim-up { animation: slide-up 0.8s ease-out forwards; }
        .anim-up-1 { animation: slide-up 0.8s ease-out 0.15s forwards; opacity: 0; }
        .anim-up-2 { animation: slide-up 0.8s ease-out 0.3s forwards; opacity: 0; }
        .anim-up-3 { animation: slide-up 0.8s ease-out 0.45s forwards; opacity: 0; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; background-size: 200% 200%; }
        .animate-countdown-pulse { animation: countdown-pulse 2s ease-in-out infinite; }
      ` }} />

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07] -top-48 -left-48 animate-float-slow" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05] top-1/3 -right-32 animate-float-medium" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.06] bottom-0 left-1/4 animate-float-slow" style={{ background: 'radial-gradient(circle, #ec4899, transparent 70%)' }} />
      </div>

      {/* Starfield */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="stars-small" />
        <div className="stars-medium" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/[0.06]" style={{ background: 'rgba(5,8,16,0.85)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/logo.png" alt="Innovated Marketing" width={844} height={563} className="brightness-0 invert" style={{ height: '80px', width: 'auto' }} priority />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            {userLoading ? (
              <div className="w-[100px]" />
            ) : user ? (
              <Link href="/dashboard" className="group relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white overflow-hidden transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                <span className="relative z-10 flex items-center gap-1.5 sm:gap-2"><LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />Dashboard</span>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' }} />
              </Link>
            ) : (
              <>
                <Link href="/pricing" className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium text-white transition-colors min-h-[44px] flex items-center">Pricing</Link>
                <Link href="/login" className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors min-h-[44px] flex items-center">Log in</Link>
                <Link href="/signup" className="group relative px-4 sm:px-5 py-2.5 sm:py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all hover:scale-105 min-h-[44px] flex items-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' }} />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-32 sm:pt-40 pb-8 sm:pb-12">
        <div className="anim-up inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 mb-6" style={{ background: 'rgba(245,158,11,0.08)' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="text-sm text-amber-300 font-medium">Limited Beta Pricing</span>
        </div>

        <h1 className="anim-up-1 text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-3xl leading-tight">
          Exclusive Early Adopter{' '}
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Pricing
          </span>
        </h1>

        <p className="anim-up-2 text-lg md:text-xl text-gray-400 max-w-2xl mb-6">
          Join during our beta and lock in these rates forever. Prices will increase at public launch.
        </p>

        <div className="anim-up-3 flex items-center gap-2 text-sm text-amber-400/80 animate-countdown-pulse">
          <Clock className="h-4 w-4" />
          <span>Beta pricing ends soon</span>
        </div>
      </section>

      {/* PLANS */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

          {/* Free Plan */}
          <div
            className="rounded-2xl p-8 border transition-all duration-300 hover:border-white/15"
            style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-xl font-bold text-white mb-1">Free</h3>
            <p className="text-gray-500 text-sm mb-6">Perfect for trying it out</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-gray-500 text-sm ml-1">/forever</span>
            </div>
            <ul className="space-y-3 mb-8">
              {['1 project', 'Basic AI generation', 'Single page sites', 'Community support'].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full py-3 rounded-xl text-center text-sm font-medium text-gray-300 border transition-all hover:bg-white/5 hover:text-white"
              style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}
            >
              Get Started Free
            </Link>
          </div>

          {/* Beta Pro Plan */}
          <div
            className="rounded-2xl p-8 border relative animate-pulse-glow transition-all duration-300"
            style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(139,92,246,0.4)' }}
          >
            {/* Badge */}
            <div
              className="absolute -top-3 right-6 rounded-full px-4 py-1 text-xs font-bold tracking-wide"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff' }}
            >
              EARLY ACCESS
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-white">Beta Pro</h3>
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-gray-500 text-sm mb-6">Lock in this price forever</p>

            {/* Price with strikethrough */}
            <div className="mb-2">
              <span className="text-2xl text-gray-600 line-through mr-3">$99</span>
              <span className="text-4xl font-bold text-white">$49</span>
              <span className="text-gray-400 text-sm ml-1">/month</span>
            </div>

            {/* Savings badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-6" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
              <Zap className="h-3 w-3" />
              Save 50% during beta
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Unlimited projects',
                'All AI features',
                '100 credits/month included',
                'Multi-page websites',
                'Priority generation',
                'Visual editor',
                'Custom domains',
                'Priority support',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="block w-full py-3.5 rounded-xl text-center text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
            >
              Start Building Now
            </Link>

            <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1.5">
              <Shield className="h-3 w-3" />
              Cancel anytime. Price locked for life.
            </p>
          </div>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Secure checkout via Stripe</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Instant access after signup</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Star className="h-4 w-4 text-purple-500" />
            <span>Early adopter perks</span>
          </div>
        </div>
      </section>

      {/* CREDIT STORE */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">Credit Store</h2>
          <p className="text-gray-400">
            Each AI website build uses 1 credit. Stock up at beta prices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 10 Credits */}
          <div
            className="rounded-2xl p-8 border text-center transition-all duration-300 hover:border-white/15"
            style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div
              className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <Coins className="h-6 w-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">10</p>
            <p className="text-gray-400 text-sm mb-3">credits</p>
            <div className="mb-1">
              <span className="text-lg text-gray-600 line-through mr-2">$15</span>
              <span className="text-2xl font-bold text-white">$9</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold mb-1" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
              40% off
            </div>
            <p className="text-xs text-gray-500 mb-6">$0.90 per credit</p>
            <Link
              href="/signup"
              className="block w-full py-3 rounded-xl text-sm font-medium text-white transition-all hover:bg-white/10 border"
              style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
            >
              Buy Credits
            </Link>
          </div>

          {/* 50 Credits */}
          <div
            className="rounded-2xl p-8 border text-center relative transition-all duration-300 hover:border-purple-500/40"
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
            <p className="text-gray-400 text-sm mb-3">credits</p>
            <div className="mb-1">
              <span className="text-lg text-gray-600 line-through mr-2">$59</span>
              <span className="text-2xl font-bold text-white">$39</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold mb-1" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
              34% off
            </div>
            <p className="text-xs text-gray-500 mb-6">$0.78 per credit</p>
            <Link
              href="/signup"
              className="block w-full py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 border"
              style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.15)' }}
            >
              Buy Credits
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Mini */}
      <section className="relative z-10 max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Common Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'What happens when beta pricing ends?', a: 'Your price stays the same forever. Only new users will see higher prices after launch.' },
            { q: 'What are credits used for?', a: 'Each AI website generation uses 1 credit. Pro members get 100 credits per month included, plus you can buy more anytime.' },
            { q: 'Can I cancel anytime?', a: 'Absolutely. No contracts, no commitments. Cancel anytime from your billing page.' },
            { q: 'Do I need a credit card to start?', a: 'No! The Free plan requires no payment. Just sign up and start building.' },
          ].map((item) => (
            <div
              key={item.q}
              className="rounded-xl p-5 border"
              style={{ background: 'rgba(15,23,42,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <h4 className="text-sm font-semibold text-white mb-2">{item.q}</h4>
              <p className="text-sm text-gray-400">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 pb-20">
        <div
          className="rounded-2xl p-8 sm:p-12 text-center border"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(109,40,217,0.05))',
            borderColor: 'rgba(139,92,246,0.2)',
          }}
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to build your website?
          </h3>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Join now and lock in exclusive beta pricing before rates go up. No credit card required to start.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
          >
            <Sparkles className="h-4 w-4" />
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Image src="/logo.png" alt="Innovated Marketing" width={844} height={563} className="brightness-0 invert w-auto" style={{ height: '36px' }} />
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <Link href="/pricing" className="hover:text-gray-400 transition-colors py-2 px-1 min-h-[44px] flex items-center">Pricing</Link>
            <Link href="/login" className="hover:text-gray-400 transition-colors py-2 px-1 min-h-[44px] flex items-center">Log In</Link>
            <Link href="/signup" className="hover:text-gray-400 transition-colors py-2 px-1 min-h-[44px] flex items-center">Sign Up</Link>
          </div>
          <p className="text-xs text-gray-700">&copy; 2026 Innovated Marketing. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
