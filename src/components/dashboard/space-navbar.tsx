'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';
import Image from 'next/image';

export function SpaceNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [credits, setCredits] = useState<number>(0);
  const [plan, setPlan] = useState('free');

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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="relative z-20 flex items-center justify-between px-4 md:px-8 lg:px-12 py-4">
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

      {/* Right nav */}
      <nav className="flex items-center gap-1 md:gap-2">
        {/* Credits badge - shown on projects page */}
        {credits > 0 && (
          <div className="hidden md:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-amber-400" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Sparkles className="h-3 w-3" />
            <span className="tabular-nums">{credits >= 999999 ? '\u221e' : credits}</span>
          </div>
        )}

        {/* Plan badge */}
        {plan !== 'free' && (
          <div className="hidden md:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
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
          href="/settings"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isActive('/settings')
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
          <span className="hidden sm:inline">Logout</span>
        </button>
      </nav>
    </header>
  );
}
