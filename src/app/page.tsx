'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Globe, Sparkles, MessageSquare, Palette, Rocket, Check, Play, Code2, LayoutDashboard, MousePointerClick, Loader2, User, Mail, Lock, X, ShoppingBag, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Typewriter({ words, className }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[index];
    const speed = deleting ? 40 : 80;
    if (!deleting && text === word) { const t = setTimeout(() => setDeleting(true), 2000); return () => clearTimeout(t); }
    if (deleting && text === '') { setDeleting(false); setIndex((i) => (i + 1) % words.length); return; }
    const t = setTimeout(() => { setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)); }, speed);
    return () => clearTimeout(t);
  }, [text, deleting, index, words]);
  return <span className={className}>{text}<span className="animate-pulse text-violet-400">|</span></span>;
}

function Counter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => { start += step; if (start >= target) { setCount(target); clearInterval(timer); } else setCount(Math.floor(start)); }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const PLACEHOLDER_PROMPTS: Record<string, string[]> = {
  business: [
    'Build a modern website for my dental practice with appointment booking...',
    'Create a coffee shop site with menu and online ordering...',
    'Design a law firm website with attorney profiles and case results...',
    'Make a yoga studio page with class schedules and pricing...',
    'Build a restaurant site with a beautiful menu and reservations...',
  ],
  store: [
    'Build an e-commerce store for handmade candles with product photos...',
    'Create a fashion boutique with collections, sizing, and cart...',
    'Design a supplement store with product reviews and bundles...',
    'Make a jewelry shop with custom engravings and gift wrapping...',
    'Build a pet supplies store with subscription boxes...',
  ],
  landing: [
    'Create a launch page for my new SaaS product with waitlist...',
    'Build a coming soon page for my upcoming mobile app...',
    'Design a promotional landing page for my online course...',
    'Make a signup page for my newsletter with social proof...',
    'Build an event landing page with countdown and RSVP...',
  ],
};

const SITE_TYPES = [
  { key: 'business', label: 'Business Website', icon: Globe },
  { key: 'store', label: 'Online Store', icon: ShoppingBag },
  { key: 'landing', label: 'Landing Page', icon: FileText },
] as const;

