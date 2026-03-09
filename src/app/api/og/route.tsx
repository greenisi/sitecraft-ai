import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
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
        {/* Ambient glow - top right */}
        <div
          style={{
            position: 'absolute',
            width: 800,
            height: 800,
            borderRadius: 400,
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)',
            top: -300,
            right: -200,
            display: 'flex',
          }}
        />

        {/* Ambient glow - bottom left */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: 300,
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)',
            bottom: -200,
            left: -100,
            display: 'flex',
          }}
        />

        {/* Left content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '72px 60px',
            flex: 1,
            position: 'relative',
          }}
        >
          {/* Icon mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              marginBottom: 32,
              fontSize: 28,
              fontWeight: 800,
              color: '#ffffff',
            }}
          >
            IM
          </div>

          {/* Brand name - two lines */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 58,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: -2,
                lineHeight: 1.05,
                display: 'flex',
              }}
            >
              Innovated
            </div>
            <div
              style={{
                fontSize: 58,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: -2,
                lineHeight: 1.05,
                display: 'flex',
              }}
            >
              Marketing
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 22,
              color: '#a1a1aa',
              lineHeight: 1.5,
              display: 'flex',
            }}
          >
            Build production-ready websites with AI. Just chat.
          </div>

          {/* Domain pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 36,
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: 999,
              padding: '10px 24px',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: '#22c55e',
                marginRight: 10,
                display: 'flex',
              }}
            />
            <div
              style={{
                fontSize: 15,
                color: '#d4d4d8',
                display: 'flex',
              }}
            >
              app.innovated.marketing
            </div>
          </div>
        </div>

        {/* Right section - browser mockup */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: 480,
            paddingRight: 56,
            paddingTop: 48,
            paddingBottom: 48,
            position: 'relative',
          }}
        >
          {/* Browser frame */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              background: 'rgba(24,24,27,0.9)',
              border: '1px solid rgba(63,63,70,0.5)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* Browser bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 18px',
                borderBottom: '1px solid rgba(63,63,70,0.4)',
              }}
            >
              <div style={{ width: 11, height: 11, borderRadius: 6, background: '#ef4444', display: 'flex' }} />
              <div style={{ width: 11, height: 11, borderRadius: 6, background: '#eab308', marginLeft: 8, display: 'flex' }} />
              <div style={{ width: 11, height: 11, borderRadius: 6, background: '#22c55e', marginLeft: 8, display: 'flex' }} />
              <div
                style={{
                  flex: 1,
                  marginLeft: 16,
                  height: 28,
                  background: 'rgba(39,39,42,0.8)',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: '#71717a',
                }}
              >
                your-site.innovated.site
              </div>
            </div>

            {/* Mock site content */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: 24 }}>
              {/* Nav */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 80, height: 10, borderRadius: 5, background: 'rgba(139,92,246,0.4)', display: 'flex' }} />
                <div style={{ display: 'flex' }}>
                  <div style={{ width: 40, height: 8, borderRadius: 4, background: 'rgba(63,63,70,0.6)', display: 'flex' }} />
                  <div style={{ width: 40, height: 8, borderRadius: 4, background: 'rgba(63,63,70,0.6)', marginLeft: 12, display: 'flex' }} />
                  <div style={{ width: 40, height: 8, borderRadius: 4, background: 'rgba(63,63,70,0.6)', marginLeft: 12, display: 'flex' }} />
                </div>
              </div>

              {/* Hero */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 28 }}>
                <div style={{ width: 200, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.15)', display: 'flex' }} />
                <div style={{ width: 160, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.07)', marginTop: 12, display: 'flex' }} />
                <div
                  style={{
                    width: 100,
                    height: 28,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    marginTop: 16,
                    display: 'flex',
                  }}
                />
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', marginTop: 24 }}>
                <div style={{ flex: 1, height: 60, borderRadius: 8, background: 'rgba(39,39,42,0.6)', border: '1px solid rgba(63,63,70,0.3)', display: 'flex' }} />
                <div style={{ flex: 1, height: 60, borderRadius: 8, background: 'rgba(39,39,42,0.6)', border: '1px solid rgba(63,63,70,0.3)', marginLeft: 12, display: 'flex' }} />
                <div style={{ flex: 1, height: 60, borderRadius: 8, background: 'rgba(39,39,42,0.6)', border: '1px solid rgba(63,63,70,0.3)', marginLeft: 12, display: 'flex' }} />
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
}
