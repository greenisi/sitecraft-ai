import { ImageResponse } from 'next/og';
import { VERTICALS } from '@/app/for/[vertical]/vertical-config';

export const runtime = 'edge';

/**
 * GET /api/og/vertical?slug=pressure-washing
 *
 * Per-vertical OG image so social cards (Twitter, LinkedIn, Discord, iMessage
 * previews) look custom for each trade landing. Edge-rendered so it scales
 * to whatever traffic the campaigns drive.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get('slug') || 'general').toLowerCase();
  const cfg = VERTICALS[slug] ?? VERTICALS.general;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '80px', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
          color: 'white', fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{
          fontSize: 22, color: '#7dd3fc', textTransform: 'uppercase',
          letterSpacing: '0.18em', marginBottom: 24,
        }}>
          {cfg.hero.eyebrow}
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, marginBottom: 32 }}>
          {cfg.hero.h1}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 24, color: '#a3a3a3' }}>
          <div style={{
            background: 'white', color: '#0a0a0a', padding: '10px 22px',
            borderRadius: 999, fontWeight: 600,
          }}>
            SiteCraft
          </div>
          <div>{cfg.hero.cta}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
