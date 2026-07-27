import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { suggestCapabilities } from '@/lib/ai/capabilities';
import type { GenerationConfig } from '@/types/project';

/**
 * What this business should add to its site next.
 *
 * Suggestions are derived from the business itself, not from a fixed upsell
 * list: a restaurant is offered ordering and reservations, a contractor quote
 * requests and a work gallery, a law firm consultation requests. Anything the
 * owner has already accepted is filtered out, so the panel empties as they
 * work through it rather than nagging.
 */
export const dynamic = 'force-dynamic';

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
  if (!config?.business) {
    return NextResponse.json({ suggestions: [] });
  }

  const accepted = Array.isArray((project as { accepted_capabilities?: string[] }).accepted_capabilities)
    ? (project as { accepted_capabilities?: string[] }).accepted_capabilities!
    : [];

  const suggestions = suggestCapabilities(config, accepted).map((entry) => ({
    id: entry.capability.id,
    label: entry.capability.label,
    whatItDoes: entry.capability.whatItDoes,
    reason: entry.reason,
    adminLabel: entry.capability.adminLabel,
    adminHref: `/projects/${projectId}/${entry.capability.adminPath}`,
  }));

  return NextResponse.json({ suggestions });
}
