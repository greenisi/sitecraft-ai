'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Shield,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Templates', href: '/templates', icon: Sparkles, badge: 'NEW' },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role === 'admin') setIsAdmin(true);
    };
    checkAdmin();
  }, []);

  const navigation = isAdmin
    ? [...baseNavigation, { name: 'Admin', href: '/admin', icon: Shield }]
    : baseNavigation;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground leading-none">Innovated</span>
          <span className="text-[10px] text-sidebar-foreground/50 leading-none mt-0.5">Marketing</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 ml-auto md:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-1">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Menu
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const badge = 'badge' in item ? item.badge : null;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive
                      ? 'text-violet-400'
                      : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60'
                  )}
                />
                <span className="flex-1">{item.name}</span>
                {badge && (
                  <span className="text-[9px] font-bold bg-violet-500 text-white px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="h-3 w-3 text-sidebar-foreground/30" />
                )}
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* Bottom actions */}
      <div className="border-t border-sidebar-border/50 p-3 space-y-0.5">
        <button
          className="relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span>Toggle theme</span>
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-400"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-3 left-3 z-50 flex h-10 w-10 items-center justify-center rounded-xl border bg-background shadow-lg md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-sidebar transition-transform duration-300 ease-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full w-[240px] flex-col bg-sidebar flex-shrink-0">
        {sidebarContent}
      </div>
    </>
  );
}
