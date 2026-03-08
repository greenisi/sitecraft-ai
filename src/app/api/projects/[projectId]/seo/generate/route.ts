import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { getAnthropicClient, GENERATION_MODEL, withRetry } from '@/lib/ai/client';
import { buildSeoGenerationPrompt } from '@/lib/ai/prompts/marketing-seo';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase, project } = await requireProjectOwner(projectId);
    if (error) return error;

    // Fetch project details for context
    const { data: fullProject } = await supabase!
      .from('projects')
      .select('generation_config, published_url, custom_domain, status')
      .eq('id', projectId)
      .single();

    const config = fullProject?.generation_config as Record<string, unknown> | null;

    // Fetch business info
    const { data: businessInfo } = await supabase!
      .from('business_info')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    // Determine pages from generation config
    const pages = ['/']; // Always include homepage
    const sections = (config?.sections as Array<{ type: string }>) || [];
    const sectionTypes = new Set(sections.map((s) => s.type));
    if (sectionTypes.has('about') || sectionTypes.has('team')) pages.push('/about');
    if (sectionTypes.has('contact')) pages.push('/contact');

    // Check for generated page files
    const { data: latestVersion } = await supabase!
      .from('generation_versions')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'complete')
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestVersion) {
      const { data: files } = await supabase!
        .from('generated_files')
        .select('file_path')
        .eq('version_id', latestVersion.id)
        .like('file_path', 'src/app/%/page.tsx');

      if (files) {
        for (const f of files) {
          const match = f.file_path.match(/src\/app\/(.+)\/page\.tsx/);
          if (match && match[1] !== '(site)') {
            const pagePath = '/' + match[1].replace(/[()]/g, '');
            if (!pages.includes(pagePath)) pages.push(pagePath);
          }
        }
      }
    }

    const business = (config?.business as Record<string, string>) || {};

    const prompt = buildSeoGenerationPrompt({
      businessName: business.name || project!.name || 'Business',
      industry: business.industry,
      description: business.description,
      targetAudience: business.targetAudience,
      siteType: config?.siteType as string,
      pages,
      location: businessInfo
        ? { city: businessInfo.city, state: businessInfo.state, country: businessInfo.country }
        : undefined,
    });

    const anthropic = getAnthropicClient();

    const response = await withRetry(() =>
      anthropic.messages.create({
        model: GENERATION_MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })
    );

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    let parsed;
    try {
      let jsonStr = textBlock.text.trim();
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error('Failed to parse AI SEO response');
    }

    // Upsert SEO entries
    const seoEntries = [];
    for (const page of parsed.pages || []) {
      const canonicalBase = fullProject?.custom_domain
        ? `https://${fullProject.custom_domain}`
        : fullProject?.published_url || '';

      const { data: entry, error: upsertError } = await supabase!
        .from('seo_metadata')
        .upsert(
          {
            project_id: projectId,
            page_path: page.page_path,
            meta_title: page.meta_title,
            meta_description: page.meta_description,
            keywords: page.keywords || [],
            og_title: page.og_title || page.meta_title,
            og_description: page.og_description || page.meta_description,
            og_type: 'website',
            twitter_card: 'summary_large_image',
            twitter_title: page.meta_title,
            twitter_description: page.meta_description,
            schema_markup: page.schema_markup || {},
            canonical_url: canonicalBase ? `${canonicalBase}${page.page_path}` : null,
            robots: 'index, follow',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'project_id,page_path' }
        )
        .select()
        .single();

      if (!upsertError && entry) seoEntries.push(entry);
    }

    return NextResponse.json({
      success: true,
      summary: parsed.summary || `Generated SEO metadata for ${seoEntries.length} pages.`,
      seoData: seoEntries,
    });
  } catch (err) {
    console.error('SEO generation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate SEO' },
      { status: 500 }
    );
  }
}
