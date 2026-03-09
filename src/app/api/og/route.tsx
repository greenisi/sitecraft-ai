import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  let logoBase64 = '';
  try {
    const logoUrl = new URL('/logo-transparent.png', request.url);
    const logoData = await fetch(logoUrl).then((res) => res.arrayBuffer());
    logoBase64 = `data:image/png;base64,${Buffer.from(logoData).toString('base64')}`;
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#09090b',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glows */}
        <div style={{ position: 'absolute', width: 800, height: 800, borderRadius: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 55%)', top: -350, right: -150, display: 'flex' }} />
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: 300, background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 55%)', bottom: -200, left: 100, display: 'flex' }} />

        {/* Floating code snippet - top right area */}
        <div style={{ position: 'absolute', top: 90, right: 36, display: 'flex', flexDirection: 'column', background: 'rgba(24,24,27,0.7)', border: '1px solid rgba(63,63,70,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 10, color: '#6366f1' }}>
          <div style={{ display: 'flex' }}>
            <div style={{ color: '#c084fc', display: 'flex' }}>export default</div>
            <div style={{ color: '#60a5fa', marginLeft: 4, display: 'flex' }}>function</div>
            <div style={{ color: '#fbbf24', marginLeft: 4, display: 'flex' }}>Page()</div>
          </div>
        </div>

        {/* Floating tech badge - bottom left */}
        <div style={{ position: 'absolute', bottom: 24, left: 48, display: 'flex', alignItems: 'center', background: 'rgba(24,24,27,0.6)', border: '1px solid rgba(63,63,70,0.25)', borderRadius: 8, padding: '6px 14px' }}>
          <div style={{ fontSize: 10, color: '#52525b', display: 'flex' }}>Built with</div>
          <div style={{ fontSize: 10, color: '#71717a', marginLeft: 6, display: 'flex', fontWeight: 700 }}>Next.js</div>
          <div style={{ width: 3, height: 3, borderRadius: 2, background: '#3f3f46', marginLeft: 8, marginRight: 8, display: 'flex' }} />
          <div style={{ fontSize: 10, color: '#71717a', display: 'flex', fontWeight: 700 }}>Tailwind</div>
          <div style={{ width: 3, height: 3, borderRadius: 2, background: '#3f3f46', marginLeft: 8, marginRight: 8, display: 'flex' }} />
          <div style={{ fontSize: 10, color: '#71717a', display: 'flex', fontWeight: 700 }}>TypeScript</div>
        </div>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px' }}>
          {logoBase64 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: 12, padding: '6px 20px' }}>
              <img src={logoBase64} height={32} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #7c3aed, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', marginRight: 10 }}>IM</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', display: 'flex' }}>Innovated Marketing</div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: '#22c55e', display: 'flex' }} />
            <div style={{ fontSize: 13, color: '#71717a', marginLeft: 6, display: 'flex' }}>AI-Powered Website Builder</div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, padding: '0 48px 20px', position: 'relative' }}>

          {/* Left - Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, paddingRight: 24 }}>

            {/* User msg */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ fontSize: 11, color: '#71717a', marginRight: 6, display: 'flex' }}>You</div>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>U</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#ffffff', fontSize: 16, padding: '12px 18px', borderRadius: '14px 14px 4px 14px', maxWidth: 340, lineHeight: 1.5, display: 'flex' }}>
                Create a website for my coffee shop
              </div>
            </div>

            {/* AI response */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700 }}>AI</div>
                <div style={{ fontSize: 11, color: '#71717a', marginLeft: 6, display: 'flex' }}>Innovated AI</div>
              </div>
              <div style={{ background: 'rgba(39,39,42,0.8)', border: '1px solid rgba(63,63,70,0.4)', color: '#e4e4e7', fontSize: 15, padding: '12px 18px', borderRadius: '14px 14px 14px 4px', maxWidth: 350, lineHeight: 1.5, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', marginBottom: 5 }}>Your coffee shop site is live!</div>
                <div style={{ display: 'flex', fontSize: 13, color: '#22c55e' }}>✓ Homepage with hero section</div>
                <div style={{ display: 'flex', fontSize: 13, color: '#22c55e' }}>✓ Menu &amp; hours page</div>
                <div style={{ display: 'flex', fontSize: 13, color: '#22c55e' }}>✓ About &amp; contact page</div>
                <div style={{ display: 'flex', fontSize: 13, color: '#22c55e' }}>✓ Mobile responsive</div>
                <div style={{ display: 'flex', fontSize: 13, color: '#22c55e' }}>✓ SEO optimized</div>
              </div>
            </div>

            {/* Progress bar - generation status */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(39,39,42,0.3)', border: '1px solid rgba(63,63,70,0.25)', borderRadius: 10, padding: '10px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: '#a1a1aa', display: 'flex' }}>Generating 3 pages, 8 components...</div>
                <div style={{ fontSize: 11, color: '#22c55e', display: 'flex' }}>100%</div>
              </div>
              <div style={{ display: 'flex', width: '100%', height: 4, background: 'rgba(63,63,70,0.4)', borderRadius: 2 }}>
                <div style={{ width: '100%', height: 4, background: 'linear-gradient(90deg, #7c3aed, #22c55e)', borderRadius: 2, display: 'flex' }} />
              </div>
            </div>

            {/* Input bar */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(39,39,42,0.4)', border: '1px solid rgba(63,63,70,0.3)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 13, color: '#52525b', display: 'flex', flex: 1 }}>Describe your dream website...</div>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}>→</div>
            </div>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: 44 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 2, height: 20, background: 'rgba(139,92,246,0.3)', display: 'flex' }} />
              <div style={{ fontSize: 24, color: '#8b5cf6', display: 'flex', marginTop: -2, marginBottom: -2 }}>→</div>
              <div style={{ width: 2, height: 20, background: 'rgba(139,92,246,0.3)', display: 'flex' }} />
            </div>
          </div>

          {/* Right - Website */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: 440 }}>
            <div style={{ display: 'flex', flexDirection: 'column', background: '#18181b', border: '1px solid rgba(63,63,70,0.5)', borderRadius: 12, overflow: 'hidden' }}>
              {/* Browser bar */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(63,63,70,0.4)', background: 'rgba(24,24,27,0.8)' }}>
                <div style={{ width: 9, height: 9, borderRadius: 5, background: '#ef4444', display: 'flex' }} />
                <div style={{ width: 9, height: 9, borderRadius: 5, background: '#eab308', marginLeft: 5, display: 'flex' }} />
                <div style={{ width: 9, height: 9, borderRadius: 5, background: '#22c55e', marginLeft: 5, display: 'flex' }} />
                <div style={{ flex: 1, marginLeft: 10, height: 22, background: 'rgba(39,39,42,0.8)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#22c55e' }}>
                  🔒 brew-house-coffee.innovated.site
                </div>
              </div>

              {/* Site content */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 14px' }}>
                {/* Nav */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: '#f59e0b', display: 'flex' }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginLeft: 5, display: 'flex' }}>Brew House</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', display: 'flex' }}>Menu</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', marginLeft: 8, display: 'flex' }}>About</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', marginLeft: 8, display: 'flex' }}>Contact</div>
                    <div style={{ padding: '3px 10px', borderRadius: 3, background: '#f59e0b', marginLeft: 8, display: 'flex', fontSize: 8, color: '#000', fontWeight: 700 }}>Visit Us</div>
                  </div>
                </div>

                {/* Hero */}
                <div style={{ width: '100%', height: 70, borderRadius: 7, background: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(217,119,6,0.1))', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'flex' }}>Craft Coffee, Made Fresh</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 3, display: 'flex' }}>Specialty espresso, pour-overs &amp; pastries</div>
                  <div style={{ padding: '3px 14px', borderRadius: 3, background: '#f59e0b', marginTop: 6, display: 'flex', fontSize: 7, color: '#000', fontWeight: 600 }}>Our Menu</div>
                </div>

                {/* Section label */}
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginTop: 10, display: 'flex' }}>Our Drinks</div>

                {/* Product cards */}
                <div style={{ display: 'flex', marginTop: 6 }}>
                  <div style={{ flex: 1, borderRadius: 5, border: '1px solid rgba(63,63,70,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 28, background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))', display: 'flex' }} />
                    <div style={{ padding: '5px 6px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', display: 'flex' }}>Latte</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                        <div style={{ fontSize: 7, color: '#f59e0b', display: 'flex' }}>$5.50</div>
                        <div style={{ width: 16, height: 10, borderRadius: 2, background: 'rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#f59e0b' }}>+</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, borderRadius: 5, border: '1px solid rgba(63,63,70,0.3)', overflow: 'hidden', marginLeft: 6, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 28, background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', display: 'flex' }} />
                    <div style={{ padding: '5px 6px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', display: 'flex' }}>Espresso</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                        <div style={{ fontSize: 7, color: '#f59e0b', display: 'flex' }}>$3.75</div>
                        <div style={{ width: 16, height: 10, borderRadius: 2, background: 'rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#f59e0b' }}>+</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, borderRadius: 5, border: '1px solid rgba(63,63,70,0.3)', overflow: 'hidden', marginLeft: 6, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 28, background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03))', display: 'flex' }} />
                    <div style={{ padding: '5px 6px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', display: 'flex' }}>Cold Brew</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                        <div style={{ fontSize: 7, color: '#f59e0b', display: 'flex' }}>$4.50</div>
                        <div style={{ width: 16, height: 10, borderRadius: 2, background: 'rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#f59e0b' }}>+</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(63,63,70,0.2)' }}>
                  <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.12)', display: 'flex' }}>© Brew House Coffee</div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', display: 'flex' }} />
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', marginLeft: 4, display: 'flex' }} />
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', marginLeft: 4, display: 'flex' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Deploy status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: '#22c55e', display: 'flex' }} />
              <div style={{ fontSize: 10, color: '#22c55e', marginLeft: 5, display: 'flex' }}>Deployed to Vercel · Live in 30s</div>
            </div>
          </div>
        </div>

        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent 0%, #7c3aed 20%, #6366f1 50%, #3b82f6 80%, transparent 100%)', display: 'flex' }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
