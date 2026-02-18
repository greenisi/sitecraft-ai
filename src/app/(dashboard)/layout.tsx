export const dynamic = 'force-dynamic';

import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background relative">
      {/* ===== MOBILE ANIMATED BACKGROUND (behind everything) ===== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none md:hidden z-0">
        {/* Gradient orbs */}
        <div className="absolute -top-24 -right-24 h-[300px] w-[300px] bg-gradient-to-br from-violet-500/[0.06] via-blue-500/[0.04] to-indigo-500/[0.06] dark:from-violet-500/[0.1] dark:via-blue-500/[0.06] dark:to-indigo-500/[0.1] rounded-full blur-3xl orb orb-1" />
        <div className="absolute -bottom-24 -left-24 h-[280px] w-[280px] bg-gradient-to-tr from-purple-500/[0.05] via-pink-500/[0.03] to-violet-500/[0.05] dark:from-purple-500/[0.08] dark:via-pink-500/[0.05] dark:to-violet-500/[0.08] rounded-full blur-3xl orb orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[200px] bg-gradient-to-br from-violet-400/[0.04] to-blue-400/[0.04] dark:from-violet-400/[0.07] dark:to-blue-400/[0.07] rounded-full blur-3xl orb-glow-slow" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 grid-pattern-light" />
        {/* Floating particles */}
        <div className="particle particle-light" style={{ left: '10%', top: '20%', width: '2px', height: '2px', animation: 'particle-drift 16s linear infinite' }} />
        <div className="particle particle-light" style={{ left: '80%', top: '40%', width: '2px', height: '2px', animation: 'particle-drift 20s linear infinite 4s' }} />
        <div className="particle particle-light" style={{ left: '50%', top: '70%', width: '2px', height: '2px', animation: 'particle-drift-reverse 18s linear infinite 2s' }} />
        <div className="particle particle-light" style={{ left: '25%', top: '55%', width: '2px', height: '2px', animation: 'particle-drift 22s linear infinite 6s' }} />
        <div className="particle particle-light" style={{ left: '70%', top: '15%', width: '3px', height: '3px', animation: 'particle-drift-reverse 14s linear infinite 3s' }} />
      </div>

      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 relative z-10">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          {/* ===== DESKTOP ANIMATED BACKGROUND (inside main content) ===== */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block z-0">
            {/* Gradient orbs */}
            <div className="absolute -top-32 -right-32 h-[400px] w-[400px] bg-gradient-to-br from-violet-500/[0.04] via-blue-500/[0.03] to-indigo-500/[0.04] dark:from-violet-500/[0.07] dark:via-blue-500/[0.04] dark:to-indigo-500/[0.07] rounded-full blur-3xl orb orb-1" />
            <div className="absolute -bottom-32 -left-32 h-[350px] w-[350px] bg-gradient-to-tr from-purple-500/[0.03] via-pink-500/[0.02] to-violet-500/[0.03] dark:from-purple-500/[0.06] dark:via-pink-500/[0.03] dark:to-violet-500/[0.06] rounded-full blur-3xl orb orb-2" />
            <div className="absolute top-1/3 right-1/4 h-[250px] w-[250px] bg-gradient-to-br from-violet-400/[0.03] to-blue-400/[0.03] dark:from-violet-400/[0.05] dark:to-blue-400/[0.05] rounded-full blur-3xl orb-glow-slow" />
            {/* Subtle grid */}
            <div className="absolute inset-0 grid-pattern-light" />
            {/* Floating particles */}
            <div className="particle particle-light" style={{ left: '15%', top: '25%', width: '2px', height: '2px', animation: 'particle-drift 18s linear infinite' }} />
            <div className="particle particle-light" style={{ left: '75%', top: '35%', width: '2px', height: '2px', animation: 'particle-drift 22s linear infinite 5s' }} />
            <div className="particle particle-light" style={{ left: '45%', top: '65%', width: '2px', height: '2px', animation: 'particle-drift-reverse 20s linear infinite 3s' }} />
            <div className="particle particle-light" style={{ left: '85%', top: '75%', width: '2px', height: '2px', animation: 'particle-drift 16s linear infinite 7s' }} />
          </div>
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
