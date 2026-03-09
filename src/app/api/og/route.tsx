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
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent 0%, #7c3aed 20%, #6366f1 50%, #3b82f6 80%, transparent 100%)', display: 'flex' }} />

        {/* Ambient glows */}
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: 350, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 55%)', top: -300, right: -100, display: 'flex' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: 250, background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 55%)', bottom: -150, left: 80, display: 'flex' }} />

        {/* Top bar — logo + domain */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 44px 0' }}>
          {logoBase64 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: 10, padding: '5px 16px' }}>
              <img src={logoBase64} height={26} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', marginRight: 10 }}>IM</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', display: 'flex' }}>Innovated Marketing</div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(24,24,27,0.6)', border: '1px solid rgba(63,63,70,0.25)', borderRadius: 20, padding: '5px 14px' }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: '#22c55e', display: 'flex' }} />
            <div style={{ fontSize: 12, color: '#a1a1aa', marginLeft: 6, display: 'flex' }}>app.innovated.marketing</div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '18px 44px 0' }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#ffffff', letterSpacing: -1.5, lineHeight: 1.1, display: 'flex' }}>
            Build Websites by Just
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, display: 'flex', background: 'linear-gradient(90deg, #a78bfa, #818cf8, #60a5fa)', color: 'transparent', backgroundClip: 'text' }}>
              Chatting with AI
            </div>
          </div>
          <div style={{ fontSize: 15, color: '#71717a', marginTop: 8, display: 'flex' }}>
            No code. No templates. No limits. Just describe what you want.
          </div>
        </div>

        {/* Main content — chat + arrow + website */}
        <div style={{ display: 'flex', flex: 1, padding: '16px 44px 16px', alignItems: 'center' }}>

          {/* Left — Chat conversation */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 20 }}>

            {/* User message */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 10, color: '#71717a', marginRight: 5, display: 'flex' }}>You</div>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>U</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#ffffff', fontSize: 14, padding: '10px 16px', borderRadius: '12px 12px 4px 12px', maxWidth: 320, lineHeight: 1.45, display: 'flex' }}>
                Create a website for my coffee shop
              </div>
            </div>

            {/* AI response */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 700 }}>AI</div>
                <div style={{ fontSize: 10, color: '#71717a', marginLeft: 5, display: 'flex' }}>Innovated AI</div>
              </div>
              <div style={{ background: 'rgba(39,39,42,0.8)', border: '1px solid rgba(63,63,70,0.4)', color: '#e4e4e7', fontSize: 13, padding: '10px 14px', borderRadius: '12px 12px 12px 4px', maxWidth: 330, lineHeight: 1.4, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', marginBottom: 6 }}>Building your coffee shop site...</div>
                <div style={{ display: 'flex', fontSize: 11, color: '#22c55e', marginBottom: 2 }}>✓ Homepage with hero</div>
                <div style={{ display: 'flex', fontSize: 11, color: '#22c55e', marginBottom: 2 }}>✓ Menu &amp; pricing page</div>
                <div style={{ display: 'flex', fontSize: 11, color: '#22c55e', marginBottom: 2 }}>✓ About &amp; contact</div>
                <div style={{ display: 'flex', fontSize: 11, color: '#22c55e' }}>✓ Mobile responsive &amp; SEO</div>
              </div>
            </div>

            {/* Generation progress */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(39,39,42,0.3)', border: '1px solid rgba(63,63,70,0.2)', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 10, color: '#a1a1aa', display: 'flex' }}>3 pages · 8 components</div>
                <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, display: 'flex' }}>Deployed ✓</div>
              </div>
              <div style={{ display: 'flex', width: '100%', height: 3, background: 'rgba(63,63,70,0.4)', borderRadius: 2 }}>
                <div style={{ width: '100%', height: 3, background: 'linear-gradient(90deg, #7c3aed, #22c55e)', borderRadius: 2, display: 'flex' }} />
              </div>
            </div>
          </div>

          {/* Center arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: 48 }}>
            <div style={{ width: 2, height: 24, background: 'rgba(139,92,246,0.25)', display: 'flex' }} />
            <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#a78bfa', marginTop: -1, marginBottom: -1 }}>→</div>
            <div style={{ width: 2, height: 24, background: 'rgba(139,92,246,0.25)', display: 'flex' }} />
          </div>

          {/* Right — Generated website preview */}
          <div style={{ display: 'flex', flexDirection: 'column', width: 440 }}>
            <div style={{ display: 'flex', flexDirection: 'column', background: '#18181b', border: '1px solid rgba(63,63,70,0.5)', borderRadius: 10, overflow: 'hidden' }}>
              {/* Browser chrome */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '7px 10px', borderBottom: '1px solid rgba(63,63,70,0.4)', background: 'rgba(24,24,27,0.8)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444', display: 'flex' }} />
                <div style={{ width: 8, height: 8, borderRadius: 4, background: '#eab308', marginLeft: 4, display: 'flex' }} />
                <div style={{ width: 8, height: 8, borderRadius: 4, background: '#22c55e', marginLeft: 4, display: 'flex' }} />
                <div style={{ flex: 1, marginLeft: 10, height: 20, background: 'rgba(39,39,42,0.8)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#71717a' }}>
                  brew-house.innovated.site
                </div>
              </div>

              {/* Website content */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px' }}>
                {/* Nav */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b', display: 'flex' }} />
                    <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginLeft: 4, display: 'flex' }}>Brew House</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)', display: 'flex' }}>Menu</div>
                    <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)', marginLeft: 8, display: 'flex' }}>About</div>
                    <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)', marginLeft: 8, display: 'flex' }}>Contact</div>
                    <div style={{ padding: '2px 8px', borderRadius: 3, background: '#f59e0b', marginLeft: 8, display: 'flex', fontSize: 7, color: '#000', fontWeight: 700 }}>Visit Us</div>
                  </div>
                </div>

                {/* Hero */}
                <div style={{ width: '100%', height: 60, borderRadius: 6, background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.08))', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', display: 'flex' }}>Craft Coffee, Made Fresh</div>
                  <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.22)', marginTop: 2, display: 'flex' }}>Specialty espresso, pour-overs &amp; pastries</div>
                  <div style={{ padding: '2px 12px', borderRadius: 3, background: '#f59e0b', marginTop: 5, display: 'flex', fontSize: 7, color: '#000', fontWeight: 600 }}>Our Menu</div>
                </div>

                {/* Section title */}
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.22)', marginTop: 8, display: 'flex' }}>Popular Drinks</div>

                {/* Product cards */}
                <div style={{ display: 'flex', marginTop: 5 }}>
                  <div style={{ flex: 1, borderRadius: 4, border: '1px solid rgba(63,63,70,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 24, background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))', display: 'flex' }} />
                    <div style={{ padding: '4px 5px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', display: 'flex' }}>Latte</div>
                      <div style={{ fontSize: 7, color: '#f59e0b', marginTop: 2, display: 'flex' }}>$5.50</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, borderRadius: 4, border: '1px solid rgba(63,63,70,0.3)', overflow: 'hidden', marginLeft: 5, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 24, background: 'linear-gradient(135deg, rgba(245,158,11,0.14), rgba(245,158,11,0.04))', display: 'flex' }} />
                    <div style={{ padding: '4px 5px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', display: 'flex' }}>Espresso</div>
                      <div style={{ fontSize: 7, color: '#f59e0b', marginTop: 2, display: 'flex' }}>$3.75</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, borderRadius: 4, border: '1px solid rgba(63,63,70,0.3)', overflow: 'hidden', marginLeft: 5, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 24, background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))', display: 'flex' }} />
                    <div style={{ padding: '4px 5px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', display: 'flex' }}>Cold Brew</div>
                      <div style={{ fontSize: 7, color: '#f59e0b', marginTop: 2, display: 'flex' }}>$4.50</div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 5, borderTop: '1px solid rgba(63,63,70,0.15)' }}>
                  <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.1)', display: 'flex' }}>© Brew House Coffee</div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: 7, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.06)', display: 'flex' }} />
                    <div style={{ width: 7, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginLeft: 3, display: 'flex' }} />
                    <div style={{ width: 7, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginLeft: 3, display: 'flex' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar — tech stack + CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 44px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: '#52525b', display: 'flex' }}>Powered by</div>
            <div style={{ fontSize: 10, color: '#71717a', marginLeft: 5, display: 'flex', fontWeight: 700 }}>Next.js</div>
            <div style={{ width: 3, height: 3, borderRadius: 2, background: '#3f3f46', marginLeft: 7, marginRight: 7, display: 'flex' }} />
            <div style={{ fontSize: 10, color: '#71717a', display: 'flex', fontWeight: 700 }}>Tailwind CSS</div>
            <div style={{ width: 3, height: 3, borderRadius: 2, background: '#3f3f46', marginLeft: 7, marginRight: 7, display: 'flex' }} />
            <div style={{ fontSize: 10, color: '#71717a', display: 'flex', fontWeight: 700 }}>TypeScript</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', borderRadius: 6, padding: '5px 16px' }}>
            <div style={{ fontSize: 11, color: '#fff', fontWeight: 700, display: 'flex' }}>Try it free →</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
