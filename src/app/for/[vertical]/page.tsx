import { notFound } from 'next/navigation';
import { VERTICALS } from './vertical-config';
import { LandingClient } from './landing-client';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(VERTICALS).map(v => ({ vertical: v }));
}

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  const cfg = VERTICALS[vertical];
  if (!cfg) return {};
  return {
    title: `${cfg.hero.h1} — SiteCraft`,
    description: cfg.hero.sub,
    openGraph: {
      title: cfg.hero.h1,
      description: cfg.hero.sub,
    },
  };
}

export default async function VerticalLanding({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  const cfg = VERTICALS[vertical];
  if (!cfg) notFound();
  return <LandingClient cfg={cfg} />;
}
