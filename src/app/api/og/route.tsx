import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Fetch the transparent logo (real PNG, dark text on transparent bg)
  let logoBase64 = '';
  try {
    const logoUrl = new URL('/logo-transparent.png', request.url);
    const logoData = await fetch(logoUrl).then((res) => res.arrayBuffer());
    logoBase64 = `data:image/png;base64,${Buffer.from(logoData).toString('base64')}`;
  } catch {
    // If logo fails, we'll use text fallback
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
        {/* Ambient glow - top right */}
        <div
          style={{
            position: 'absolute',
            width: 700,
            height: 700,
            borderRadius: 350,
            background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 60%)',
            top: -250,
            right: -100,
            display: 'flex',
          }}
        />
        {/* Ambient glow - bottom left */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: 250,
            background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 60%)',
            bottom: -150,
            left: -50,
            display: 'flex',
          }}
        />

        {/* Top bar with logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '28px 48px',
          }}
        >
          {logoBase64 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                borderRadius: 14,
                padding: '8px 24px',
              }}
            >
              <img src={logoBase64} height={36} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#fff',
                  marginRight: 12,
                }}
              >
                IM
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', display: 'flex' }}>
                Innovated Marketing
              </div>
            </div>
          )}
          {/* Tagline on right */}
          <div style={{ fontSize: 15, color: '#71717a', display: 'flex' }}>
            AI-Powered Website Builder
          </div>
        </div>

        {/* Main content area */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            padding: '0 48px 36px',
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
              paddingRight: 32,
            }}
          >
            {/* User message */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 12, color: '#a1a1aa', marginRight: 8, display: 'flex' }}>You</div>
                <div style={{ width: 24, height: 24, borderRadius: 12, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>U</div>
              </div>
              <div
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                  color: '#ffffff',
                  fontSize: 17,
                  padding: '14px 20px',
                  borderRadius: '16px 16px 4px 16px',
                  maxWidth: 360,
                  lineHeight: 1.5,
                  display: 'flex',
                }}
              >
                Build me a modern bakery website with online ordering and a menu page
              </div>
            </div>

            {/* AI response */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <div style={{ width: 24, height: 24, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>AI</div>
                <div style={{ fontSize: 12, color: '#a1a1aa', marginLeft: 8, display: 'flex' }}>Innovated AI</div>
              </div>
              <div
                style={{
                  background: 'rgba(39,39,42,0.8)',
                  border: '1px solid rgba(63,63,70,0.5)',
                  color: '#e4e4e7',
                  fontSize: 17,
                  padding: '14px 20px',
                  borderRadius: '16px 16px 16px 4px',
                  maxWidth: 380,
                  lineHeight: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', marginBottom: 6 }}>
                  Your bakery site is live! I built:
                </div>
                <div style={{ display: 'flex', fontSize: 15, color: '#a1a1aa' }}>
                  ✓ Homepage with hero &amp; gallery
                </div>
                <div style={{ display: 'flex', fontSize: 15, color: '#a1a1aa' }}>
                  ✓ Menu with categories &amp; prices
                </div>
                <div style={{ display: 'flex', fontSize: 15, color: '#a1a1aa' }}>
                  ✓ Online ordering system
                </div>
              </div>
            </div>

            {/* Input bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(39,39,42,0.4)',
                border: '1px solid rgba(63,63,70,0.3)',
                borderRadius: 12,
                padding: '11px 18px',
                marginTop: 4,
              }}
            >
              <div style={{ fontSize: 14, color: '#52525b', display: 'flex', flex: 1 }}>
                Describe your dream website...
              </div>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: '#fff',
                }}
              >
                →
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
              width: 48,
            }}
          >
            <div style={{ fontSize: 28, color: '#8b5cf6', display: 'flex' }}>→</div>
          </div>

          {/* Right side - Generated website preview */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: 440,
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
                    marginLeft: 12,
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

              {/* Website content - detailed mockup */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '14px 16px' }}>
                {/* Nav */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: '#f59e0b', display: 'flex' }} />
                    <div style={{ width: 52, height: 7, borderRadius: 3, background: 'rgba(255,255,255,0.2)', marginLeft: 6, display: 'flex' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 28, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', display: 'flex' }} />
                    <div style={{ width: 28, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', marginLeft: 8, display: 'flex' }} />
                    <div style={{ width: 28, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', marginLeft: 8, display: 'flex' }} />
                    <div style={{ width: 44, height: 20, borderRadius: 4, background: '#f59e0b', marginLeft: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#000' }}>
                      Order
                    </div>
                  </div>
                </div>

                {/* Hero section */}
                <div
                  style={{
                    width: '100%',
                    height: 80,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.12))',
                    marginTop: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
                    Sweet Dreams Bakery
                  </div>
                  <div style={{ width: 80, height: 5, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginTop: 6, display: 'flex' }} />
                  <div style={{ width: 48, height: 16, borderRadius: 4, background: '#f59e0b', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#000' }}>
                    View Menu
                  </div>
                </div>

                {/* Section heading */}
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
                  <div style={{ width: 60, height: 7, borderRadius: 3, background: 'rgba(255,255,255,0.18)', display: 'flex' }} />
                </div>

                {/* Product cards */}
                <div style={{ display: 'flex', marginTop: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      borderRadius: 6,
                      border: '1px solid rgba(63,63,70,0.3)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ height: 32, background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))', display: 'flex' }} />
                    <div style={{ padding: '6px 7px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ width: 44, height: 5, borderRadius: 2, background: 'rgba(255,255,255,0.18)', display: 'flex' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                        <div style={{ width: 22, height: 4, borderRadius: 2, background: 'rgba(245,158,11,0.5)', display: 'flex' }} />
                        <div style={{ width: 24, height: 12, borderRadius: 3, background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, color: '#f59e0b' }}>
                          +
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      borderRadius: 6,
                      border: '1px solid rgba(63,63,70,0.3)',
                      overflow: 'hidden',
                      marginLeft: 8,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ height: 32, background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', display: 'flex' }} />
                    <div style={{ padding: '6px 7px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ width: 44, height: 5, borderRadius: 2, background: 'rgba(255,255,255,0.18)', display: 'flex' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                        <div style={{ width: 22, height: 4, borderRadius: 2, background: 'rgba(245,158,11,0.5)', display: 'flex' }} />
                        <div style={{ width: 24, height: 12, borderRadius: 3, background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, color: '#f59e0b' }}>
                          +
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      borderRadius: 6,
                      border: '1px solid rgba(63,63,70,0.3)',
                      overflow: 'hidden',
                      marginLeft: 8,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ height: 32, background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03))', display: 'flex' }} />
                    <div style={{ padding: '6px 7px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ width: 44, height: 5, borderRadius: 2, background: 'rgba(255,255,255,0.18)', display: 'flex' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                        <div style={{ width: 22, height: 4, borderRadius: 2, background: 'rgba(245,158,11,0.5)', display: 'flex' }} />
                        <div style={{ width: 24, height: 12, borderRadius: 3, background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, color: '#f59e0b' }}>
                          +
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(63,63,70,0.2)' }}>
                  <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', display: 'flex' }} />
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', display: 'flex' }} />
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', marginLeft: 6, display: 'flex' }} />
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', marginLeft: 6, display: 'flex' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* "Live" badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 10,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: 3, background: '#22c55e', display: 'flex' }} />
              <div style={{ fontSize: 11, color: '#22c55e', marginLeft: 6, display: 'flex' }}>
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
