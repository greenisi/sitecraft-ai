import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Fetch the logo and encode as base64
  let logoBase64 = '';
  try {
    const logoUrl = new URL('/logo.png', request.url);
    const logoData = await fetch(logoUrl).then((res) => res.arrayBuffer());
    logoBase64 = `data:image/png;base64,${Buffer.from(logoData).toString('base64')}`;
  } catch {
    // If logo fails, we'll skip it
  }

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
        {/* Ambient glow - center */}
        <div
          style={{
            position: 'absolute',
            width: 900,
            height: 900,
            borderRadius: 450,
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 60%)',
            top: -200,
            left: '50%',
            marginLeft: -450,
            display: 'flex',
          }}
        />

        {/* Top bar with logo + brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '36px 52px',
          }}
        >
          {logoBase64 ? (
            <img
              src={logoBase64}
              width={44}
              height={44}
              style={{ borderRadius: 10, marginRight: 14 }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
                color: '#fff',
                marginRight: 14,
              }}
            >
              IM
            </div>
          )}
          <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', display: 'flex' }}>
            Innovated Marketing
          </div>
        </div>

        {/* Main content area */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            padding: '0 52px 44px',
            position: 'relative',
          }}
        >
          {/* Left side - Chat interface */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
              paddingRight: 40,
            }}
          >
            {/* User message */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                  color: '#ffffff',
                  fontSize: 18,
                  padding: '14px 22px',
                  borderRadius: '18px 18px 4px 18px',
                  maxWidth: 380,
                  lineHeight: 1.5,
                  display: 'flex',
                }}
              >
                Build me a modern bakery website with online ordering
              </div>
              <div style={{ fontSize: 12, color: '#52525b', marginTop: 6, display: 'flex' }}>
                You
              </div>
            </div>

            {/* AI response */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  background: 'rgba(39,39,42,0.8)',
                  border: '1px solid rgba(63,63,70,0.5)',
                  color: '#e4e4e7',
                  fontSize: 18,
                  padding: '14px 22px',
                  borderRadius: '18px 18px 18px 4px',
                  maxWidth: 400,
                  lineHeight: 1.5,
                  display: 'flex',
                }}
              >
                Done! Your bakery site is live with a menu, ordering system, and contact page.
              </div>
              <div style={{ fontSize: 12, color: '#52525b', marginTop: 6, display: 'flex' }}>
                AI
              </div>
            </div>

            {/* Typing indicator area */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(39,39,42,0.4)',
                border: '1px solid rgba(63,63,70,0.3)',
                borderRadius: 14,
                padding: '12px 20px',
                marginTop: 4,
              }}
            >
              <div style={{ fontSize: 15, color: '#71717a', display: 'flex' }}>
                Describe your dream website...
              </div>
            </div>
          </div>

          {/* Arrow connector */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: 60,
            }}
          >
            <div
              style={{
                fontSize: 32,
                color: '#8b5cf6',
                display: 'flex',
              }}
            >
              →
            </div>
          </div>

          {/* Right side - Generated website preview */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: 420,
            }}
          >
            {/* Browser frame */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#18181b',
                border: '1px solid rgba(63,63,70,0.5)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              {/* Browser bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderBottom: '1px solid rgba(63,63,70,0.4)',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ef4444', display: 'flex' }} />
                <div style={{ width: 10, height: 10, borderRadius: 5, background: '#eab308', marginLeft: 6, display: 'flex' }} />
                <div style={{ width: 10, height: 10, borderRadius: 5, background: '#22c55e', marginLeft: 6, display: 'flex' }} />
                <div
                  style={{
                    flex: 1,
                    marginLeft: 14,
                    height: 24,
                    background: 'rgba(39,39,42,0.8)',
                    borderRadius: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    color: '#22c55e',
                  }}
                >
                  sweet-dreams-bakery.innovated.site
                </div>
              </div>

              {/* Website content mockup */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: 18 }}>
                {/* Nav */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, background: '#f59e0b', display: 'flex' }} />
                    <div style={{ width: 60, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.2)', marginLeft: 8, display: 'flex' }} />
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: 32, height: 7, borderRadius: 3, background: 'rgba(255,255,255,0.1)', display: 'flex' }} />
                    <div style={{ width: 32, height: 7, borderRadius: 3, background: 'rgba(255,255,255,0.1)', marginLeft: 10, display: 'flex' }} />
                    <div style={{ width: 50, height: 22, borderRadius: 5, background: '#f59e0b', marginLeft: 10, display: 'flex' }} />
                  </div>
                </div>

                {/* Hero image placeholder */}
                <div
                  style={{
                    width: '100%',
                    height: 90,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))',
                    marginTop: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ width: 140, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.2)', display: 'flex' }} />
                  <div style={{ width: 90, height: 7, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginTop: 8, display: 'flex' }} />
                </div>

                {/* Product cards */}
                <div style={{ display: 'flex', marginTop: 14 }}>
                  <div
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      border: '1px solid rgba(63,63,70,0.3)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ height: 36, background: 'rgba(245,158,11,0.15)', display: 'flex' }} />
                    <div style={{ padding: 8, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ width: 50, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', display: 'flex' }} />
                      <div style={{ width: 30, height: 5, borderRadius: 2, background: 'rgba(245,158,11,0.4)', marginTop: 5, display: 'flex' }} />
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      border: '1px solid rgba(63,63,70,0.3)',
                      overflow: 'hidden',
                      marginLeft: 10,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ height: 36, background: 'rgba(245,158,11,0.1)', display: 'flex' }} />
                    <div style={{ padding: 8, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ width: 50, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', display: 'flex' }} />
                      <div style={{ width: 30, height: 5, borderRadius: 2, background: 'rgba(245,158,11,0.4)', marginTop: 5, display: 'flex' }} />
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      border: '1px solid rgba(63,63,70,0.3)',
                      overflow: 'hidden',
                      marginLeft: 10,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ height: 36, background: 'rgba(245,158,11,0.08)', display: 'flex' }} />
                    <div style={{ padding: 8, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ width: 50, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', display: 'flex' }} />
                      <div style={{ width: 30, height: 5, borderRadius: 2, background: 'rgba(245,158,11,0.4)', marginTop: 5, display: 'flex' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* "Live" badge under browser */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 12,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: 3, background: '#22c55e', display: 'flex' }} />
              <div style={{ fontSize: 12, color: '#22c55e', marginLeft: 6, display: 'flex' }}>
                Live in 30 seconds
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
            height: 3,
            background: 'linear-gradient(90deg, transparent 0%, #7c3aed 20%, #6366f1 50%, #3b82f6 80%, transparent 100%)',
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
