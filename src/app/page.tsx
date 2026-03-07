'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Globe, Sparkles, MessageSquare, Palette, Rocket, Check, Play, Code2, LayoutDashboard, MousePointerClick, Loader2, User, Mail, Lock, X } from 'lucide-react';
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

const PLACEHOLDER_PROMPTS = [
  'Build me a modern coffee shop website with online ordering...',
  'Create a dental practice site with appointment booking...',
  'Design a yoga studio page with class schedules...',
  'Make a real estate site with property listings...',
  'Build a restaurant website with a menu and reservations...',
  'Create an e-commerce store for handmade jewelry...',
];

export default function HomePage() {
  const hero = useInView(0.1);
  const features = useInView();
  const howItWorks = useInView();
  const stats = useInView();
  const showcase = useInView();
  const cta = useInView();

  // Prompt bar state
  const [promptText, setPromptText] = useState('');
  const promptInputRef = useRef<HTMLInputElement>(null);
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

  // Rotating placeholder effect
  useEffect(() => {
    if (promptText) return;
    const word = PLACEHOLDER_PROMPTS[placeholderIndex];
    const speed = isPlaceholderDeleting ? 30 : 50;
    if (!isPlaceholderDeleting && placeholderText === word) {
      const t = setTimeout(() => setIsPlaceholderDeleting(true), 2500);
      return () => clearTimeout(t);
    }
    if (isPlaceholderDeleting && placeholderText === '') {
      setIsPlaceholderDeleting(false);
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_PROMPTS.length);
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
  }, [placeholderText, isPlaceholderDeleting, placeholderIndex, promptText]);

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
        {hero.inView && (<>
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

          {/* PROMPT BAR */}
          <div className="anim-up-4 mt-10 w-full max-w-2xl mx-auto">
            <div className="relative">
              {/* Outer ambient glow */}
              <div className="absolute -inset-1.5 rounded-2xl animate-glow-shift"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(99,102,241,0.3), rgba(236,72,153,0.3), rgba(139,92,246,0.4))' }}
              />
              {/* Inner edge glow */}
              <div className="absolute -inset-0.5 rounded-2xl animate-glow-pulse"
                style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.5), rgba(129,140,248,0.4), rgba(192,132,252,0.4))' }}
              />

              {/* The input bar */}
              <div className="relative flex items-center rounded-2xl border border-white/[0.12] overflow-hidden"
                style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)' }}
              >
                <Sparkles className="h-5 w-5 text-violet-400 ml-4 sm:ml-5 flex-shrink-0" />
                <input
                  ref={promptInputRef}
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && promptText.trim()) handlePromptSubmit(); }}
                  placeholder={placeholderText || 'Describe your dream website...'}
                  className="flex-1 bg-transparent text-white text-sm sm:text-base placeholder-gray-500 px-3 sm:px-4 py-4 sm:py-5 outline-none min-w-0"
                />
                <button
                  onClick={handlePromptSubmit}
                  disabled={!promptText.trim()}
                  className="flex-shrink-0 mr-2 sm:mr-3 p-2.5 sm:p-3 rounded-xl text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  style={{ background: promptText.trim() ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(255,255,255,0.05)' }}
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* See How It Works link */}
            <div className="mt-5 flex items-center justify-center gap-6">
              <Link href="#how-it-works" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors">
                <Play className="h-3.5 w-3.5" />See How It Works
              </Link>
              <span className="text-gray-700">•</span>
              <span className="text-xs text-gray-600">No credit card required</span>
            </div>
          </div>

          {/* Mock browser */}
          <div className="anim-up-4 mt-16 w-full max-w-5xl mx-auto relative">
            <div className="absolute -inset-4 rounded-3xl opacity-40 blur-2xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2), rgba(236,72,153,0.2))' }} />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ background: 'rgba(15,23,42,0.9)' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5" style={{ background: 'rgba(15,23,42,0.95)' }}>
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/70" /><div className="w-3 h-3 rounded-full bg-yellow-500/70" /><div className="w-3 h-3 rounded-full bg-green-500/70" /></div>
                <div className="flex-1 mx-4 px-4 py-1.5 rounded-lg text-xs text-gray-500 font-mono" style={{ background: 'rgba(0,0,0,0.3)' }}>app.innovated.marketing</div>
              </div>
              <div className="flex h-[340px] sm:h-[420px]">
                <div className="w-1/3 border-r border-white/5 p-4 flex flex-col gap-3">
                  <div className="rounded-xl p-3 text-xs text-left text-white/80" style={{ background: 'rgba(139,92,246,0.15)' }}>Build me a modern coffee shop website with an earthy vibe...</div>
                  <div className="rounded-xl p-3 text-xs text-left text-gray-400" style={{ background: 'rgba(255,255,255,0.05)' }}><span className="text-green-400 font-medium">AI:</span> Creating a warm design with brown tones and organic textures...</div>
                  <div className="mt-auto rounded-xl p-3 text-xs text-gray-500 border border-white/10">Describe changes...</div>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #2d1b0e 0%, #1a0f08 100%)' }}>
                    <div className="flex items-center justify-between px-6 py-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <span className="text-white/80 text-sm font-medium">Coffeland</span>
                      <div className="flex gap-4 text-[10px] text-white/50"><span>Home</span><span>Menu</span><span>About</span><span>Contact</span></div>
                    </div>
                    <div className="flex flex-col items-center justify-center h-[calc(100%-48px)] text-center px-8">
                      <div className="text-2xl sm:text-4xl font-bold text-white/90 mb-2">Crafted with Passion</div>
                      <div className="text-xs sm:text-sm text-white/50 mb-4">Premium coffee roasted daily</div>
                      <div className="px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ background: 'linear-gradient(135deg, #92400e, #b45309)' }}>Shop Now</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>)}
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
              {[
                { name: 'Rose Garden Florist', type: 'Local Service', url: 'https://flower-shop-mlymbev2.innovated.site', color: '#ec4899' },
                { name: 'Mountain View Yoga', type: 'Business', url: 'https://mountain-view-yoga-studio-mlzflu2f.innovated.site', color: '#f97316' },
                { name: 'Luxe Dental Studio', type: 'Local Service', url: 'https://luxe-dental-studio-mm5biqdm.innovated.site', color: '#6366f1' },
              ].map((site) => (
                <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer" className="group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.15] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-violet-500/10">
                  <div className="aspect-[16/10] relative overflow-hidden" style={{ background: '#0f172a' }}>
                    <iframe src={site.url} className="w-[300%] h-[300%] origin-top-left border-0 pointer-events-none" style={{ transform: 'scale(0.333)' }} loading="lazy" tabIndex={-1} />
                  </div>
                  <div className="p-4" style={{ background: 'rgba(15,23,42,0.8)' }}>
                    <div className="flex items-center justify-between">
                      <div><h3 className="text-sm font-semibold text-white">{site.name}</h3><p className="text-xs text-gray-500">{site.type}</p></div>
                      <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </a>
              ))}
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
