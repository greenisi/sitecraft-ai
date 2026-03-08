'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Globe, Sparkles, MessageSquare, Palette, Rocket, Check, Play, Code2, LayoutDashboard, MousePointerClick, Loader2, User, Mail, Lock, X, ShoppingBag, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';

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
  const { user, loading: userLoading } = useUser();
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
        @keyframes mini-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes mini-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes mini-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes mini-grow { 0% { width: 0%; } 100% { width: 100%; } }
        @keyframes mini-fade-slide { 0%, 10% { opacity: 0; transform: translateY(6px); } 15%, 85% { opacity: 1; transform: translateY(0); } 90%, 100% { opacity: 0; transform: translateY(-6px); } }
        @keyframes mini-leaf-sway { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        @keyframes mini-cart-bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes mini-steam { 0% { opacity: 0; transform: translateY(0) scale(0.8); } 50% { opacity: 0.6; } 100% { opacity: 0; transform: translateY(-10px) scale(1.2); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes text-shimmer { 0% { background-position: -200% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes pulse-subtle { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-text-shimmer { animation: text-shimmer 3s ease-in-out infinite; }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
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
                <Link href="/pricing" className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors min-h-[44px] flex items-center">Pricing</Link>
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
      <section ref={hero.ref} className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-32 sm:pt-40 md:pt-48 pb-24">
          <div className="anim-up inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 mb-8" style={{ background: 'rgba(139,92,246,0.08)' }}>
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>
            <span className="text-sm text-gray-300 font-medium">Now in Public Beta</span>
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

                {/* Describe label + Textarea */}
                <div className="relative px-4 sm:px-5">
                  <div className="flex items-center gap-2 pt-3 pb-1">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400/70 animate-pulse-subtle">Describe your vision</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
                  </div>
                  <textarea
                    ref={promptInputRef}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && promptText.trim()) { e.preventDefault(); handlePromptSubmit(); } }}
                    placeholder={placeholderText || 'Describe your dream website...'}
                    rows={3}
                    className="w-full bg-transparent text-white text-base sm:text-lg placeholder-gray-600 py-3 sm:py-4 outline-none resize-none leading-relaxed"
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
                    <span className="hidden sm:inline text-xs font-medium bg-clip-text text-transparent animate-text-shimmer" style={{ backgroundImage: 'linear-gradient(110deg, #6b7280 0%, #a78bfa 45%, #c084fc 55%, #6b7280 100%)', backgroundSize: '200% 100%' }}>Idea → Website in 60s</span>
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

            {/* Big CTA text below composer */}
            <div className="mt-8 sm:mt-10 flex flex-col items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
              <p className="text-lg sm:text-2xl md:text-3xl font-bold text-center leading-snug max-w-xl">
                <span className="text-white">Your website, live in minutes.</span>
                <br />
                <span className="bg-clip-text text-transparent animate-gradient-x" style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa, #818cf8, #c084fc, #a78bfa)' }}>No designers. No developers. No waiting.</span>
              </p>
              <p className="text-sm sm:text-base text-gray-500 text-center max-w-md">Just describe what you want and watch your entire site come to life. Pages, photos, content, and all.</p>
            </div>
          </div>

          {/* Mock browser — premium animated preview */}
          <div className="anim-up-4 mt-10 sm:mt-16 w-full max-w-5xl mx-auto relative">
            <div className="absolute -inset-4 sm:-inset-6 rounded-3xl opacity-50 blur-2xl sm:blur-3xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(59,130,246,0.25), rgba(236,72,153,0.2), rgba(139,92,246,0.3))' }} />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-500/10" style={{ background: 'rgba(15,23,42,0.95)' }}>
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-white/5" style={{ background: 'rgba(15,23,42,0.98)' }}>
                <div className="flex gap-1 sm:gap-1.5"><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" /><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" /><div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80" /></div>
                <div className="flex-1 mx-2 sm:mx-4 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs text-gray-500 font-mono flex items-center gap-1.5 sm:gap-2 truncate" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500/70 flex-shrink-0" />
                  <span className="truncate">bloom-wellness-spa.innovated.site</span>
                </div>
              </div>

              {/* Split view: Chat + Website Preview */}
              <div className="flex flex-row h-[280px] sm:h-[480px]">
                {/* Chat panel */}
                <div className="flex w-[140px] sm:w-[300px] h-auto border-r border-white/5 flex-col flex-shrink-0" style={{ background: 'rgba(8,12,24,0.9)' }}>
                  <div className="px-1.5 sm:px-3 py-1.5 sm:py-2.5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white/80">AI Builder</span>
                      <span className="ml-auto flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" /></span>
                    </div>
                  </div>
                  <div className="flex-1 p-1.5 sm:p-3 space-y-1 sm:space-y-2 overflow-hidden">
                    {/* User message 1 */}
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-br-sm px-3 py-2 text-[11px] text-white/90 leading-relaxed max-w-[90%]" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        Create a luxury wellness spa website with booking, serene visuals, and a calming color palette ✨
                      </div>
                    </div>
                    {/* AI response 1 */}
                    <div className="flex gap-2 items-start">
                      <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] text-gray-300 leading-relaxed" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        Building your spa website with a sage & cream palette, smooth animations, and integrated booking...
                      </div>
                    </div>
                    {/* Suggestion pills */}
                    <div className="hidden sm:flex gap-1.5 pl-7">
                      <div className="rounded-full px-2.5 py-1 text-[9px] text-violet-400/80 border border-violet-500/20 cursor-pointer hover:bg-violet-500/10 transition-colors" style={{ background: 'rgba(139,92,246,0.06)' }}>Add testimonials</div>
                      <div className="rounded-full px-2.5 py-1 text-[9px] text-violet-400/80 border border-violet-500/20 cursor-pointer hover:bg-violet-500/10 transition-colors" style={{ background: 'rgba(139,92,246,0.06)' }}>Change colors</div>
                    </div>
                    {/* User message 2 */}
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-br-sm px-3 py-2 text-[11px] text-white/90 leading-relaxed max-w-[90%]" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        Add a hero section with a &ldquo;Book Now&rdquo; button and show pricing plans
                      </div>
                    </div>
                    {/* AI response 2 */}
                    <div className="flex gap-2 items-start">
                      <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] text-gray-300 leading-relaxed" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        Done! Added a stunning hero with parallax, pricing cards with hover effects, and a smooth booking CTA ✓
                      </div>
                    </div>
                    {/* User message 3 */}
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-br-sm px-3 py-2 text-[11px] text-white/90 leading-relaxed max-w-[90%]" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        Add a services gallery with real photos
                      </div>
                    </div>
                    {/* AI response 3 — typing indicator */}
                    <div className="flex gap-2 items-start">
                      <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm px-3 py-2.5 flex gap-1 items-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60" style={{ animation: 'mini-pulse 1.4s ease-in-out infinite' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60" style={{ animation: 'mini-pulse 1.4s ease-in-out 0.2s infinite' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60" style={{ animation: 'mini-pulse 1.4s ease-in-out 0.4s infinite' }} />
                      </div>
                    </div>
                  </div>
                  {/* Chat input */}
                  <div className="p-2 sm:p-3 border-t border-white/5">
                    <div className="rounded-xl px-3 py-2 sm:py-2.5 text-[10px] sm:text-[11px] text-gray-600 border border-white/[0.08] flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <MessageSquare className="h-3 w-3 flex-shrink-0" />
                      Describe changes...
                    </div>
                  </div>
                </div>

                {/* Website preview — rich spa with real photos */}
                <div className="flex-1 relative overflow-hidden" style={{ background: '#f0f7f4' }}>
                  {/* Nav */}
                  <div className="flex items-center justify-between px-3 sm:px-8 py-2 sm:py-2.5" style={{ background: '#fff', borderBottom: '1px solid #e8efe8' }}>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #86efac, #34d399)' }} />
                      <span className="text-[#2d3c2f] text-[10px] sm:text-sm font-semibold tracking-wide">Bloom Wellness</span>
                    </div>
                    <div className="hidden sm:flex gap-5 text-[10px] text-[#8a9e8f] font-medium tracking-wider uppercase">
                      <span className="text-[#2d3c2f] font-semibold">Home</span><span>Services</span><span>Pricing</span><span>Book</span><span>Contact</span>
                    </div>
                    <div className="px-2 sm:px-3 py-1 rounded-md text-[8px] sm:text-[10px] font-semibold text-white" style={{ background: '#6b9e7a' }}>Book Now</div>
                  </div>

                  {/* Hero with real photo background */}
                  <div className="relative" style={{ height: '55%' }}>
                    <img src="https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1200&q=80" alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(45,60,47,0.85) 0%, rgba(45,60,47,0.6) 40%, rgba(45,60,47,0.2) 70%, transparent)' }} />
                    <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-10" style={{ animation: 'slide-up 0.8s ease-out forwards' }}>
                      <div className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[7px] sm:text-[8px] font-medium text-emerald-300 border border-emerald-400/30 mb-2 sm:mb-3 w-fit" style={{ background: 'rgba(52,211,153,0.15)' }}>
                        <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
                        Now Accepting New Clients
                      </div>
                      <div className="text-lg sm:text-3xl md:text-4xl font-bold text-white mb-1.5 sm:mb-2 tracking-tight leading-tight" style={{ animation: 'slide-up 0.8s ease-out 0.1s forwards', opacity: 0 }}>
                        Find Your Inner<br/><span style={{ color: '#86efac' }}>Balance</span>
                      </div>
                      <div className="text-[9px] sm:text-xs text-white/60 mb-3 sm:mb-4 max-w-[220px] sm:max-w-[260px] leading-relaxed" style={{ animation: 'slide-up 0.8s ease-out 0.2s forwards', opacity: 0 }}>Premium wellness treatments designed to restore, rejuvenate, and transform</div>
                      <div className="flex items-center gap-2" style={{ animation: 'slide-up 0.8s ease-out 0.3s forwards', opacity: 0 }}>
                        <div className="px-3 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20" style={{ background: 'linear-gradient(135deg, #86efac, #34d399)' }}>Book a Session</div>
                        <div className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-medium text-white/80 border border-white/20 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.1)' }}>View Pricing</div>
                      </div>
                    </div>
                  </div>

                  {/* Services cards with real photos */}
                  <div className="px-3 sm:px-6 py-2.5 sm:py-4" style={{ animation: 'slide-up 0.8s ease-out 0.5s forwards', opacity: 0 }}>
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-[9px] sm:text-[10px] font-semibold text-[#2d3c2f] tracking-wide uppercase">Our Services</span>
                      <span className="text-[8px] sm:text-[9px] text-[#6b9e7a] font-medium">View All →</span>
                    </div>
                    <div className="flex gap-1.5 sm:gap-3">
                      {[
                        { src: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80', name: 'Relaxation', price: '$89', tag: '' },
                        { src: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80', name: 'Deep Tissue', price: '$129', tag: 'Popular' },
                        { src: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80', name: 'Hot Stone', price: '$149', tag: '' },
                        { src: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400&q=80', name: 'Aromatherapy', price: '$99', tag: 'New' },
                      ].map((s, i) => (
                        <div key={s.name} className="flex-1 rounded-lg overflow-hidden border border-[#e0ece4] bg-white" style={{ animation: `mini-float 3s ease-in-out infinite ${i * 0.4}s` }}>
                          <div className="relative h-[40px] sm:h-[52px]">
                            <img src={s.src} alt="" className="w-full h-full object-cover" />
                            {s.tag && <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 px-1 sm:px-1.5 py-0.5 rounded text-[6px] sm:text-[7px] font-bold text-white" style={{ background: s.tag === 'Popular' ? '#6b9e7a' : '#3b82f6' }}>{s.tag}</div>}
                          </div>
                          <div className="p-1 sm:p-1.5">
                            <div className="text-[8px] sm:text-[9px] font-semibold text-[#2d3c2f]">{s.name}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] sm:text-[10px] font-bold text-[#6b9e7a]">{s.price}</span>
                              <span className="hidden sm:inline text-[7px] text-[#8a9e8f]">per session</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trust strip */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 sm:gap-4 py-1 sm:py-1.5 text-[7px] sm:text-[8px] text-[#8a9e8f] bg-white border-t border-[#e8efe8]">
                    <span>★★★★★ 4.9 (520+)</span><span className="hidden sm:inline">·</span><span className="hidden sm:inline">📍 Charlotte, NC</span><span>·</span><span style={{ color: '#6b9e7a' }}>● Open Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                { icon: Sparkles, title: 'AI Generation', desc: 'Full multi-page websites built from a simple conversation. Not templates. Truly unique code.', color: '#a855f7' },
                { icon: Code2, title: 'Clean Code Output', desc: 'Export production-ready Next.js + Tailwind CSS code. No vendor lock-in.', color: '#3b82f6' },
                { icon: LayoutDashboard, title: 'Built-in CMS', desc: 'Manage services, blog posts, gallery, reviews, bookings, and more from your dashboard.', color: '#06b6d4' },
                { icon: Globe, title: 'One-Click Publish', desc: 'Go live instantly on a .innovated.site subdomain or connect your own custom domain.', color: '#10b981' },
                { icon: MousePointerClick, title: 'AI Autofill', desc: 'One click fills your entire site with your business data from the CMS. Like magic.', color: '#f59e0b' },
                { icon: Palette, title: 'Full Customization', desc: 'Chat with AI to tweak any part of your site. Colors, layout, copy. Whatever you want.', color: '#ef4444' },
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

              {/* Card 1 — Greenscape Pros (Landscaping) */}
              <div className="group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer">
                <div className="relative aspect-video overflow-hidden">
                  <div className="w-[300%] h-[300%] origin-top-left pointer-events-none" style={{ transform: 'scale(0.333)' }}>
                    <div style={{ width: '100%', height: '100%', position: 'relative', fontFamily: 'system-ui, sans-serif', background: '#0c1a0e', overflow: 'hidden' }}>
                      {/* Full-bleed hero photo */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '72%' }}>
                        <img src="https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1200&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, #0c1a0e, transparent)' }} />
                      </div>
                      {/* Nav */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 32px', background: 'rgba(12,26,14,0.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(34,197,94,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'linear-gradient(135deg, #22c55e, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>🌱</div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Greenscape Pros</span>
                        </div>
                        <div style={{ display: 'flex', gap: '18px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                          <span style={{ color: '#4ade80' }}>Home</span><span>Services</span><span>Portfolio</span><span>About</span><span>Contact</span>
                        </div>
                        <div style={{ padding: '5px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, #22c55e, #15803d)', boxShadow: '0 2px 10px rgba(34,197,94,0.3)' }}>Free Estimate</div>
                      </div>
                      {/* Hero content over photo */}
                      <div style={{ position: 'relative', padding: '18px 32px 0' }}>
                        <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '8px', color: '#4ade80', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)', backdropFilter: 'blur(4px)' }}>⭐ Rated #1 in Charlotte, NC</div>
                        <div style={{ fontSize: '34px', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: '6px', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>Beautiful Lawns,<br/><span style={{ color: '#4ade80' }}>Happy Homes</span></div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '12px', maxWidth: '320px', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>Professional lawn care, landscape design, and outdoor living spaces. Trusted by 2,000+ homeowners.</div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                          <div style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #22c55e, #15803d)', boxShadow: '0 3px 12px rgba(34,197,94,0.35)', position: 'relative', overflow: 'hidden' }}>
                            Get Free Quote →
                            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}><div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'mini-shimmer 3s ease-in-out infinite' }} /></div>
                          </div>
                          <div style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(4px)' }}>Our Work</div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>
                          <span>★★★★★ <span style={{ color: '#4ade80' }}>4.9</span> (520+)</span><span>·</span><span>Licensed & Insured</span><span>·</span><span style={{ animation: 'mini-pulse 2s ease-in-out infinite', color: '#4ade80' }}>● Booking Now</span>
                        </div>
                      </div>
                      {/* Portfolio gallery row with real photos */}
                      <div style={{ position: 'relative', display: 'flex', gap: '5px', padding: '12px 32px 0' }}>
                        {[
                          { src: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400&q=80', label: 'Lawn Care', price: 'From $49' },
                          { src: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80', label: 'Landscaping', price: 'From $299' },
                          { src: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&q=80', label: 'Garden Design', price: 'From $199' },
                          { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80', label: 'Outdoor Living', price: 'From $499' },
                        ].map((s, i) => (
                          <div key={s.label} style={{ flex: 1, borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(34,197,94,0.1)', animation: `mini-float 3s ease-in-out infinite ${i * 0.3}s` }}>
                            <div style={{ height: '48px', position: 'relative', overflow: 'hidden' }}>
                              <img src={s.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                            </div>
                            <div style={{ padding: '4px 6px', background: 'rgba(12,26,14,0.9)' }}>
                              <div style={{ fontSize: '9px', color: '#fff', fontWeight: 600 }}>{s.label}</div>
                              <div style={{ fontSize: '9px', fontWeight: 700, color: '#4ade80' }}>{s.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Bottom trust bar */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '7px 0', fontSize: '8px', color: 'rgba(255,255,255,0.3)', background: 'linear-gradient(to top, rgba(12,26,14,0.95), rgba(12,26,14,0.6))' }}>
                        <span>📍 Charlotte, NC</span><span>·</span><span>2,000+ Happy Clients</span><span>·</span><span>Same Week Service</span><span>·</span><span>Free Estimates</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4" style={{ background: 'rgba(15,23,42,0.8)' }}>
                  <div className="flex items-center justify-between">
                    <div><h3 className="text-sm font-semibold text-white">Greenscape Pros</h3><p className="text-xs text-gray-500">Landscaping · Charlotte, NC</p></div>
                    <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>

              {/* Card 2 — LUXE Collective (E-commerce Lifestyle) */}
              <div className="group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer">
                <div className="relative aspect-video overflow-hidden">
                  <div className="w-[300%] h-[300%] origin-top-left pointer-events-none" style={{ transform: 'scale(0.333)' }}>
                    <div style={{ width: '100%', height: '100%', position: 'relative', fontFamily: 'system-ui, sans-serif', background: '#faf8f5', overflow: 'hidden' }}>
                      {/* Nav */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 32px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: '#111' }}>LUXE</span>
                          <span style={{ fontSize: '10px', fontWeight: 400, color: '#999', letterSpacing: '0.1em' }}>COLLECTIVE</span>
                        </div>
                        <div style={{ display: 'flex', gap: '18px', fontSize: '11px', color: '#888', fontWeight: 500 }}>
                          <span style={{ color: '#111', fontWeight: 600 }}>Shop</span><span>New Arrivals</span><span>Bestsellers</span><span>Gifts</span><span style={{ color: '#dc2626' }}>Sale</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#666' }}>
                          <span>🔍</span>
                          <span>👤</span>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span>🛒</span>
                            <div style={{ position: 'absolute', top: '-4px', right: '-6px', width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: '#fff', animation: 'mini-cart-bounce 2s ease-in-out infinite' }}>3</div>
                          </div>
                        </div>
                      </div>
                      {/* Promo banner */}
                      <div style={{ textAlign: 'center', padding: '5px 0', fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em', color: '#fff', background: 'linear-gradient(90deg, #111 0%, #2a2a2a 50%, #111 100%)', position: 'relative', overflow: 'hidden' }}>
                        <span style={{ position: 'relative', zIndex: 1 }}>🔥 SUMMER SALE | UP TO 40% OFF | FREE SHIPPING OVER $75</span>
                        <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'mini-shimmer 5s ease-in-out infinite' }} />
                      </div>
                      {/* Hero split with real photos */}
                      <div style={{ display: 'flex', height: 'calc(100% - 78px)' }}>
                        {/* Left — featured product with real photo */}
                        <div style={{ width: '45%', position: 'relative', overflow: 'hidden' }}>
                          <img src="https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=600&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {/* Tag */}
                          <div style={{ position: 'absolute', top: '8px', left: '8px', padding: '3px 8px', borderRadius: '4px', fontSize: '7px', fontWeight: 700, color: '#fff', background: '#111', letterSpacing: '0.05em' }}>FEATURED</div>
                          {/* Bottom info overlay */}
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 10px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)' }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#fff' }}>Artisan Candle Set</div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>$68</span>
                              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>$95</span>
                              <span style={{ fontSize: '7px', fontWeight: 600, color: '#fbbf24', padding: '1px 4px', borderRadius: '2px', background: 'rgba(251,191,36,0.2)' }}>-28%</span>
                            </div>
                          </div>
                        </div>
                        {/* Right — product grid with real photos */}
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '4px' }}>
                          {[
                            { src: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&q=80', label: 'Leather Tote', price: '$128', oldPrice: '$175', tag: 'Bestseller', rating: '4.8' },
                            { src: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400&q=80', label: 'Ceramic Vase', price: '$42', oldPrice: '', tag: 'New', rating: '4.9' },
                            { src: 'https://images.unsplash.com/photo-1629949009765-40fc74c9ec21?w=400&q=80', label: 'Linen Throw', price: '$86', oldPrice: '$120', tag: '-28%', rating: '4.7' },
                            { src: 'https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?w=400&q=80', label: 'Woven Basket', price: '$54', oldPrice: '', tag: '', rating: '4.6' },
                          ].map((item, idx) => (
                            <div key={item.label} style={{ borderRadius: '5px', overflow: 'hidden', position: 'relative', background: '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
                              <div style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden' }}>
                                <img src={item.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {item.tag && <div style={{ position: 'absolute', top: '4px', left: '4px', padding: '1px 5px', borderRadius: '2px', fontSize: '7px', fontWeight: 700, color: item.tag.startsWith('-') ? '#fff' : '#fff', background: item.tag.startsWith('-') ? '#ef4444' : '#111' }}>{item.tag}</div>}
                                <div style={{ position: 'absolute', top: '4px', right: '4px', width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>♡</div>
                              </div>
                              <div style={{ padding: '4px 5px' }}>
                                <div style={{ fontSize: '8px', fontWeight: 600, color: '#333' }}>{item.label}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#111' }}>{item.price}</span>
                                  {item.oldPrice && <span style={{ fontSize: '7px', color: '#bbb', textDecoration: 'line-through' }}>{item.oldPrice}</span>}
                                </div>
                                <div style={{ fontSize: '7px', color: '#f59e0b' }}>{'★'.repeat(5)} <span style={{ color: '#bbb' }}>{item.rating}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Trust bar */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', padding: '5px 0', fontSize: '8px', color: '#999', background: '#fff', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <span>🚚 Free Shipping</span><span>↩️ 30-Day Returns</span><span>🔒 Secure Checkout</span><span>⭐ 12K+ Reviews</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4" style={{ background: 'rgba(15,23,42,0.8)' }}>
                  <div className="flex items-center justify-between">
                    <div><h3 className="text-sm font-semibold text-white">LUXE Collective</h3><p className="text-xs text-gray-500">E-commerce · Lifestyle</p></div>
                    <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>

              {/* Card 3 — Bella Cucina (Italian Restaurant) — SPLIT LAYOUT: text left, photo mosaic right */}
              <div className="group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer">
                <div className="relative aspect-video overflow-hidden">
                  <div className="w-[300%] h-[300%] origin-top-left pointer-events-none" style={{ transform: 'scale(0.333)' }}>
                    <div style={{ width: '100%', height: '100%', position: 'relative', fontFamily: 'Georgia, serif', background: '#faf6f0', overflow: 'hidden' }}>
                      {/* Nav — warm cream/elegant */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 32px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>🍷</span>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#2c1810', fontStyle: 'italic', letterSpacing: '0.02em' }}>Bella Cucina</div>
                            <div style={{ fontSize: '6px', color: '#a08060', textTransform: 'uppercase', letterSpacing: '0.25em', fontFamily: 'system-ui, sans-serif' }}>Ristorante Italiano · Est. 2018</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '18px', fontSize: '11px', color: '#999', fontWeight: 500, fontFamily: 'system-ui, sans-serif' }}>
                          <span style={{ color: '#2c1810', fontWeight: 600 }}>Home</span><span>Menu</span><span>Reservations</span><span>Events</span><span>Gallery</span>
                        </div>
                        <div style={{ padding: '5px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#fff', background: '#2c1810', boxShadow: '0 2px 8px rgba(44,24,16,0.2)', fontFamily: 'system-ui, sans-serif' }}>Reserve Table</div>
                      </div>
                      {/* Split hero: text left, photo mosaic right */}
                      <div style={{ display: 'flex', height: 'calc(100% - 42px)' }}>
                        {/* Left — elegant text content */}
                        <div style={{ width: '42%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px 0 32px' }}>
                          <div style={{ fontSize: '8px', color: '#b45309', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px', fontFamily: 'system-ui, sans-serif' }}>✦ Nashville, TN</div>
                          <div style={{ fontSize: '34px', fontWeight: 700, color: '#2c1810', lineHeight: 1.1, marginBottom: '8px', fontStyle: 'italic' }}>A Taste of<br/><span style={{ color: '#b45309' }}>Italy</span></div>
                          <div style={{ fontSize: '11px', color: '#8a7a6a', lineHeight: 1.6, marginBottom: '14px', fontFamily: 'system-ui, sans-serif' }}>Hand-made pasta, wood-fired pizza, and fine wines in an intimate downtown setting.</div>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                            <div style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, color: '#fff', background: '#2c1810', fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
                              Reserve a Table →
                              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}><div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', animation: 'mini-shimmer 3s ease-in-out infinite' }} /></div>
                            </div>
                            <div style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '10px', color: '#8a7a6a', border: '1px solid #ddd', fontFamily: 'system-ui, sans-serif' }}>Our Menu</div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '9px', color: '#aaa', fontFamily: 'system-ui, sans-serif' }}>
                            <span style={{ color: '#f59e0b' }}>★★★★★</span> <span>4.8 (1,200+)</span>
                          </div>
                          {/* Hours card */}
                          <div style={{ marginTop: '12px', padding: '8px 10px', borderRadius: '6px', background: 'rgba(44,24,16,0.04)', border: '1px solid rgba(44,24,16,0.08)', fontFamily: 'system-ui, sans-serif' }}>
                            <div style={{ fontSize: '8px', fontWeight: 600, color: '#2c1810', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Hours</div>
                            <div style={{ fontSize: '8px', color: '#8a7a6a', lineHeight: 1.5 }}>Tue–Thu 5–10pm · Fri–Sat 5–11pm · Sun 4–9pm</div>
                            <div style={{ fontSize: '8px', color: '#22c55e', fontWeight: 600, marginTop: '2px', animation: 'mini-pulse 2s ease-in-out infinite' }}>● Open Tonight</div>
                          </div>
                        </div>
                        {/* Right — photo mosaic grid */}
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1.2fr 0.8fr 0.8fr', gap: '3px', padding: '6px 6px 6px 0' }}>
                          {/* Large hero food photo spanning 2 cols */}
                          <div style={{ gridColumn: '1 / -1', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                            <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
                              <div style={{ fontSize: '10px', fontWeight: 600, color: '#fff', fontFamily: 'system-ui' }}>Chef&apos;s Tasting Menu</div>
                              <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)', fontFamily: 'system-ui' }}>5-course seasonal experience · $85/person</div>
                            </div>
                          </div>
                          {/* 4 smaller food photos */}
                          {[
                            { src: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80', name: 'Truffle Risotto', price: '$28' },
                            { src: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', name: 'Margherita DOP', price: '$22' },
                            { src: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', name: 'Osso Buco', price: '$38' },
                            { src: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80', name: 'Tiramisu', price: '$14' },
                          ].map((item) => (
                            <div key={item.name} style={{ borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                              <img src={item.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 6px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                                <div style={{ fontSize: '8px', fontWeight: 600, color: '#fff', fontFamily: 'system-ui' }}>{item.name}</div>
                                <div style={{ fontSize: '8px', fontWeight: 700, color: '#fbbf24', fontFamily: 'system-ui' }}>{item.price}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Bottom bar */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '6px 0', fontSize: '8px', color: '#bbb', background: '#fff', borderTop: '1px solid rgba(0,0,0,0.05)', fontFamily: 'system-ui, sans-serif' }}>
                        <span>📍 Downtown Nashville</span><span>·</span><span>📞 (615) 555-0142</span><span>·</span><span>Private Dining Available</span><span>·</span><span>🍷 Full Bar</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4" style={{ background: 'rgba(15,23,42,0.8)' }}>
                  <div className="flex items-center justify-between">
                    <div><h3 className="text-sm font-semibold text-white">Bella Cucina</h3><p className="text-xs text-gray-500">Restaurant · Nashville, TN</p></div>
                    <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
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
                  {user ? (
                    <Link href="/dashboard" className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white transition-all hover:scale-105 animate-pulse-glow" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                      <LayoutDashboard className="h-5 w-5" />Go to Dashboard<ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => promptInputRef.current?.focus(), 600); }} className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white transition-all hover:scale-105 animate-pulse-glow" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                      <Sparkles className="h-5 w-5" />Get Started<ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
                <p className="mt-4 text-xs text-gray-600">{user ? 'Welcome back! Your projects are waiting.' : 'No credit card required. Start building in 30 seconds.'}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
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
