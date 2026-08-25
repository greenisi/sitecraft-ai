export const dynamic = 'force-dynamic';

import { SpaceNavbar } from '@/components/dashboard/space-navbar';

/**
 * The frame every authenticated screen sits in.
 *
 * This used to paint a starfield: three layers of roughly 330 animated
 * box-shadows drifting on an infinite loop, plus two nebula blobs. Inside
 * the iOS WKWebView that repainted behind every scroll, and at phone width
 * the specks landed on top of headings and buttons, so they read as dust on
 * the screen rather than as stars.
 *
 * A native app puts nothing between the content and the ground. The depth
 * now comes from stacked surfaces instead.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sitecraft-app ios-app relative min-h-dvh w-full overflow-x-clip">
      <SpaceNavbar />

      <main className="relative z-10 mx-auto w-full min-w-0 max-w-[1600px] px-4 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-4 md:px-8 md:pb-12 md:pt-8 lg:px-12">
        {children}
      </main>

      <footer className="relative z-10 hidden py-8 text-center text-[13px] text-[color:var(--label-3)] md:block">
        Powered by Innovated Marketing AI
      </footer>
    </div>
  );
}
