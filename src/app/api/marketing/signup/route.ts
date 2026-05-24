import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendMarketingWelcome } from '@/lib/email/send';

/**
 * POST /api/marketing/signup
 *   Captures a prospect from a vertical landing page. Public endpoint.
 *   Light rate limit by IP + email to keep abuse low.
 *   Fires a vertical-aware welcome email via Resend (non-blocking — email
 *   failure does NOT fail the signup; we log and move on).
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VERTICAL_LABELS: Record<string, string> = {
  'pressure-washing': 'pressure washing',
  'lawn-care':        'lawn care',
  'junk-removal':     'junk removal',
  'painting':         'painting',
  'hvac':             'HVAC',
  'roofing':          'roofing',
  'plumbing':         'plumbing',
  'electrical':       'electrical',
  'landscaping':      'landscaping',
  'general':          'home service',
};
const ALLOWED_VERTICALS = new Set(Object.keys(VERTICAL_LABELS));

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  const vertical = String(body.vertical ?? '').trim().toLowerCase();
  const businessName = body.businessName ? String(body.businessName).trim().slice(0, 120) : null;

  if (!EMAIL.test(email)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  if (!ALLOWED_VERTICALS.has(vertical)) return NextResponse.json({ error: 'Unknown vertical' }, { status: 400 });

  const admin = createAdminClient();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
  const ua = request.headers.get('user-agent')?.slice(0, 480) || null;

  // De-dupe: same (email, vertical) within last hour returns OK silently.
  const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
  const { data: existing } = await admin
    .from('marketing_signups')
    .select('id')
    .eq('email', email)
    .eq('vertical', vertical)
    .gte('created_at', oneHourAgo)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const { data: inserted, error } = await admin.from('marketing_signups').insert({
    email,
    vertical,
    business_name: businessName,
    source: body.source ? String(body.source).slice(0, 80) : 'landing_form',
    utm_source:   body.utm_source   ? String(body.utm_source).slice(0, 80)   : null,
    utm_medium:   body.utm_medium   ? String(body.utm_medium).slice(0, 80)   : null,
    utm_campaign: body.utm_campaign ? String(body.utm_campaign).slice(0, 80) : null,
    utm_content:  body.utm_content  ? String(body.utm_content).slice(0, 80)  : null,
    referrer:     body.referrer     ? String(body.referrer).slice(0, 480)    : null,
    user_agent: ua,
    ip,
  }).select('id').single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire welcome email. Non-blocking: if Resend isn't configured or sending
  // fails, we still return success — the signup IS captured in the DB.
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.innovated.marketing';
    const startUrl =
      `${appUrl}/start?signup=${inserted.id}` +
      `&vertical=${encodeURIComponent(vertical)}` +
      (businessName ? `&business=${encodeURIComponent(businessName)}` : '');
    const result = await sendMarketingWelcome({
      to: email,
      businessName,
      vertical,
      verticalLabel: VERTICAL_LABELS[vertical] ?? vertical,
      startUrl,
    });
    if (!result.ok) {
      console.warn('marketing welcome email send failed:', result.error);
    }
  } catch (e) {
    console.warn('marketing welcome email exception:', e);
  }

  return NextResponse.json({ ok: true });
}
