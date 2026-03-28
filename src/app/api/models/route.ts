import { NextResponse } from 'next/server';
import { getAvailableTiers } from '@/lib/ai/models';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isPro = searchParams.get('plan') === 'pro';
  const tiers = getAvailableTiers(isPro);
  
  // Strip internal details, return only what frontend needs
  const safe = tiers.map(t => ({
    tier: t.tier,
    displayName: t.displayName,
    description: t.description,
    badge: t.badge,
    requiresPro: t.requiresPro,
  }));

  return NextResponse.json({ models: safe });
}
