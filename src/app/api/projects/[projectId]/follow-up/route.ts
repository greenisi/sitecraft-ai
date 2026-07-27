import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { buildFollowUpQuestions, VISIBLE_ON_SITE } from '@/lib/intake/follow-up-questions';
import type { GenerationConfig } from '@/types/project';

export const dynamic = 'force-dynamic';

/**
 * The questions we ask once the site exists.
 *
 * Anything already known is returned as a prefilled answer rather than asked
 * again -- an owner who typed their phone number into the brief should not be
 * asked for it a second time.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { error: authError, supabase, project } = await requireProjectOwner(projectId);
  if (authError || !supabase || !project) {
    return authError || NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const config = (project as { generation_config?: GenerationConfig }).generation_config;
  const questions = buildFollowUpQuestions({
    industry: config?.business?.industry,
    description: config?.business?.description,
    siteType: config?.siteType,
  });

  const { data: info } = await supabase
    .from('business_info')
    .select('phone, email, hours, logo_url, service_area')
    .eq('project_id', projectId)
    .maybeSingle();

  const saved = (project as { follow_up_answers?: Record<string, string> }).follow_up_answers || {};
  const row = (info || {}) as Record<string, unknown>;

  const answers: Record<string, unknown> = {
    ...saved,
    lead_email: row.email || '',
    phone: row.phone || '',
    hours: row.hours || {},
    logo: row.logo_url || '',
    service_area: row.service_area || '',
  };

  return NextResponse.json({ ...questions, answers });
}

/**
 * Saves answers and reports whether the site itself should be updated.
 *
 * Practical answers go to business_info, where the rest of the product already
 * reads them: the lead email starts routing alerts immediately, hours feed
 * booking validation, the logo replaces the generated wordmark. Probing
 * answers are kept on the project so a later edit can use the owner's own
 * words rather than the model's guess.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { error: authError, supabase, project } = await requireProjectOwner(projectId);
  if (authError || !supabase || !project) {
    return authError || NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const answers = (body.answers || {}) as Record<string, string>;

  const email = (answers.lead_email || '').trim();
  if (email && !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 });
  }

  // Only write fields the owner actually filled in; a blank answer must not
  // wipe a value they set elsewhere in the dashboard.
  const businessInfo: Record<string, unknown> = { project_id: projectId };
  if (email) businessInfo.email = email;
  if ((answers.phone || '').trim()) businessInfo.phone = answers.phone.trim();
  if ((answers.service_area || '').trim()) businessInfo.service_area = answers.service_area.trim();
  if ((answers.logo || '').trim()) businessInfo.logo_url = answers.logo.trim();
  if (body.hours && typeof body.hours === 'object') businessInfo.hours = body.hours;

  if (Object.keys(businessInfo).length > 1) {
    const { error: upsertError } = await supabase
      .from('business_info')
      .upsert(businessInfo, { onConflict: 'project_id' });
    if (upsertError) {
      return NextResponse.json({ error: 'Could not save your answers.' }, { status: 500 });
    }
  }

  await supabase
    .from('projects')
    .update({ follow_up_answers: answers })
    .eq('id', projectId);

  // Anything a visitor would notice is worth rebuilding for; a lead email
  // change is plumbing and takes effect without touching the site.
  const changedVisible = Object.entries(answers)
    .filter(([id, value]) => VISIBLE_ON_SITE.has(id) && String(value || '').trim())
    .map(([id]) => id);

  return NextResponse.json({
    saved: true,
    shouldUpdateSite: changedVisible.length > 0,
    editInstruction: changedVisible.length > 0 ? buildEditInstruction(answers) : null,
    leadEmailSet: Boolean(email),
  });
}

function buildEditInstruction(answers: Record<string, string>): string {
  const parts: string[] = [];
  if (answers.logo?.trim()) parts.push(`Use the uploaded logo at ${answers.logo.trim()} in the navbar and footer instead of the generated wordmark.`);
  if (answers.phone?.trim()) parts.push(`Use the real phone number ${answers.phone.trim()} everywhere a number appears.`);
  if (answers.service_area?.trim()) parts.push(`The business serves: ${answers.service_area.trim()}. Say so on the homepage and in the footer, and use these places in the copy instead of invented ones.`);

  const probes = Object.entries(answers)
    .filter(([id, value]) => id.startsWith('probe_') && String(value || '').trim())
    .map(([, value]) => String(value).trim());
  if (probes.length > 0) {
    parts.push(`The owner describes the business like this — use their words and priorities, and correct anything on the site that contradicts them: ${probes.join(' | ')}`);
  }

  return `Update the site with the owner's real details. ${parts.join(' ')} Change only what these details affect; leave the rest of the design alone.`;
}
