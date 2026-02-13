'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  const sidebarContent = (
    <>
      <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Innovated Marketing"
            width={160}
            height={40}
            className="h-8 w-auto dark:invert"
            priority
          />
          <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
            BETA
          </span>
        </div>
        {/* Close button on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-sidebar-foreground/70"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span>Toggle theme</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-sidebar-foreground/70"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button — rendered outside sidebar, positioned by layout */}
      <button
        className="fixed top-3.5 left-3 z-50 flex h-9 w-9 items-center justify-center rounded-md border bg-background shadow-sm md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar — always visible */}
      <div className="hidden md:flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
        {sidebarContent}
      </div>
    </>
  );
}
