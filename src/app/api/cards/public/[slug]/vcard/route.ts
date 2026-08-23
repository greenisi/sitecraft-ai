import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = { params: Promise<{ slug: string }> };

function escapeVCard(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function websiteUrl(value: string) {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: card } = await admin
    .from('business_cards')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCard(card.full_name)}`,
    `N:${escapeVCard(card.full_name)};;;;`,
    card.company ? `ORG:${escapeVCard(card.company)}` : '',
    card.job_title ? `TITLE:${escapeVCard(card.job_title)}` : '',
    card.email ? `EMAIL;TYPE=INTERNET:${escapeVCard(card.email)}` : '',
    card.phone ? `TEL;TYPE=CELL:${escapeVCard(card.phone)}` : '',
    card.website ? `URL:${escapeVCard(websiteUrl(card.website))}` : '',
    card.location ? `ADR;TYPE=WORK:;;${escapeVCard(card.location)};;;;` : '',
    card.bio ? `NOTE:${escapeVCard(card.bio)}` : '',
    'END:VCARD',
  ].filter(Boolean).join('\r\n');

  await admin
    .from('business_cards')
    .update({ save_count: (card.save_count || 0) + 1 })
    .eq('id', card.id);

  const filename = `${card.full_name || 'contact'}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  return new NextResponse(lines, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename || 'contact'}.vcf"`,
      'Cache-Control': 'no-store',
    },
  });
}

