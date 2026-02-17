import Link from 'next/link';
import { Zap, Globe, Sparkles, Layers } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Left panel - Brand showcase (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-foreground">
        {/* Gradient mesh background */}
        <div className="absolute inset-0">
          <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-white/3 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-white/[0.02] blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-tight">SiteCraft AI</span>
              <span className="text-[11px] text-white/40">by Innovated Marketing</span>
            </div>
          </div>

          {/* Hero content */}
          <div className="space-y-8 max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight">
              Build stunning websites with AI
            </h1>
            <p className="text-lg text-white/50 leading-relaxed">
              Describe your vision and watch as AI crafts a production-ready website in seconds. No coding required.
            </p>

            {/* Feature pills */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-white/60">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
                  <Globe className="h-4 w-4 text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Production Ready</p>
                  <p className="text-xs text-white/40">Deploy instantly to any platform</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">AI-Powered Design</p>
                  <p className="text-xs text-white/40">Premium templates crafted by AI</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
                  <Layers className="h-4 w-4 text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Full Stack</p>
                  <p className="text-xs text-white/40">Complete responsive websites with animations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom attribution */}
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} Innovated Marketing. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-8 auth-mesh relative">
        {/* Mobile logo */}
        <div className="flex flex-col items-center gap-3 mb-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground shadow-lg transition-shadow group-hover:shadow-xl">
              <Zap className="h-5 w-5 text-background" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">SiteCraft AI</span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">by Innovated Marketing</span>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-[400px] animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
