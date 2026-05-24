import { NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { validateWhois } from '@/lib/domains/contact';

/**
 * GET  /api/profile/whois  → { contact: WhoisContact | null }
 * PUT  /api/profile/whois  body: WhoisContact  → saves, returns { ok: true }
 */

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { message: 'Unauthorized', code: 'AUTH_ERROR' } }, { status: 401 });
  }
  const { data } = await supabase
    .from('profiles')
    .select('whois_contact')
    .eq('id', user.id)
    .single();
  return NextResponse.json({ contact: data?.whois_contact ?? null });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: { message: 'Unauthorized', code: 'AUTH_ERROR' } }, { status: 401 });
  }

  const body = await request.json();
  const v = validateWhois(body);
  if (!v.ok) {
    return NextResponse.json(
      { error: { message: v.error, code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('profiles')
    .update({ whois_contact: v.value })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: { message: error.message, code: 'DB_ERROR' } }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
