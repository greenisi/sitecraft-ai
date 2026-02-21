'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Sparkles, Menu, X, LayoutGrid, CreditCard, Settings, HelpCircle, User } from 'lucide-react';
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

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
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
      <header className="relative z-20 flex items-center justify-between px-4 md:px-8 lg:px-12 py-4">
        {/* Left side: hamburger + logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger - mobile only */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Logo */}
          <a href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Innovated Marketing"
              width={160}
              height={40}
              className="brightness-0 invert h-8 w-auto"
              priority
            />
          </a>
        </div>

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

      {/* Mobile slide-out menu */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[280px] flex flex-col transition-transform duration-300 ease-out md:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #0d1117 0%, #111827 100%)',
          borderRight: '1px solid rgba(71,85,105,0.3)',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(71,85,105,0.2)' }}>
          <Image
            src="/logo.png"
            alt="Innovated Marketing"
            width={140}
            height={35}
            className="brightness-0 invert h-7 w-auto"
          />
          <button
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Plan & credits */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(71,85,105,0.2)' }}>
          <div className="flex items-center gap-2">
            {plan !== 'free' && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
              >
                <Sparkles className="h-3 w-3" />
                {plan === 'pro' ? 'Pro' : 'Beta Pro'}
              </span>
            )}
            {plan === 'free' && (
              <span className="text-xs font-medium text-gray-500">Free Plan</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-amber-400 font-medium tabular-nums">{credits >= 999999 ? '\u221e' : credits}</span>
            <span className="text-gray-500">credits</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">
            Navigation
          </div>
          <button
            onClick={() => navTo('/dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Projects
          </button>
          <button
            onClick={() => navTo('/pricing')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/pricing')
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Pricing
          </button>
          <button
            onClick={() => navTo('/settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/settings')
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </nav>

        {/* User section at bottom */}
        <div className="mt-auto" style={{ borderTop: '1px solid rgba(71,85,105,0.2)' }}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
          {user && (
            <div className="flex items-center gap-3 px-6 py-3" style={{ borderTop: '1px solid rgba(71,85,105,0.15)' }}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: 'rgba(139,92,246,0.2)' }}>
                <User className="h-4 w-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.email}</p>
                <p className="text-xs text-gray-500">{plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Beta Pro'} Plan</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
