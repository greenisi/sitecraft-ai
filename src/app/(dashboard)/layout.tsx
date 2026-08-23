export const dynamic = 'force-dynamic';

import { SpaceNavbar } from '@/components/dashboard/space-navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sitecraft-app relative min-h-dvh w-full overflow-x-clip" style={{ background: 'linear-gradient(145deg, #070a12 0%, #0c1220 38%, #0b1020 68%, #070a12 100%)' }}>
      {/* Starfield background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Stars layer 1 - small */}
        <div className="stars-small" />
        {/* Stars layer 2 - medium */}
        <div className="stars-medium" />
        {/* Stars layer 3 - large */}
        <div className="stars-large" />
        {/* Nebula glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-30" style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.08) 40%, transparent 70%)' }} />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 60%)' }} />
      </div>

      {/* Top navigation */}
      <SpaceNavbar />

      {/* Main content */}
      <main className="relative z-10 mx-auto w-full min-w-0 max-w-[1600px] px-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-5 md:px-8 md:pb-12 md:pt-8 lg:px-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 hidden py-8 text-center text-sm text-gray-500 md:block">
        Powered by Innovated Marketing AI
      </footer>
    </div>
  );
}
