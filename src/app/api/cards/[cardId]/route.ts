import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { businessCardPatchSchema } from '@/lib/business-cards/validation';

type RouteContext = { params: Promise<{ cardId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { cardId } = await params;
  const supabase = await createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('business_cards')
    .select('*')
    .eq('id', cardId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  return NextResponse.json({ card: data });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { cardId } = await params;
  const supabase = await createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = businessCardPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid card details' }, { status: 400 });

  const updates: Record<string, unknown> = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.status === 'published') updates.published_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('business_cards')
    .update(updates)
    .eq('id', cardId)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message || 'Card not found' }, { status: 404 });
  return NextResponse.json({ card: data });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { cardId } = await params;
  const supabase = await createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('business_cards')
    .delete()
    .eq('id', cardId)
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

