'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Check, Phone, ArrowRight, Zap, Globe, MessageSquare } from 'lucide-react';
import type { VerticalConfig } from './vertical-config';

export function LandingClient({ cfg }: { cfg: VerticalConfig }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav />
      <Hero cfg={cfg} />
      <SocialProofStrip />
      <ProblemSection cfg={cfg} />
      <OutcomesSection cfg={cfg} />
      <BeforeAfterSection cfg={cfg} />
      <Testimonials cfg={cfg} />
      <FAQ cfg={cfg} />
      <FinalCTA cfg={cfg} />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-40 backdrop-blur bg-gray-950/70 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="font-semibold tracking-tight">SiteCraft</div>
        <a href="#cta" className="text-sm bg-white text-gray-950 px-4 py-2 rounded-full font-medium">Build mine</a>
      </div>
    </nav>
  );
}

function Hero({ cfg }: { cfg: VerticalConfig }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center relative">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-blue-300 bg-blue-500/10 border border-blue-400/20 rounded-full px-3 py-1 mb-6">
          {cfg.hero.eyebrow}
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
          {cfg.hero.h1}
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10">{cfg.hero.sub}</p>
        <SignupForm cfg={cfg} variant="hero" />
        <div className="flex items-center justify-center gap-6 text-xs text-gray-400 mt-6">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Free to build</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> No card required</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Live in 60 seconds</span>
        </div>
      </div>
    </section>
  );
}

function SocialProofStrip() {
  return (
    <div className="border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs uppercase tracking-widest text-gray-500">
        <span>Powering websites for crews from</span>
        <span className="text-gray-300 font-medium">Texas</span>
        <span className="text-gray-300 font-medium">Florida</span>
        <span className="text-gray-300 font-medium">California</span>
        <span className="text-gray-300 font-medium">Arizona</span>
        <span className="text-gray-300 font-medium">Georgia</span>
      </div>
    </div>
  );
}

function ProblemSection({ cfg }: { cfg: VerticalConfig }) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20">
      <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-center">If you run a {cfg.slug.replace('-', ' ')} business, you know it sucks when…</h2>
      <ul className="mt-10 space-y-3">
        {cfg.problems.map((p, i) => (
          <li key={i} className="flex items-start gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4">
            <span className="text-red-400 mt-0.5">✗</span>
            <span className="text-gray-200">{p}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OutcomesSection({ cfg }: { cfg: VerticalConfig }) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20">
      <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-center">After SiteCraft, you have…</h2>
      <ul className="mt-10 space-y-3">
        {cfg.outcomes.map((o, i) => (
          <li key={i} className="flex items-start gap-3 bg-emerald-500/[0.05] border border-emerald-500/10 rounded-xl px-5 py-4">
            <Check className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-gray-100">{o}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BeforeAfterSection({ cfg }: { cfg: VerticalConfig }) {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Before vs After</h2>
      <div className="grid sm:grid-cols-2 gap-5">
        {cfg.beforeAfter.map((ba, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <div className="text-xs uppercase tracking-widest text-red-300 mb-1">Before</div>
              <div className="text-gray-300">{ba.before}</div>
            </div>
            <div className="px-5 py-4 bg-emerald-500/[0.04]">
              <div className="text-xs uppercase tracking-widest text-emerald-300 mb-1">After</div>
              <div className="text-gray-100 font-medium">{ba.after}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials({ cfg }: { cfg: VerticalConfig }) {
  if (!cfg.social.length) return null;
  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      {cfg.social.map((t, i) => (
        <figure key={i} className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 text-center">
          <blockquote className="text-xl sm:text-2xl text-gray-100 leading-snug">"{t.quote}"</blockquote>
          <figcaption className="text-sm text-gray-400 mt-4">{t.name} · {t.role}</figcaption>
        </figure>
      ))}
    </section>
  );
}

function FAQ({ cfg }: { cfg: VerticalConfig }) {
  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center">Questions you probably have</h2>
      <div className="space-y-3">
        {cfg.faq.map((f, i) => (
          <details key={i} className="bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4 group">
            <summary className="cursor-pointer font-medium flex items-center justify-between">
              {f.q}
              <span className="text-gray-500 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="text-gray-300 mt-3">{f.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCTA({ cfg }: { cfg: VerticalConfig }) {
  return (
    <section id="cta" className="max-w-3xl mx-auto px-6 py-24 text-center">
      <h2 className="text-3xl sm:text-5xl font-bold mb-4">{cfg.hero.cta}</h2>
      <p className="text-gray-400 mb-10">First draft in 60 seconds. Edit anything. Publish when you're ready.</p>
      <SignupForm cfg={cfg} variant="cta" />
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 text-center text-xs text-gray-500">
      © {new Date().getFullYear()} SiteCraft
    </footer>
  );
}

function SignupForm({ cfg, variant }: { cfg: VerticalConfig; variant: 'hero' | 'cta' }) {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referrer, setReferrer] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') setReferrer(document.referrer || null);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/marketing/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          businessName,
          vertical: cfg.slug,
          source: variant === 'hero' ? 'landing_hero' : 'landing_cta',
          utm_source:   params.get('utm_source'),
          utm_medium:   params.get('utm_medium'),
          utm_campaign: params.get('utm_campaign'),
          utm_content:  params.get('utm_content'),
          referrer,
        }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Something went wrong'); return; }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-5 max-w-xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-emerald-300 font-medium">
          <Check className="w-5 h-5" /> You're on the list — we'll email you when your site is ready to build.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-2 bg-white/5 border border-white/10 rounded-2xl p-2">
        <input
          type="email"
          required
          placeholder="you@yourcrew.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder:text-gray-500"
        />
        <input
          type="text"
          placeholder="Business name (optional)"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="flex-1 sm:max-w-[220px] bg-transparent px-4 py-3 outline-none text-white placeholder:text-gray-500 border-t sm:border-t-0 sm:border-l border-white/10"
        />
        <button
          disabled={busy}
          className="bg-white text-gray-950 font-medium rounded-xl px-5 py-3 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>Build mine <ArrowRight className="w-4 h-4" /></>)}
        </button>
      </div>
      {error && <div className="text-sm text-red-300 mt-3">{error}</div>}
    </form>
  );
}
