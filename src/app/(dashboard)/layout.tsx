export const dynamic = 'force-dynamic';

import { SpaceNavbar } from '@/components/dashboard/space-navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 30%, #0f172a 60%, #0a0e1a 100%)' }}>
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
      <main className="relative z-10 px-4 md:px-8 lg:px-12 pb-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-sm text-gray-500">
        Powered by Innovated Marketing AI
      </footer>
    </div>
  );
}