export default function HomePage() {
  const hero = useInView(0.1);
  const features = useInView();
  const howItWorks = useInView();
  const stats = useInView();
  const showcase = useInView();
  const cta = useInView();

  // Prompt bar state
  const [promptText, setPromptText] = useState('');
  const [siteType, setSiteType] = useState<string>('business');
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState('');
  const [isPlaceholderDeleting, setIsPlaceholderDeleting] = useState(false);

  // Signup modal state
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  // Reset placeholder when siteType changes
  useEffect(() => {
    setPlaceholderText('');
    setPlaceholderIndex(0);
    setIsPlaceholderDeleting(false);
  }, [siteType]);

  // Rotating placeholder effect
  useEffect(() => {
    if (promptText) return;
    const prompts = PLACEHOLDER_PROMPTS[siteType] || PLACEHOLDER_PROMPTS.business;
    const word = prompts[placeholderIndex % prompts.length];
    const speed = isPlaceholderDeleting ? 30 : 50;
    if (!isPlaceholderDeleting && placeholderText === word) {
      const t = setTimeout(() => setIsPlaceholderDeleting(true), 2500);
      return () => clearTimeout(t);
    }
    if (isPlaceholderDeleting && placeholderText === '') {
      setIsPlaceholderDeleting(false);
      setPlaceholderIndex((i) => (i + 1) % prompts.length);
      return;
    }
    const t = setTimeout(() => {
      setPlaceholderText(
        isPlaceholderDeleting
          ? word.slice(0, placeholderText.length - 1)
          : word.slice(0, placeholderText.length + 1)
      );
    }, speed);
    return () => clearTimeout(t);
  }, [placeholderText, isPlaceholderDeleting, placeholderIndex, promptText, siteType]);

  // Handlers
  const handlePromptSubmit = () => {
    if (!promptText.trim()) return;
    localStorage.setItem('sitecraft_pending_prompt', promptText.trim());
    setShowSignupModal(true);
  };

  const handleEmailSignupFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!signupName.trim()) { setSignupError('Please enter your name.'); return; }
    if (!signupEmail.trim()) { setSignupError('Please enter your email.'); return; }
    if (!signupPassword) { setSignupError('Please enter a password.'); return; }
    if (signupPassword.length < 6) { setSignupError('Password must be at least 6 characters.'); return; }
    if (signupPassword !== signupConfirmPassword) { setSignupError('Passwords do not match.'); return; }

    setSignupLoading(true);

    try {
      // Step 1: Create account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail.trim(),
          password: signupPassword,
          displayName: signupName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setSignupError(data.error || 'Signup failed');
        setSignupLoading(false);
        return;
      }

      // Step 2: Sign in
      const supabase = createClient();
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: signupEmail.trim(),
        password: signupPassword,
      });

      if (signInError || !authData.user) {
        setSignupError(signInError?.message || 'Sign in failed');
        setSignupLoading(false);
        return;
      }

      // Step 3: Create project with user's prompt
      const prompt = promptText.trim() || localStorage.getItem('sitecraft_pending_prompt') || '';
      const slug = 'my-website-' + Date.now().toString(36);

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: authData.user.id,
          name: 'My Website',
          slug,
          site_type: 'business',
          status: 'draft',
        })
        .select()
        .single();

      if (projectError || !projectData) {
        localStorage.removeItem('sitecraft_pending_prompt');
        window.location.href = '/dashboard';
        return;
      }

      // Step 4: Redirect to editor with prompt
      localStorage.removeItem('sitecraft_pending_prompt');
      window.location.href = `/projects/${projectData.id}?desc=${encodeURIComponent(prompt)}`;
    } catch {
      setSignupError('An unexpected error occurred. Please try again.');
      setSignupLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    localStorage.setItem('sitecraft_pending_prompt', promptText.trim());
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback?redirect=${encodeURIComponent('/dashboard')}`,
      },
    });
    if (error) setSignupError(error.message);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#050810' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-slow { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-30px); } }
        @keyframes float-medium { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes gradient-x { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.3); } 50% { box-shadow: 0 0 40px rgba(139,92,246,0.6), 0 0 80px rgba(139,92,246,0.2); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @property --border-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        @keyframes rotate-border { to { --border-angle: 360deg; } }
        @keyframes glow-shift { 0%, 100% { background-position: 0% 50%; opacity: 0.5; transform: scale(1); } 25% { opacity: 0.7; } 50% { background-position: 100% 50%; opacity: 0.5; transform: scale(1.02); } 75% { opacity: 0.65; } }
        @keyframes glow-pulse { 0%, 100% { opacity: 0.25; transform: scale(1); } 50% { opacity: 0.45; transform: scale(1.03); } }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .animate-gradient-x { animation: gradient-x 6s ease infinite; background-size: 200% 200%; }
        .anim-up { animation: slide-up 0.8s ease-out forwards; }
        .anim-up-1 { animation: slide-up 0.8s ease-out 0.15s forwards; opacity: 0; }
        .anim-up-2 { animation: slide-up 0.8s ease-out 0.3s forwards; opacity: 0; }
        .anim-up-3 { animation: slide-up 0.8s ease-out 0.45s forwards; opacity: 0; }
        .anim-up-4 { animation: slide-up 0.8s ease-out 0.6s forwards; opacity: 0; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-glow-shift { animation: glow-shift 6s ease-in-out infinite; background-size: 200% 200%; will-change: transform, opacity; }
        .animate-glow-pulse { animation: glow-pulse 4s ease-in-out infinite; will-change: transform, opacity; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
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
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/[0.06]" style={{ background: 'rgba(5,8,16,0.8)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Innovated Marketing" width={844} height={563} className="brightness-0 invert w-auto" style={{ height: '50px' }} priority />
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">Log in</Link>
            <Link href="/signup" className="group relative px-5 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
              <span className="relative z-10">Get Started Free</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' }} />
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section ref={hero.ref} className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-32 sm:pt-40 md:pt-48 pb-24">
          <div className="anim-up inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 mb-8" style={{ background: 'rgba(139,92,246,0.08)' }}>
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>
            <span className="text-sm text-gray-300 font-medium">Now in Public Beta &mdash; Join 500+ builders</span>
          </div>

          <h1 className="anim-up-1 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] max-w-5xl tracking-tight">
            <span className="bg-clip-text text-transparent animate-gradient-x" style={{ backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 25%, #818cf8 50%, #c084fc 75%, #ffffff 100%)' }}>Describe it.</span>
            <br /><span className="text-white/90">We build it.</span>
          </h1>

          <div className="anim-up-2 mt-6 text-xl sm:text-2xl text-gray-400 max-w-2xl">
            AI-generated websites for{' '}
            <Typewriter words={['coffee shops', 'dental studios', 'real estate agents', 'yoga studios', 'restaurants', 'dispensaries', 'e-commerce stores', 'SaaS products']} className="text-violet-400 font-semibold" />
          </div>

          <p className="anim-up-3 mt-4 text-base text-gray-500 max-w-xl">No code. No templates. Just tell our AI what you need and get a professional, multi-page website in minutes.</p>

          {/* PREMIUM PROMPT COMPOSER */}
          <div className="anim-up-4 mt-10 w-full max-w-2xl mx-auto">
            <div className="relative group">
              {/* Rotating gradient border — ambient glow behind */}
              <div
                className="absolute -inset-[3px] rounded-[22px] opacity-60 blur-xl"
                style={{
                  background: 'conic-gradient(from var(--border-angle, 0deg), #8b5cf6, #6366f1, #ec4899, #3b82f6, #8b5cf6)',
                  animation: 'rotate-border 4s linear infinite',
                }}
              />
              {/* Rotating gradient border — sharp edge */}
              <div
                className="absolute -inset-[1.5px] rounded-[20px]"
                style={{
                  background: 'conic-gradient(from var(--border-angle, 0deg), #8b5cf6, #6366f1, #ec4899, #3b82f6, #8b5cf6)',
                  animation: 'rotate-border 4s linear infinite',
                }}
              />

              {/* Inner card */}
              <div className="relative rounded-[18px] overflow-hidden"
                style={{ background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(20px)' }}
              >
                {/* Category tabs row */}
                <div className="flex items-center gap-1 px-3 sm:px-4 pt-3 pb-2 border-b border-white/[0.06] overflow-x-auto scrollbar-hide">
                  {SITE_TYPES.map((type) => (
                    <button
                      key={type.key}
                      onClick={() => setSiteType(type.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                        siteType === type.key
                          ? 'bg-violet-500/15 text-violet-300 shadow-sm shadow-violet-500/10'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                      }`}
                    >
                      <type.icon className="h-3.5 w-3.5" />
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <div className="relative px-4 sm:px-5">
                  <textarea
                    ref={promptInputRef}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && promptText.trim()) { e.preventDefault(); handlePromptSubmit(); } }}
                    placeholder={placeholderText || 'Describe your dream website...'}
                    rows={3}
                    className="w-full bg-transparent text-white text-base sm:text-lg placeholder-gray-600 py-4 sm:py-5 outline-none resize-none leading-relaxed"
                    style={{ minHeight: '80px' }}
                  />
                </div>

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-violet-400/80" style={{ background: 'rgba(139,92,246,0.08)' }}>
                      <Sparkles className="h-3 w-3" />
                      AI-powered
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-xs text-gray-600">No credit card required</span>
                    <button
                      onClick={handlePromptSubmit}
                      disabled={!promptText.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-[0.97] hover:shadow-lg hover:shadow-violet-500/25"
                      style={{ background: promptText.trim() ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.06)' }}
                    >
                      <span className="hidden sm:inline">Build</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* See How It Works link */}
            <div className="mt-5 flex items-center justify-center gap-6">
              <Link href="#how-it-works" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors">
                <Play className="h-3.5 w-3.5" />See How It Works
              </Link>
              <span className="text-gray-700">•</span>
              <span className="text-xs text-gray-600">Free to start &mdash; no credit card</span>
            </div>
          </div>

          {/* Mock browser — premium animated preview */}
          <div className="anim-up-4 mt-16 w-full max-w-5xl mx-auto relative">
            <div className="absolute -inset-4 rounded-3xl opacity-40 blur-2xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2), rgba(236,72,153,0.2))' }} />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-500/5" style={{ background: 'rgba(15,23,42,0.9)' }}>
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5" style={{ background: 'rgba(15,23,42,0.95)' }}>
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/70" /><div className="w-3 h-3 rounded-full bg-yellow-500/70" /><div className="w-3 h-3 rounded-full bg-green-500/70" /></div>
                <div className="flex-1 mx-4 px-4 py-1.5 rounded-lg text-xs text-gray-500 font-mono flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <Lock className="h-3 w-3 text-green-500/70" />
                  bloom-wellness-spa.innovated.site
                </div>
              </div>

              {/* Split view: Chat + Website Preview */}
              <div className="flex h-[360px] sm:h-[440px]">
                {/* Chat panel */}
                <div className="w-[280px] sm:w-[320px] border-r border-white/5 flex flex-col" style={{ background: 'rgba(8,12,24,0.8)' }}>
                  <div className="p-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white/80">AI Builder</span>
                      <span className="ml-auto flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" /></span>
                    </div>
                  </div>
                  <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
                    <div className="rounded-xl p-2.5 text-[11px] text-left text-white/80 leading-relaxed" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.15)' }}>
                      Create a luxury wellness spa website with booking, serene visuals, and a calming color palette ✨
                    </div>
                    <div className="rounded-xl p-2.5 text-[11px] text-left text-gray-400 leading-relaxed" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <span className="text-violet-400 font-semibold">AI:</span> Building your spa website with a sage & cream palette, smooth animations, and integrated booking...
                    </div>
                    <div className="flex gap-1.5">
                      <div className="rounded-lg px-2 py-1 text-[10px] text-violet-400/80 border border-violet-500/20" style={{ background: 'rgba(139,92,246,0.06)' }}>Add testimonials</div>
                      <div className="rounded-lg px-2 py-1 text-[10px] text-violet-400/80 border border-violet-500/20" style={{ background: 'rgba(139,92,246,0.06)' }}>Change colors</div>
                    </div>
                    <div className="rounded-xl p-2.5 text-[11px] text-left text-white/80 leading-relaxed" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.15)' }}>
                      Add a hero section with a &ldquo;Book Now&rdquo; button and show pricing plans
                    </div>
                    <div className="rounded-xl p-2.5 text-[11px] text-left text-gray-400 leading-relaxed" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <span className="text-violet-400 font-semibold">AI:</span> Done! Added a stunning hero with parallax, pricing cards with hover effects, and a smooth booking CTA ✓
                    </div>
                  </div>
                  <div className="p-3 border-t border-white/5">
                    <div className="rounded-xl px-3 py-2.5 text-[11px] text-gray-600 border border-white/[0.08] flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <MessageSquare className="h-3 w-3" />
                      Describe changes...
                    </div>
                  </div>
                </div>

                {/* Website preview — animated luxury spa */}
                <div className="flex-1 relative overflow-hidden">
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #1a2f23 0%, #0f1f17 40%, #0d1a14 100%)' }}>
                    {/* Ambient glow spots */}
                    <div className="absolute w-[200px] h-[200px] rounded-full opacity-20 -top-10 right-10" style={{ background: 'radial-gradient(circle, #86efac, transparent 70%)', animation: 'float-slow 8s ease-in-out infinite' }} />
                    <div className="absolute w-[150px] h-[150px] rounded-full opacity-15 bottom-20 left-10" style={{ background: 'radial-gradient(circle, #a7f3d0, transparent 70%)', animation: 'float-medium 6s ease-in-out infinite' }} />

                    {/* Nav */}
                    <div className="flex items-center justify-between px-5 sm:px-8 py-3" style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #86efac, #34d399)' }} />
                        <span className="text-white/90 text-xs sm:text-sm font-semibold tracking-wide">Bloom Wellness</span>
                      </div>
                      <div className="hidden sm:flex gap-5 text-[10px] text-white/50 font-medium tracking-wider uppercase">
                        <span className="text-white/80">Home</span><span>Services</span><span>Pricing</span><span>Book</span><span>Contact</span>
                      </div>
                      <div className="px-3 py-1 rounded-full text-[10px] font-semibold text-emerald-900" style={{ background: 'linear-gradient(135deg, #86efac, #34d399)' }}>Book Now</div>
                    </div>

                    {/* Hero */}
                    <div className="flex flex-col items-center justify-center text-center px-6 sm:px-8 pt-6 sm:pt-10">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-medium text-emerald-300/80 border border-emerald-500/20 mb-4" style={{ background: 'rgba(52,211,153,0.08)', animation: 'slide-up 0.8s ease-out forwards' }}>
                        <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
                        Now Accepting New Clients
                      </div>
                      <div className="text-xl sm:text-3xl md:text-4xl font-bold text-white/95 mb-2 tracking-tight" style={{ animation: 'slide-up 0.8s ease-out 0.1s forwards', opacity: 0 }}>
                        Find Your Inner
                        <span className="bg-clip-text text-transparent ml-1.5" style={{ backgroundImage: 'linear-gradient(135deg, #86efac, #34d399, #6ee7b7)' }}> Balance</span>
                      </div>
                      <div className="text-[11px] sm:text-xs text-white/40 mb-5 max-w-xs" style={{ animation: 'slide-up 0.8s ease-out 0.2s forwards', opacity: 0 }}>Premium wellness treatments designed to restore, rejuvenate, and transform your mind and body</div>
                      <div className="flex items-center gap-3" style={{ animation: 'slide-up 0.8s ease-out 0.3s forwards', opacity: 0 }}>
                        <div className="px-5 py-2 rounded-xl text-[11px] font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20" style={{ background: 'linear-gradient(135deg, #86efac, #34d399)' }}>Book a Session</div>
                        <div className="px-4 py-2 rounded-xl text-[11px] font-medium text-white/70 border border-white/10 hover:border-white/20">View Pricing</div>
                      </div>
                    </div>

                    {/* Mini pricing cards */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3 px-4 mt-5 sm:mt-8" style={{ animation: 'slide-up 0.8s ease-out 0.5s forwards', opacity: 0 }}>
                      {[
                        { name: 'Relaxation', price: '$89', color: '#6ee7b7' },
                        { name: 'Deep Tissue', price: '$129', color: '#34d399', popular: true },
                        { name: 'Hot Stone', price: '$149', color: '#86efac' },
                      ].map((plan) => (
                        <div key={plan.name} className="relative flex-1 max-w-[140px] rounded-xl p-2.5 sm:p-3 border transition-all duration-500"
                          style={{
                            background: plan.popular ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
                            borderColor: plan.popular ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.06)',
                          }}>
                          {plan.popular && <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-bold text-emerald-950" style={{ background: 'linear-gradient(135deg, #86efac, #34d399)' }}>POPULAR</div>}
                          <div className="text-[10px] text-white/50 font-medium">{plan.name}</div>
                          <div className="text-sm sm:text-base font-bold mt-0.5" style={{ color: plan.color }}>{plan.price}</div>
                          <div className="text-[8px] text-white/30 mt-0.5">per session</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </section>

      {/* SOCIAL PROOF */}
      <section ref={stats.ref} className="relative z-10 py-16 border-y border-white/5" style={{ background: 'rgba(139,92,246,0.03)' }}>
        {stats.inView && (
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-4 text-center anim-up">
            <div><div className="text-3xl md:text-4xl font-extrabold text-white"><Counter target={500} suffix="+" /></div><div className="text-sm text-gray-500 mt-1">Websites Built</div></div>
            <div><div className="text-3xl md:text-4xl font-extrabold text-white"><Counter target={50} suffix="+" /></div><div className="text-sm text-gray-500 mt-1">Active Builders</div></div>
            <div><div className="text-3xl md:text-4xl font-extrabold text-white"><Counter target={2} suffix=" min" /></div><div className="text-sm text-gray-500 mt-1">Avg. Build Time</div></div>
            <div><div className="text-3xl md:text-4xl font-extrabold text-white"><Counter target={99} suffix="%" /></div><div className="text-sm text-gray-500 mt-1">Uptime</div></div>
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" ref={howItWorks.ref} className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          {howItWorks.inView && (<>
            <div className="text-center mb-16 anim-up">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-violet-400 border border-violet-500/30 mb-4" style={{ background: 'rgba(139,92,246,0.1)' }}>HOW IT WORKS</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">Three steps. That&apos;s it.</h2>
              <p className="mt-4 text-gray-500 max-w-lg mx-auto">From idea to live website in minutes, not months.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: MessageSquare, num: '01', title: 'Describe Your Vision', desc: 'Tell our AI about your business in plain English. What you do, your style, and what pages you need.', color: '#3b82f6', delay: 'anim-up-1' },
                { icon: Sparkles, num: '02', title: 'AI Builds It Live', desc: 'Watch as your complete multi-page website is generated in real-time. Preview instantly and refine with chat.', color: '#8b5cf6', delay: 'anim-up-2' },
                { icon: Rocket, num: '03', title: 'Publish & Grow', desc: 'Hit publish and your site goes live. Manage content with your built-in CMS and connect a custom domain.', color: '#ec4899', delay: 'anim-up-3' },
              ].map((step) => (
                <div key={step.num} className={`${step.delay} group relative rounded-2xl p-8 border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 hover:-translate-y-2`} style={{ background: 'rgba(15,23,42,0.5)' }}>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${step.color}08, transparent)` }} />
                  <div className="relative">
                    <div className="text-5xl font-extrabold mb-6" style={{ color: `${step.color}20` }}>{step.num}</div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${step.color}15` }}>
                      <step.icon className="h-6 w-6" style={{ color: step.color }} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </section>

      {/* FEATURES */}
      <section ref={features.ref} className="relative z-10 py-24 px-4" style={{ background: 'linear-gradient(180deg, transparent, rgba(139,92,246,0.03), transparent)' }}>
        <div className="max-w-6xl mx-auto">
          {features.inView && (<>
            <div className="text-center mb-16 anim-up">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-violet-400 border border-violet-500/30 mb-4" style={{ background: 'rgba(139,92,246,0.1)' }}>FEATURES</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">Everything you need.<br /><span className="text-gray-500">Nothing you don&apos;t.</span></h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Sparkles, title: 'AI Generation', desc: 'Full multi-page websites built from a simple conversation. Not templates — truly unique code.', color: '#a855f7' },
                { icon: Code2, title: 'Clean Code Output', desc: 'Export production-ready Next.js + Tailwind CSS code. No vendor lock-in.', color: '#3b82f6' },
                { icon: LayoutDashboard, title: 'Built-in CMS', desc: 'Manage services, blog posts, gallery, reviews, bookings, and more from your dashboard.', color: '#06b6d4' },
                { icon: Globe, title: 'One-Click Publish', desc: 'Go live instantly on a .innovated.site subdomain or connect your own custom domain.', color: '#10b981' },
                { icon: MousePointerClick, title: 'AI Autofill', desc: 'One click fills your entire site with your business data from the CMS. Like magic.', color: '#f59e0b' },
                { icon: Palette, title: 'Full Customization', desc: 'Chat with AI to tweak any part of your site. Colors, layout, copy — whatever you want.', color: '#ef4444' },
              ].map((f) => (
                <div key={f.title} className="group relative rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 hover:-translate-y-1 anim-up" style={{ background: 'rgba(15,23,42,0.4)' }}>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(135deg, ${f.color}06, transparent)` }} />
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: `${f.color}15` }}><f.icon className="h-5 w-5" style={{ color: f.color }} /></div>
                    <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </section>

      {/* SHOWCASE */}
      <section ref={showcase.ref} className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          {showcase.inView && (<>
            <div className="text-center mb-16 anim-up">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-violet-400 border border-violet-500/30 mb-4" style={{ background: 'rgba(139,92,246,0.1)' }}>BUILT WITH INNOVATED</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">Real sites. Real businesses.</h2>
              <p className="mt-4 text-gray-500 max-w-lg mx-auto">Every site below was generated by AI from a simple text description.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 anim-up-1">

              {/* Card 1 — Noir & Bloom (Premium Florist) */}
              <div className="group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-pink-500/10 cursor-pointer">
                <div className="aspect-[16/10] relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #1a0a12 0%, #0d0608 50%, #12080c 100%)' }}>
                  {/* Subtle rose gold accent glow */}
                  <div className="absolute w-[180px] h-[180px] rounded-full opacity-20 -top-16 right-0" style={{ background: 'radial-gradient(circle, #f9a8d4, transparent 70%)' }} />
                  <div className="absolute w-[120px] h-[120px] rounded-full opacity-10 bottom-4 left-8" style={{ background: 'radial-gradient(circle, #fda4af, transparent 70%)' }} />
                  {/* Nav */}
                  <div className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/90">Noir & Bloom</div>
                    </div>
                    <div className="flex gap-4 text-[9px] text-white/40 tracking-wider uppercase font-medium">
                      <span>Shop</span><span>Events</span><span>About</span><span>Contact</span>
                    </div>
                    <div className="px-3 py-1 rounded-full text-[9px] font-semibold text-black" style={{ background: 'linear-gradient(135deg, #fda4af, #f9a8d4)' }}>Order Now</div>
                  </div>
                  {/* Hero area */}
                  <div className="flex items-stretch px-5 mt-1 gap-4">
                    {/* Left — text */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="text-[9px] text-pink-300/60 font-medium tracking-[0.15em] uppercase mb-1.5">Luxury Floral Design</div>
                      <div className="text-xl sm:text-2xl font-bold text-white/95 leading-tight tracking-tight mb-2">Bespoke Arrangements<br/>for <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fda4af, #f9a8d4, #c084fc)' }}>Every Occasion</span></div>
                      <div className="text-[10px] text-white/35 leading-relaxed mb-3 max-w-[200px]">Hand-crafted floral experiences for weddings, corporate events, and everyday luxury.</div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-lg text-[9px] font-semibold text-black" style={{ background: 'linear-gradient(135deg, #fda4af, #f9a8d4)' }}>Explore Collection</div>
                        <div className="px-3 py-1.5 rounded-lg text-[9px] font-medium text-white/60 border border-white/10">Our Story</div>
                      </div>
                    </div>
                    {/* Right — mock image card */}
                    <div className="w-[120px] sm:w-[140px] rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(160deg, #3d1c2b 0%, #1f0e16 100%)' }}>
                      <div className="h-full flex flex-col items-center justify-center p-3 text-center">
                        <div className="text-3xl mb-1">🌸</div>
                        <div className="text-[9px] text-white/50 font-medium">Spring Edit</div>
                        <div className="text-[8px] text-pink-300/40 mt-0.5">From $85</div>
                      </div>
                    </div>
                  </div>
                  {/* Trust bar */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 py-2 text-[8px] text-white/25 font-medium" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <span>★★★★★ 4.9 Rating</span><span>•</span><span>2,400+ Arrangements Delivered</span><span>•</span><span>Same-Day Available</span>
                  </div>
                </div>
                <div className="p-4" style={{ background: 'rgba(15,23,42,0.8)' }}>
                  <div className="flex items-center justify-between">
                    <div><h3 className="text-sm font-semibold text-white">Noir & Bloom</h3><p className="text-xs text-gray-500">Luxury Florist</p></div>
                    <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>

              {/* Card 2 — Kinetic Studios (Fitness / Gym) */}
              <div className="group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer">
                <div className="aspect-[16/10] relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0c0c0c 0%, #0a0a0a 50%, #111 100%)' }}>
                  {/* Accent glow */}
                  <div className="absolute w-[250px] h-[200px] rounded-full opacity-15 -top-10 -right-10" style={{ background: 'radial-gradient(circle, #f97316, transparent 70%)' }} />
                  <div className="absolute w-[200px] h-[150px] rounded-full opacity-10 bottom-0 left-0" style={{ background: 'radial-gradient(circle, #fbbf24, transparent 70%)' }} />
                  {/* Nav */}
                  <div className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }} />
                      <div className="text-[11px] font-extrabold tracking-tight text-white/95">KINETIC</div>
                    </div>
                    <div className="flex gap-4 text-[9px] text-white/40 tracking-wider uppercase font-medium">
                      <span className="text-white/70">Classes</span><span>Trainers</span><span>Membership</span><span>Blog</span>
                    </div>
                    <div className="px-3 py-1 rounded-full text-[9px] font-bold text-black" style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>Start Free Trial</div>
                  </div>
                  {/* Hero */}
                  <div className="px-5 mt-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="px-2 py-0.5 rounded text-[8px] font-bold text-black" style={{ background: '#f97316' }}>NEW</div>
                      <span className="text-[9px] text-orange-300/60">Spring Shred Challenge — Limited Spots</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white/95 leading-none tracking-tighter mb-1.5">
                      TRAIN HARDER.<br/><span style={{ color: '#f97316' }}>LIVE STRONGER.</span>
                    </div>
                    <div className="text-[10px] text-white/35 mb-3 max-w-[280px]">50+ weekly classes. World-class trainers. State-of-the-art equipment. Your transformation starts here.</div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="px-4 py-1.5 rounded-lg text-[9px] font-bold text-black" style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>Get Started — $0 Today</div>
                      <div className="px-3 py-1.5 rounded-lg text-[9px] font-medium text-white/50 border border-white/10">View Schedule</div>
                    </div>
                    {/* Stats row */}
                    <div className="flex items-center gap-4">
                      {[{ n: '50+', l: 'Weekly Classes' }, { n: '12', l: 'Expert Trainers' }, { n: '4.8', l: 'Member Rating' }].map((s) => (
                        <div key={s.l}>
                          <div className="text-sm font-extrabold" style={{ color: '#f97316' }}>{s.n}</div>
                          <div className="text-[8px] text-white/30">{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4" style={{ background: 'rgba(15,23,42,0.8)' }}>
                  <div className="flex items-center justify-between">
                    <div><h3 className="text-sm font-semibold text-white">Kinetic Studios</h3><p className="text-xs text-gray-500">Fitness & Training</p></div>
                    <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>

              {/* Card 3 — Aura Architecture (Modern Architecture Firm) */}
              <div className="group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-sky-500/10 cursor-pointer">
                <div className="aspect-[16/10] relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0a0f1a 0%, #060b14 50%, #080e18 100%)' }}>
                  {/* Accent glow */}
                  <div className="absolute w-[200px] h-[200px] rounded-full opacity-15 top-0 left-1/3" style={{ background: 'radial-gradient(circle, #38bdf8, transparent 70%)' }} />
                  <div className="absolute w-[150px] h-[150px] rounded-full opacity-10 bottom-0 right-10" style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />
                  {/* Nav */}
                  <div className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }} />
                      <div className="text-[11px] font-semibold tracking-[0.1em] text-white/90">AURA</div>
                      <div className="text-[9px] text-white/30 font-light tracking-wider">ARCHITECTURE</div>
                    </div>
                    <div className="flex gap-4 text-[9px] text-white/35 tracking-wider uppercase font-medium">
                      <span>Projects</span><span>Studio</span><span>Process</span><span>Contact</span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="px-5 mt-1">
                    <div className="text-[9px] text-sky-400/50 font-medium tracking-widest uppercase mb-2">Featured Project — Waterfront Residence</div>
                    <div className="text-2xl sm:text-3xl font-light text-white/95 leading-tight tracking-tight mb-2">
                      Design That<br/><span className="font-semibold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #38bdf8, #818cf8, #c084fc)' }}>Transcends Space</span>
                    </div>
                    <div className="text-[10px] text-white/30 leading-relaxed mb-4 max-w-[260px]">Award-winning architectural design that harmonizes form, function, and the natural landscape.</div>
                    {/* Mock project gallery thumbnails */}
                    <div className="flex items-center gap-2 mb-3">
                      {[
                        { bg: 'linear-gradient(135deg, #1e3a5f, #0f1f3a)', label: 'Waterfront' },
                        { bg: 'linear-gradient(135deg, #2a1f3d, #150e24)', label: 'Skyline Tower' },
                        { bg: 'linear-gradient(135deg, #1f2e1f, #0f1a0f)', label: 'Forest Villa' },
                      ].map((p) => (
                        <div key={p.label} className="flex-1 rounded-lg overflow-hidden" style={{ background: p.bg }}>
                          <div className="aspect-[3/2] flex items-end p-1.5">
                            <div className="text-[7px] text-white/40 font-medium">{p.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Awards */}
                    <div className="flex items-center gap-3 text-[8px] text-white/25">
                      <span className="flex items-center gap-1"><span style={{ color: '#fbbf24' }}>◆</span> AIA Award 2025</span>
                      <span className="flex items-center gap-1"><span style={{ color: '#38bdf8' }}>◆</span> Dezeen Top 50</span>
                      <span className="flex items-center gap-1"><span style={{ color: '#c084fc' }}>◆</span> 15+ Years</span>
                    </div>
                  </div>
                </div>
                <div className="p-4" style={{ background: 'rgba(15,23,42,0.8)' }}>
                  <div className="flex items-center justify-between">
                    <div><h3 className="text-sm font-semibold text-white">Aura Architecture</h3><p className="text-xs text-gray-500">Design Studio</p></div>
                    <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>

            </div>
          </>)}
        </div>
      </section>

      {/* FINAL CTA */}
      <section ref={cta.ref} className="relative z-10 py-24 px-4">
        {cta.inView && (
          <div className="max-w-4xl mx-auto text-center anim-up">
            <div className="relative rounded-3xl p-12 md:p-16 overflow-hidden border border-violet-500/20" style={{ background: 'rgba(15,23,42,0.6)' }}>
              <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.15), transparent 70%)' }} />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
                  Ready to build something<br /><span className="bg-clip-text text-transparent animate-gradient-x" style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa, #818cf8, #c084fc, #a78bfa)' }}>extraordinary?</span>
                </h2>
                <p className="mt-6 text-gray-400 max-w-lg mx-auto text-lg">Join hundreds of businesses who launched their website in minutes, not months.</p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => promptInputRef.current?.focus(), 600); }} className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white transition-all hover:scale-105 animate-pulse-glow" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                    <Sparkles className="h-5 w-5" />Get Started Free<ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <p className="mt-4 text-xs text-gray-600">No credit card required. Start building in 30 seconds.</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Image src="/logo.png" alt="Innovated Marketing" width={844} height={563} className="brightness-0 invert w-auto" style={{ height: '36px' }} />
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/pricing" className="hover:text-gray-400 transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-gray-400 transition-colors">Log In</Link>
            <Link href="/signup" className="hover:text-gray-400 transition-colors">Sign Up</Link>
          </div>
          <p className="text-xs text-gray-700">&copy; 2026 Innovated Marketing. All rights reserved.</p>
        </div>
      </footer>

      {/* SIGNUP MODAL */}
      {showSignupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ animation: 'slide-up 0.3s ease-out' }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => { if (!signupLoading) setShowSignupModal(false); }} />

          {/* Modal card */}
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(30,41,59,0.97), rgba(15,23,42,0.97))',
              border: '1px solid rgba(139,92,246,0.25)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 60px rgba(139,92,246,0.15), 0 25px 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Close button */}
            <button onClick={() => { if (!signupLoading) setShowSignupModal(false); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10">
              <X className="h-5 w-5" />
            </button>

            {/* Header with prompt preview */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Let&apos;s bring your vision to life</h2>
                  <p className="text-xs text-gray-400">Create a free account to start building</p>
                </div>
              </div>
              {/* User's prompt */}
              <div className="rounded-xl p-3 text-sm text-violet-300/90 border border-violet-500/20 italic"
                style={{ background: 'rgba(139,92,246,0.08)' }}>
                &ldquo;{promptText}&rdquo;
              </div>
            </div>

            {/* Error display */}
            {signupError && (
              <div className="rounded-lg px-4 py-3 text-sm text-red-400 mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {signupError}
              </div>
            )}

            {/* Google OAuth */}
            <button onClick={handleGoogleSignup} disabled={signupLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all mb-4 disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            {/* OR divider */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-3 text-gray-500" style={{ background: 'rgb(22,33,52)' }}>or</span>
              </div>
            </div>

            {/* Signup form */}
            <form onSubmit={handleEmailSignupFromModal} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Your name" disabled={signupLoading} autoFocus
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:ring-2 focus:ring-violet-500/50"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(71,85,105,0.4)' }}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@example.com" disabled={signupLoading}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:ring-2 focus:ring-violet-500/50"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(71,85,105,0.4)' }}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Password (min. 6 characters)" disabled={signupLoading}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:ring-2 focus:ring-violet-500/50"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(71,85,105,0.4)' }}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="password" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Confirm password" disabled={signupLoading}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:ring-2 focus:ring-violet-500/50"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(71,85,105,0.4)' }}
                />
              </div>

              <button type="submit" disabled={signupLoading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                {signupLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Creating your site...</>
                ) : (
                  <><Sparkles className="h-4 w-4" />Create Account &amp; Start Building</>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
