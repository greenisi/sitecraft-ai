'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ChevronDown,
  CreditCard,
  Gift,
  Globe,
  GraduationCap,
  Inbox,
  LayoutGrid,
  LogOut,
  Settings,
  Sparkles,
  User,
  WalletCards,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/use-user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const secondaryLinks = [
  { label: 'Workspace', href: '/dashboard', icon: Inbox, workspace: true },
  { label: 'Academy', href: '/academy', icon: GraduationCap },
  { label: 'Domains', href: '/domains', icon: Globe },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Affiliates', href: '/affiliates', icon: Gift },
  { label: 'Report an issue', href: '/issues', icon: AlertCircle },
];

export function SpaceNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [credits, setCredits] = useState(0);
  const [lastProjectId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('lastProjectId');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!user) return;
    createClient()
      .from('profiles')
      .select('generation_credits')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setCredits(data?.generation_credits || 0));
  }, [user]);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.refresh();
    router.push('/login');
  };

  const workspaceHref = lastProjectId ? `/projects/${lastProjectId}/workspace` : '/dashboard';
  const pageTitle = pathname.startsWith('/cards')
    ? 'Business Cards'
    : pathname.startsWith('/settings')
      ? 'Account'
      : 'Websites';
  const primaryLinks = [
    { label: 'Websites', href: '/dashboard', icon: LayoutGrid, active: pathname === '/dashboard' || pathname.startsWith('/projects') },
    { label: 'Cards', href: '/cards', icon: WalletCards, active: pathname.startsWith('/cards') },
  ];

  return (
    <>
      <header className="premium-nav sticky top-0 z-30 border-b border-white/[0.07] bg-[#080c15]/88 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-8 lg:px-12">
          <Link href="/dashboard" className="flex items-center gap-2.5 text-white" aria-label="Sitecraft home">
            <span className="brand-gem flex h-9 w-9 items-center justify-center rounded-xl">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <span className="hidden text-base font-semibold tracking-[-0.02em] sm:inline">Sitecraft</span>
            <span className="text-sm font-semibold sm:hidden">{pageTitle}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {primaryLinks.map(({ label, href, active }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${active ? 'bg-white/10 text-white' : 'text-white/45 hover:bg-white/[0.05] hover:text-white'}`}
              >
                {label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium text-white/45 transition hover:bg-white/[0.05] hover:text-white">
                  More <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-52 border-gray-800 bg-gray-950 text-gray-200">
                {secondaryLinks.map(({ label, href, icon: Icon, workspace }) => (
                  <DropdownMenuItem key={label} onSelect={() => router.push(workspace ? workspaceHref : href)} className="cursor-pointer focus:bg-white/5 focus:text-white">
                    <Icon className="h-4 w-4 text-gray-400" /> {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-2">
            {credits > 0 && (
              <div className="hidden items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300 sm:flex">
                <Sparkles className="h-3 w-3" />
                <span>{credits >= 999999 ? '\u221e' : credits}</span>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/65 transition hover:bg-white/10 hover:text-white" aria-label="Account menu">
                  <User className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 border-gray-800 bg-gray-950 text-gray-200">
                {user?.email && (
                  <>
                    <DropdownMenuLabel className="truncate text-xs font-normal text-gray-500">{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-800" />
                  </>
                )}
                <DropdownMenuItem onSelect={() => router.push('/settings')} className="cursor-pointer focus:bg-white/5 focus:text-white">
                  <Settings className="h-4 w-4 text-gray-400" /> Account
                </DropdownMenuItem>
                <div className="md:hidden">
                  <DropdownMenuSeparator className="bg-gray-800" />
                  {secondaryLinks.map(({ label, href, icon: Icon, workspace }) => (
                    <DropdownMenuItem key={label} onSelect={() => router.push(workspace ? workspaceHref : href)} className="cursor-pointer focus:bg-white/5 focus:text-white">
                      <Icon className="h-4 w-4 text-gray-400" /> {label}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300">
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <nav className="premium-mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#080c14]/92 px-3 pb-[max(.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl md:hidden" aria-label="Mobile navigation">
        <div className="mx-auto grid max-w-sm grid-cols-3">
          {primaryLinks.map(({ label, href, icon: Icon, active }) => (
            <Link key={href} href={href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium ${active ? 'text-violet-300' : 'text-white/40'}`}>
              <Icon className="h-5 w-5" /> {label}
            </Link>
          ))}
          <Link href="/settings" className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium ${pathname.startsWith('/settings') ? 'text-violet-300' : 'text-white/40'}`}>
            <Settings className="h-5 w-5" /> Account
          </Link>
        </div>
      </nav>
    </>
  );
}
