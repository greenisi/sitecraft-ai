import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Load the solid logo (white on dark works better than transparent)
    const logoUrl = new URL('/logo.png', request.url);
    const logoData = await fetch(logoUrl).then((res) => res.arrayBuffer());
    const logoBase64 = `data:image/png;base64,${Buffer.from(logoData).toString('base64')}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            background: '#09090b',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Large ambient glow - top right */}
          <div
            style={{
              position: 'absolute',
              width: '800px',
              height: '800px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)',
              top: '-300px',
              right: '-200px',
              display: 'flex',
            }}
          />

          {/* Secondary glow - bottom left */}
          <div
            style={{
              position: 'absolute',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)',
              bottom: '-200px',
              left: '-100px',
              display: 'flex',
            }}
          />

          {/* Left content section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '72px 64px',
              flex: 1,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Logo - small, top-aligned with content */}
            <img
              src={logoBase64}
              width={64}
              height={64}
              style={{
                marginBottom: '32px',
                borderRadius: '14px',
                filter: 'brightness(0) invert(1)',
              }}
            />

            {/* Brand name */}
            <div
              style={{
                fontSize: '56px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-2px',
                lineHeight: 1.05,
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span>Innovated</span>
              <span>Marketing</span>
            </div>

            {/* Tagline */}
            <div
              style={{
                fontSize: '22px',
                color: '#a1a1aa',
                lineHeight: 1.5,
                maxWidth: '440px',
                display: 'flex',
              }}
            >
              Build production-ready websites with AI. Just chat.
            </div>

            {/* CTA-style pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginTop: '36px',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '999px',
                padding: '10px 24px',
                width: 'fit-content',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'flex',
                }}
              />
              <div
                style={{
                  fontSize: '15px',
                  color: '#d4d4d8',
                  letterSpacing: '0.3px',
                  display: 'flex',
                }}
              >
                app.innovated.marketing
              </div>
            </div>
          </div>

          {/* Right section - abstract UI mockup */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '480px',
              padding: '48px 56px 48px 0',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Browser mockup frame */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                background: 'rgba(24,24,27,0.9)',
                border: '1px solid rgba(63,63,70,0.5)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              }}
            >
              {/* Browser top bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 18px',
                  gap: '8px',
                  borderBottom: '1px solid rgba(63,63,70,0.4)',
                }}
              >
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ef4444', display: 'flex' }} />
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#eab308', display: 'flex' }} />
                <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#22c55e', display: 'flex' }} />
                <div
                  style={{
                    flex: 1,
                    marginLeft: '12px',
                    height: '28px',
                    background: 'rgba(39,39,42,0.8)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#71717a',
                  }}
                >
                  your-site.innovated.site
                </div>
              </div>

              {/* Mock website content */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', gap: '16px' }}>
                {/* Nav bar placeholder */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '10px', borderRadius: '5px', background: 'rgba(139,92,246,0.4)', display: 'flex' }} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '40px', height: '8px', borderRadius: '4px', background: 'rgba(63,63,70,0.6)', display: 'flex' }} />
                    <div style={{ width: '40px', height: '8px', borderRadius: '4px', background: 'rgba(63,63,70,0.6)', display: 'flex' }} />
                    <div style={{ width: '40px', height: '8px', borderRadius: '4px', background: 'rgba(63,63,70,0.6)', display: 'flex' }} />
                  </div>
                </div>

                {/* Hero placeholder */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                  <div style={{ width: '200px', height: '14px', borderRadius: '7px', background: 'rgba(255,255,255,0.15)', display: 'flex' }} />
                  <div style={{ width: '160px', height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.07)', display: 'flex' }} />
                  <div
                    style={{
                      width: '100px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                      marginTop: '8px',
                      display: 'flex',
                    }}
                  />
                </div>

                {/* Cards row */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <div style={{ flex: 1, height: '60px', borderRadius: '8px', background: 'rgba(39,39,42,0.6)', border: '1px solid rgba(63,63,70,0.3)', display: 'flex' }} />
                  <div style={{ flex: 1, height: '60px', borderRadius: '8px', background: 'rgba(39,39,42,0.6)', border: '1px solid rgba(63,63,70,0.3)', display: 'flex' }} />
                  <div style={{ flex: 1, height: '60px', borderRadius: '8px', background: 'rgba(39,39,42,0.6)', border: '1px solid rgba(63,63,70,0.3)', display: 'flex' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Top accent line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, transparent 0%, #8b5cf6 30%, #6366f1 50%, #3b82f6 70%, transparent 100%)',
              display: 'flex',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);

    // Fallback: clean text-only card
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#09090b',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-2px',
              display: 'flex',
            }}
          >
            Innovated Marketing
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#a1a1aa',
              marginTop: '16px',
              display: 'flex',
            }}
          >
            Build production-ready websites with AI
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #8b5cf6, #6366f1, #3b82f6, transparent)',
              display: 'flex',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
