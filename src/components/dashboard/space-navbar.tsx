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

  // iOS tab bars fill the active glyph and outline the rest. Carrying that
  // over is most of what separates a native tab bar from a web nav.
  const tabs = [
    ...primaryLinks,
    { label: 'Account', href: '/settings', icon: User, active: pathname.startsWith('/settings') },
  ];

  return (
    <>
      <header className="ios-navbar sticky top-0 z-30">
        <div className="mx-auto flex h-[52px] max-w-[1600px] items-center justify-between px-4 md:h-16 md:px-8 lg:px-12">
          <Link href="/dashboard" className="flex items-center gap-2.5 text-[color:var(--label)]" aria-label="Sitecraft home">
            <span className="brand-gem flex h-8 w-8 items-center justify-center rounded-[10px] md:h-9 md:w-9 md:rounded-xl">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="hidden text-base font-semibold tracking-[-0.02em] sm:inline">Sitecraft</span>
            {/* On phones the brand slot carries the screen title, the way a
                native navigation bar does. */}
            <span className="text-[17px] font-semibold tracking-[-0.02em] sm:hidden">{pageTitle}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {primaryLinks.map(({ label, href, active }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${active ? 'bg-white/[0.08] text-[color:var(--label)]' : 'text-[color:var(--label-2)] hover:bg-white/[0.05] hover:text-[color:var(--label)]'}`}
              >
                {label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium text-[color:var(--label-2)] transition hover:bg-white/[0.05] hover:text-[color:var(--label)]">
                  More <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-52 border-[color:var(--hairline-strong)] bg-[color:var(--surface-2)] text-[color:var(--label)]">
                {secondaryLinks.map(({ label, href, icon: Icon, workspace }) => (
                  <DropdownMenuItem key={label} onSelect={() => router.push(workspace ? workspaceHref : href)} className="cursor-pointer focus:bg-white/5 focus:text-white">
                    <Icon className="h-4 w-4 text-[color:var(--label-2)]" /> {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-2">
            {credits > 0 && (
              <div className="hidden items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-[color:var(--label-2)] sm:flex">
                <Sparkles className="h-3 w-3" />
                <span>{credits >= 999999 ? '∞' : credits}</span>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--hairline-strong)] bg-white/[0.05] text-[color:var(--label-2)] transition active:scale-95 md:h-10 md:w-10" aria-label="Account menu">
                  <User className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 border-[color:var(--hairline-strong)] bg-[color:var(--surface-2)] text-[color:var(--label)]">
                {user?.email && (
                  <>
                    <DropdownMenuLabel className="truncate text-xs font-normal text-[color:var(--label-3)]">{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[color:var(--hairline)]" />
                  </>
                )}
                <DropdownMenuItem onSelect={() => router.push('/settings')} className="cursor-pointer focus:bg-white/5 focus:text-white">
                  <Settings className="h-4 w-4 text-[color:var(--label-2)]" /> Account
                </DropdownMenuItem>
                <div className="md:hidden">
                  <DropdownMenuSeparator className="bg-[color:var(--hairline)]" />
                  {secondaryLinks.map(({ label, href, icon: Icon, workspace }) => (
                    <DropdownMenuItem key={label} onSelect={() => router.push(workspace ? workspaceHref : href)} className="cursor-pointer focus:bg-white/5 focus:text-white">
                      <Icon className="h-4 w-4 text-[color:var(--label-2)]" /> {label}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator className="bg-[color:var(--hairline)]" />
                <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300">
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <nav
        className="ios-tabbar fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-1.5 md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto grid max-w-sm grid-cols-3">
          {tabs.map(({ label, href, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className="flex min-h-[46px] flex-col items-center justify-center gap-[3px] rounded-xl transition active:scale-[0.94]"
              style={{ color: active ? 'var(--accent)' : 'var(--label-3)' }}
            >
              {/* Filling these glyphs was the first attempt, to copy how
                  SF Symbols swap to a solid weight on the active tab. Lucide
                  icons are single outlined paths, so WalletCards filled into
                  a solid violet block with no card in it. Weight and colour
                  carry the active state instead. */}
              <Icon className="h-[25px] w-[25px]" strokeWidth={active ? 2.15 : 1.7} />
              <span className={`text-[10px] tracking-[0.01em] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
