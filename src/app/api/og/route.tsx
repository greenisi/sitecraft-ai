import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Load the logo from the public directory
    const logoUrl = new URL('/logo-transparent.png', request.url);
    const logoData = await fetch(logoUrl).then((res) => res.arrayBuffer());
    const logoBase64 = `data:image/png;base64,${Buffer.from(logoData).toString('base64')}`;

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
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle grid pattern overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              display: 'flex',
            }}
          />

          {/* Glow effect behind logo */}
          <div
            style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -55%)',
              display: 'flex',
            }}
          />

          {/* Logo */}
          <img
            src={logoBase64}
            width={160}
            height={160}
            style={{
              marginBottom: '24px',
            }}
          />

          {/* Brand name */}
          <div
            style={{
              fontSize: '52px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-1px',
              marginBottom: '12px',
              display: 'flex',
            }}
          >
            Innovated Marketing
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '24px',
              color: 'rgba(255, 255, 255, 0.6)',
              maxWidth: '600px',
              textAlign: 'center',
              lineHeight: 1.4,
              display: 'flex',
            }}
          >
            Create production-ready websites by chatting with AI
          </div>

          {/* Bottom accent bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa, #8b5cf6, #6366f1)',
              display: 'flex',
            }}
          />

          {/* Domain badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '16px',
            }}
          >
            app.innovated.marketing
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);

    // Fallback: simple text-only OG image
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
            background: '#0a0a0a',
            color: '#ffffff',
          }}
        >
          <div style={{ fontSize: '52px', fontWeight: 700, display: 'flex' }}>
            Innovated Marketing
          </div>
          <div
            style={{
              fontSize: '24px',
              color: 'rgba(255,255,255,0.6)',
              marginTop: '16px',
              display: 'flex',
            }}
          >
            AI-Powered Website Generator
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
