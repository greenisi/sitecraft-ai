'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Sparkles, Menu, X, LayoutGrid, CreditCard, Settings, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';
import Image from 'next/image';

export function SpaceNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [credits, setCredits] = useState<number>(0);
  const [plan, setPlan] = useState('free');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const supabase = createClient();
      supabase
        .from('profiles')
        .select('generation_credits, plan')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCredits(data.generation_credits);
            setPlan(data.plan);
          }
        });
    }
  }, [user]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  const navTo = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* ===== TOP HEADER ===== */}
      <header className="relative z-20 flex items-center justify-between px-4 md:px-8 lg:px-12 py-4">
        {/* Logo - bigger on mobile */}
        <a href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Innovated Marketing"
            width={200}
            height={50}
            className="brightness-0 invert w-auto"
            style={{ height: 'clamp(36px, 5vw, 44px)' }}
            priority
          />
        </a>

        {/* Desktop nav - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1 md:gap-2">
          {credits > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-amber-400"
              style={{ background: 'rgba(245,158,11,0.1)' }}
            >
              <Sparkles className="h-3 w-3" />
              <span className="tabular-nums">{credits >= 999999 ? '\u221e' : credits}</span>
            </div>
          )}
          {plan !== 'free' && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
            >
              <Sparkles className="h-3 w-3" />
              {plan === 'pro' ? 'Pro' : 'Beta Pro'}
            </div>
          )}
          <a
            href="/dashboard"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Projects
          </a>
          <a
            href="/pricing"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/pricing')
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Pricing
          </a>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </nav>
      </header>

      {/* ===== FLOATING HAMBURGER BUTTON — mobile only, bottom-left ===== */}
      <button
        onClick={() => setMenuOpen(true)}
        className="md:hidden fixed bottom-6 left-5 z-40 flex items-center justify-center w-13 h-13 rounded-2xl shadow-2xl transition-all duration-200 active:scale-95"
        style={{
          width: '52px',
          height: '52px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.9) 0%, rgba(109,40,217,0.9) 100%)',
          boxShadow: '0 8px 32px rgba(139,92,246,0.4), 0 2px 8px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(167,139,250,0.3)',
        }}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* ===== BACKDROP ===== */}
      <div
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* ===== SLIDE-OUT DRAWER ===== */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[290px] flex flex-col transition-transform duration-300 ease-out md:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0a0d14 0%, #0d1117 50%, #111827 100%)',
          borderRight: '1px solid rgba(71,85,105,0.25)',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(71,85,105,0.2)' }}
        >
          <Image
            src="/logo.png"
            alt="Innovated Marketing"
            width={160}
            height={40}
            className="brightness-0 invert h-8 w-auto"
          />
          <button
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Plan & credits strip */}
        <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(71,85,105,0.15)' }}>
          {plan !== 'free' ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: 'rgba(139,92,246,0.18)', color: '#c4b5fd' }}
            >
              <Sparkles className="h-3 w-3" />
              {plan === 'pro' ? 'Pro' : 'Beta Pro'}
            </span>
          ) : (
            <span className="text-xs text-gray-500 font-medium">Free Plan</span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-amber-400 font-semibold text-sm tabular-nums">
              {credits >= 999999 ? '\u221e' : credits}
            </span>
            <span className="text-gray-500 text-xs">credits</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 px-3 pb-2">
            Menu
          </p>
          <button
            onClick={() => navTo('/dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive('/dashboard')
                ? 'text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={isActive('/dashboard') ? { background: 'rgba(139,92,246,0.15)', color: '#e2d9f3' } : {}}
          >
            <LayoutGrid className={`h-4 w-4 ${isActive('/dashboard') ? 'text-purple-400' : ''}`} />
            Projects
          </button>
          <button
            onClick={() => navTo('/pricing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive('/pricing')
                ? 'text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={isActive('/pricing') ? { background: 'rgba(139,92,246,0.15)', color: '#e2d9f3' } : {}}
          >
            <CreditCard className={`h-4 w-4 ${isActive('/pricing') ? 'text-purple-400' : ''}`} />
            Pricing
          </button>
          <button
            onClick={() => navTo('/settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive('/settings')
                ? 'text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={isActive('/settings') ? { background: 'rgba(139,92,246,0.15)', color: '#e2d9f3' } : {}}
          >
            <Settings className={`h-4 w-4 ${isActive('/settings') ? 'text-purple-400' : ''}`} />
            Settings
          </button>
        </nav>

        {/* Bottom: sign out + user info */}
        <div style={{ borderTop: '1px solid rgba(71,85,105,0.2)' }}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
          {user && (
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderTop: '1px solid rgba(71,85,105,0.12)' }}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
                style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}
              >
                <User className="h-4 w-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.email}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Beta Pro'} Plan
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
