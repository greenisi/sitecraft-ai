import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute top-1/4 left-1/3 h-64 w-64 rounded-full bg-indigo-500/3 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 transition-shadow group-hover:shadow-violet-500/40">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">SiteCraft AI</span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">by Innovated Marketing</span>
            </div>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
