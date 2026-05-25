import { notFound } from 'next/navigation';
import { VERTICALS } from './vertical-config';
import { LandingClient } from './landing-client';

export const dynamic = 'force-static';
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing';

export function generateStaticParams() {
  return Object.keys(VERTICALS).map(v => ({ vertical: v }));
}

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  const cfg = VERTICALS[vertical];
  if (!cfg) return {};
  const url = `${SITE_URL}/for/${vertical}`;
  // Per-vertical title tuned for the search query the buyer actually types
  // (e.g. "pressure washing website builder", "hvac website").
  const title = `${humanLabel(vertical)} Website Builder — AI Site in 60 Seconds | SiteCraft`;
  return {
    title,
    description: cfg.hero.sub,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description: cfg.hero.sub,
      url,
      siteName: 'SiteCraft',
      type: 'website',
      images: [
        { url: `${SITE_URL}/api/og/vertical?slug=${vertical}`, width: 1200, height: 630, alt: cfg.hero.h1 },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: cfg.hero.sub,
      images: [`${SITE_URL}/api/og/vertical?slug=${vertical}`],
    },
  };
}

function humanLabel(slug: string): string {
  return slug.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ');
}

// JSON-LD structured data — tells Google "this page IS for X-trade business owners"
// and renders a SoftwareApplication rich result for SiteCraft itself.
function jsonLd(vertical: string, cfg: typeof VERTICALS[string]) {
  const url = `${SITE_URL}/for/${vertical}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: cfg.hero.h1,
        description: cfg.hero.sub,
        isPartOf: { '@type': 'WebSite', name: 'SiteCraft', url: SITE_URL },
        about: { '@type': 'Thing', name: `${humanLabel(vertical)} business` },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'SiteCraft',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free to build, paid to publish' },
        audience: { '@type': 'Audience', audienceType: `${humanLabel(vertical)} business owners` },
      },
      {
        '@type': 'FAQPage',
        mainEntity: cfg.faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
}

export default async function VerticalLanding({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  const cfg = VERTICALS[vertical];
  if (!cfg) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(vertical, cfg)) }}
      />
      <LandingClient cfg={cfg} />
    </>
  );
}
