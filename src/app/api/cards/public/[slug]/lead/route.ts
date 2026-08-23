import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cardLeadSchema } from '@/lib/business-cards/validation';

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const raw = await request.json().catch(() => null);
  if (raw?.company_website) return NextResponse.json({ ok: true });
  const parsed = cardLeadSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Enter your name and a valid email.' }, { status: 400 });

  const admin = createAdminClient();
  const { data: card } = await admin
    .from('business_cards')
    .select('id, user_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const { error } = await admin.from('business_card_leads').insert({
    card_id: card.id,
    owner_user_id: card.user_id,
    ...parsed.data,
  });
  if (error) return NextResponse.json({ error: 'Could not exchange contact details.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

