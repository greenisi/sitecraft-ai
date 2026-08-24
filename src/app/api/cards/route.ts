import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { businessCardInputSchema } from '@/lib/business-cards/validation';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'card';
}

export async function GET() {
  const supabase = await createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('business_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cards: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = businessCardInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please complete the required card details.' }, { status: 400 });
  }

  const base = slugify(parsed.data.full_name || parsed.data.name);
  let slug = base;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: existing } = await supabase
      .from('business_cards')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const { data, error } = await supabase
    .from('business_cards')
    .insert({
      ...parsed.data,
      user_id: user.id,
      slug,
      published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ card: data }, { status: 201 });
}

