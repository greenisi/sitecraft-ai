import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { calculateSeoScore } from '@/lib/marketing/seo-scorer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase, project } = await requireProjectOwner(projectId);
    if (error) return error;

    // Fetch SEO metadata
    const { data: seoEntries } = await supabase!
      .from('seo_metadata')
      .select('*')
      .eq('project_id', projectId);

    // Fetch business info
    const { data: businessInfo } = await supabase!
      .from('business_info')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    // Fetch project details
    const { data: fullProject } = await supabase!
      .from('projects')
      .select('status, custom_domain, generation_config')
      .eq('id', projectId)
      .single();

    // Estimate page count from generation config
    const config = fullProject?.generation_config as Record<string, unknown> | null;
    const sections = (config?.sections as unknown[]) || [];
    const pageCount = Math.max(1, Math.ceil(sections.length / 3)); // rough estimate

    const score = calculateSeoScore({
      seoEntries: seoEntries || [],
      businessInfo,
      projectStatus: fullProject?.status || 'draft',
      hasCustomDomain: !!fullProject?.custom_domain,
      pageCount,
    });

    return NextResponse.json(score);
  } catch {
    return NextResponse.json({ error: 'Failed to calculate SEO score' }, { status: 500 });
  }
}
