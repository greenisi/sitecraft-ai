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
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden aurora-bg">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="orb orb-1 -top-20 -left-20 h-[500px] w-[500px] bg-white/[0.07] blur-3xl" />
          <div className="orb orb-2 -bottom-32 -right-20 h-[600px] w-[600px] bg-white/[0.05] blur-3xl" />
          <div className="orb orb-3 top-1/3 left-1/3 h-[350px] w-[350px] bg-white/[0.04] blur-3xl" />
          {/* Pulsing glow accents */}
          <div className="orb orb-glow top-1/4 right-1/4 h-[200px] w-[200px] bg-blue-500/10 blur-3xl" />
          <div className="orb orb-glow-slow bottom-1/3 left-1/4 h-[250px] w-[250px] bg-indigo-500/10 blur-3xl" />
        </div>

        {/* Animated grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="particle" style={{ left: '10%', top: '20%', animation: 'particle-drift 12s linear infinite' }} />
          <div className="particle" style={{ left: '25%', top: '60%', animation: 'particle-drift 18s linear infinite 3s' }} />
          <div className="particle" style={{ left: '45%', top: '80%', animation: 'particle-drift 15s linear infinite 6s' }} />
          <div className="particle" style={{ left: '65%', top: '30%', animation: 'particle-drift 20s linear infinite 2s' }} />
          <div className="particle" style={{ left: '80%', top: '70%', animation: 'particle-drift 14s linear infinite 8s' }} />
          <div className="particle" style={{ left: '35%', top: '10%', animation: 'particle-drift 16s linear infinite 4s' }} />
          <div className="particle" style={{ left: '55%', top: '50%', animation: 'particle-drift 22s linear infinite 1s' }} />
          <div className="particle" style={{ left: '90%', top: '40%', animation: 'particle-drift 17s linear infinite 7s' }} />
        </div>

        {/* Decorative spinning ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] spin-ring opacity-[0.03]">
          <div className="absolute inset-0 rounded-full border border-white" />
          <div className="absolute inset-8 rounded-full border border-white/50" />
          <div className="absolute inset-16 rounded-full border border-white/30" />
        </div>

        {/* Content */}
        <div className="relative flex flex-col justify-between p-12 xl:p-16 w-full z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 stagger-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 breathe">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-tight">SiteCraft AI</span>
              <span className="text-[11px] text-white/40">by Innovated Marketing</span>
            </div>
          </div>

          {/* Hero content */}
          <div className="space-y-8 max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight stagger-2">
              Build stunning websites with AI
            </h1>
            <p className="text-lg text-white/50 leading-relaxed stagger-3">
              Describe your vision and watch as AI crafts a production-ready website in seconds. No coding required.
            </p>

            {/* Feature pills */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-white/60 stagger-4 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 flex-shrink-0 transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110">
                  <Globe className="h-4 w-4 text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Production Ready</p>
                  <p className="text-xs text-white/40">Deploy instantly to any platform</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/60 stagger-5 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 flex-shrink-0 transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110">
                  <Sparkles className="h-4 w-4 text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">AI-Powered Design</p>
                  <p className="text-xs text-white/40">Premium templates crafted by AI</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/60 stagger-6 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 flex-shrink-0 transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110">
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
          <p className="text-xs text-white/20 stagger-7">
            &copy; {new Date().getFullYear()} Innovated Marketing. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-8 auth-mesh auth-mesh-animated relative overflow-hidden">
        {/* Animated background orbs for right panel */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb orb-2 -top-40 -right-40 h-[400px] w-[400px] bg-blue-200/20 dark:bg-blue-900/10 blur-3xl" />
          <div className="orb orb-1 -bottom-40 -left-40 h-[350px] w-[350px] bg-indigo-200/15 dark:bg-indigo-900/10 blur-3xl" />
          <div className="orb orb-glow-slow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] bg-violet-200/10 dark:bg-violet-900/5 blur-3xl" />
        </div>

        {/* Subtle grid on right panel */}
        <div className="absolute inset-0 grid-pattern-light pointer-events-none" />

        {/* Floating particles on right panel */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="particle particle-light" style={{ left: '20%', top: '30%', animation: 'particle-drift-reverse 20s linear infinite' }} />
          <div className="particle particle-light" style={{ left: '70%', top: '60%', animation: 'particle-drift-reverse 25s linear infinite 5s' }} />
          <div className="particle particle-light" style={{ left: '40%', top: '80%', animation: 'particle-drift-reverse 18s linear infinite 10s' }} />
          <div className="particle particle-light" style={{ left: '85%', top: '20%', animation: 'particle-drift-reverse 22s linear infinite 3s' }} />
        </div>

        {/* Mobile logo */}
        <div className="flex flex-col items-center gap-3 mb-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground shadow-lg transition-shadow group-hover:shadow-xl breathe">
              <Zap className="h-5 w-5 text-background" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">SiteCraft AI</span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">by Innovated Marketing</span>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-[400px] relative z-10 animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
