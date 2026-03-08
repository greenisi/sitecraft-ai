import { NextResponse } from 'next/server';
import { requireProjectOwner } from '@/lib/project-auth';
import { getAnthropicClient, GENERATION_MODEL, withRetry } from '@/lib/ai/client';
import { buildSocialPostsPrompt } from '@/lib/ai/prompts/marketing-social';
import { buildGoogleBusinessProfileGuide } from '@/lib/ai/prompts/marketing-gbp';
import { buildAdCopyPrompt } from '@/lib/ai/prompts/marketing-ads';
import { generateAndUploadAdImage } from '@/lib/ai/image-gen';
import { calculateSeoScore } from '@/lib/marketing/seo-scorer';
import type { MarketingAction } from '@/types/marketing';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { error, supabase, project } = await requireProjectOwner(projectId);
    if (error) return error;

    const body = await request.json();
    const { type, options } = body as { type: MarketingAction; options?: Record<string, unknown> };

    // Fetch project config and business info for context
    const { data: fullProject } = await supabase!
      .from('projects')
      .select('generation_config, published_url, custom_domain')
      .eq('id', projectId)
      .single();

    const config = fullProject?.generation_config as Record<string, unknown> | null;
    const business = (config?.business as Record<string, string>) || {};

    const { data: businessInfo } = await supabase!
      .from('business_info')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    // Fetch services/products for social context
    const { data: services } = await supabase!
      .from('services')
      .select('name')
      .eq('project_id', projectId)
      .limit(10);

    const { data: products } = await supabase!
      .from('products')
      .select('name')
      .eq('project_id', projectId)
      .limit(10);

    const businessName = business.name || project!.name || 'Business';

    if (type === 'generate_seo') {
      // Forward to dedicated SEO generate endpoint using internal redirect
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const seoUrl = `${origin}/api/projects/${projectId}/seo/generate`;
      const seoRes = await fetch(seoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
      });
      if (!seoRes.ok) {
        const errText = await seoRes.text();
        throw new Error(`SEO generation failed: ${errText.slice(0, 200)}`);
      }
      const seoData = await seoRes.json();
      return NextResponse.json(seoData);
    }

    if (type === 'seo_score') {
      // Fetch SEO metadata directly
      const { data: seoEntries } = await supabase!
        .from('seo_metadata')
        .select('*')
        .eq('project_id', projectId);

      const config2 = fullProject?.generation_config as Record<string, unknown> | null;
      const sections = (config2?.sections as unknown[]) || [];
      const pageCount = Math.max(1, Math.ceil(sections.length / 3));

      const scoreData = calculateSeoScore({
        seoEntries: seoEntries || [],
        businessInfo: businessInfo as Record<string, unknown> | null,
        projectStatus: project!.status || 'draft',
        hasCustomDomain: !!fullProject?.custom_domain,
        pageCount,
      });

      const score = scoreData.score || 0;
      const failing = (scoreData.checklist || [])
        .filter((item) => item.status === 'fail')
        .map((item) => item.label);

      return NextResponse.json({
        success: true,
        summary: `Your SEO score is **${score}/${scoreData.maxScore}**.\n\n${
          failing.length > 0
            ? `**Needs attention:** ${failing.join(', ')}.`
            : 'All checks are passing!'
        }\n\nVisit your Marketing tab in the admin panel to see the full breakdown.`,
        score: scoreData,
      });
    }

    // AI-powered generation for social posts, ad copy, GBP guide
    const anthropic = getAnthropicClient();
    let prompt: string;

    if (type === 'social_posts') {
      prompt = buildSocialPostsPrompt({
        businessName,
        industry: business.industry,
        description: business.description,
        targetAudience: business.targetAudience,
        platforms: (options?.platforms as string[]) || ['instagram', 'facebook', 'x'],
        count: (options?.count as number) || 7,
        timeframe: (options?.timeframe as string) || 'this week',
        services: services?.map((s) => s.name),
        products: products?.map((p) => p.name),
        brandColor: (options?.brandColor as string) || 'orange',
        websiteUrl: fullProject?.published_url || fullProject?.custom_domain,
      });
    } else if (type === 'google_business_guide') {
      prompt = buildGoogleBusinessProfileGuide({
        businessName,
        industry: business.industry,
        description: business.description,
        address: businessInfo?.address,
        city: businessInfo?.city,
        state: businessInfo?.state,
        phone: businessInfo?.phone,
        website: fullProject?.published_url || fullProject?.custom_domain,
        services: services?.map((s) => s.name),
      });
    } else if (type === 'ad_copy') {
      prompt = buildAdCopyPrompt({
        businessName,
        industry: business.industry,
        description: business.description,
        targetAudience: business.targetAudience,
        platforms: (options?.platforms as string[]) || ['google_ads', 'meta_ads'],
        services: services?.map((s) => s.name),
        products: products?.map((p) => p.name),
        websiteUrl: fullProject?.published_url || fullProject?.custom_domain,
      });
    } else {
      return NextResponse.json({ error: 'Unknown marketing action type' }, { status: 400 });
    }

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
      throw new Error('Failed to parse AI marketing response');
    }

    // Store generated assets
    if (type === 'social_posts' && parsed.posts) {
      // Generate branded social media graphics with Nano Banana 2 in parallel (best-effort)
      const socialImagePromises = parsed.posts.map(
        async (post: Record<string, unknown>, idx: number) => {
          const headline = (post.visual_headline as string) || '';
          const subtext = (post.visual_subtext as string) || '';
          const platform = post.platform as string;
          if (!headline) return null; // skip if no headline for graphic

          const aspectRatio = platform === 'x' ? '16:9' as const : '1:1' as const;
          const imagePrompt = `Professional branded social media graphic for "${businessName}"${business.industry ? ` (${business.industry})` : ''}. Dark, sleek background with subtle tech/abstract textures. Bold white headline text: "${headline}". Smaller supporting text: "${subtext}". Orange accent color elements (lines, gradients, or highlights). Modern, polished, high-contrast design. The text should be clearly readable. Style: premium social media marketing post, dark mode aesthetic. No stock photo people. No cluttered elements.`;
          const fileName = `social-${platform}-${idx}-${Date.now()}`;
          try {
            return await generateAndUploadAdImage(
              supabase!,
              projectId,
              imagePrompt,
              fileName,
              aspectRatio
            );
          } catch {
            return null;
          }
        }
      );

      const socialImageUrls = await Promise.all(socialImagePromises);
      const imagesGenerated = socialImageUrls.filter(Boolean).length;

      const inserts = parsed.posts.map((post: Record<string, unknown>, idx: number) => ({
        project_id: projectId,
        asset_type: 'social_post',
        platform: post.platform,
        title: (post.visual_headline as string) || null,
        content: post.content,
        metadata: {
          hashtags: post.hashtags,
          image_suggestion: post.image_suggestion,
          visual_headline: post.visual_headline,
          visual_subtext: post.visual_subtext,
          post_type: post.post_type,
          best_time: post.best_time,
          image_url: socialImageUrls[idx] || null,
        },
        status: 'draft',
      }));

      await supabase!.from('marketing_assets').insert(inserts);

      return NextResponse.json({
        success: true,
        summary:
          (parsed.summary || `Created ${parsed.posts.length} social media posts for ${businessName}.`) +
          (imagesGenerated > 0
            ? ` Generated ${imagesGenerated} branded graphic${imagesGenerated > 1 ? 's' : ''} with Nano Banana 2.`
            : ''),
        assets: inserts,
      });
    }

    if (type === 'google_business_guide') {
      // Store the guide as a marketing asset
      await supabase!.from('marketing_assets').insert({
        project_id: projectId,
        asset_type: 'google_business_guide',
        platform: null,
        title: 'Google Business Profile Setup Guide',
        content: parsed.summary,
        metadata: { steps: parsed.steps },
        status: 'draft',
      });

      return NextResponse.json({
        success: true,
        summary: parsed.summary,
      });
    }

    if (type === 'ad_copy' && parsed.ads) {
      // Generate ad images with Nano Banana 2 in parallel (best-effort)
      const imagePromises = parsed.ads.map(
        async (ad: Record<string, unknown>, idx: number) => {
          const headlines = (ad.headlines as string[]) || [];
          const platform = ad.platform as string;
          const variation = ad.variation as string;
          const imagePrompt = `Professional ${platform === 'google_ads' ? 'search ad banner' : 'social media ad'} for "${businessName}"${business.industry ? ` (${business.industry})` : ''}. Headline: "${headlines[0] || businessName}". Style: clean, modern, commercial-quality marketing visual. No text overlays.`;
          const aspect = platform === 'meta_ads' ? '1:1' as const : '16:9' as const;
          const fileName = `ad-${variation || idx}-${Date.now()}`;
          try {
            return await generateAndUploadAdImage(
              supabase!,
              projectId,
              imagePrompt,
              fileName,
              aspect
            );
          } catch {
            return null;
          }
        }
      );

      const imageUrls = await Promise.all(imagePromises);

      const inserts = parsed.ads.map((ad: Record<string, unknown>, idx: number) => ({
        project_id: projectId,
        asset_type: 'ad_copy',
        platform: ad.platform as string,
        title: (ad.headlines as string[])?.[0] || null,
        content: [
          ...(ad.headlines as string[] || []).map((h: string) => `H: ${h}`),
          ...(ad.descriptions as string[] || []).map((d: string) => `D: ${d}`),
          `CTA: ${ad.cta || ''}`,
        ].join('\n'),
        metadata: {
          headlines: ad.headlines,
          descriptions: ad.descriptions,
          cta: ad.cta,
          variation: ad.variation,
          targeting_suggestion: ad.targeting_suggestion,
          image_url: imageUrls[idx] || null,
        },
        status: 'draft',
      }));

      await supabase!.from('marketing_assets').insert(inserts);

      const imagesGenerated = imageUrls.filter(Boolean).length;

      return NextResponse.json({
        success: true,
        summary:
          (parsed.summary || `Created ${parsed.ads.length} ad variations for ${businessName}.`) +
          (imagesGenerated > 0
            ? ` Generated ${imagesGenerated} ad visual${imagesGenerated > 1 ? 's' : ''} with Nano Banana 2.`
            : ''),
        budget_suggestion: parsed.budget_suggestion,
        assets: inserts,
      });
    }

    return NextResponse.json({
      success: true,
      summary: 'Marketing content generated successfully.',
    });
  } catch (err) {
    console.error('Marketing generation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate marketing content' },
      { status: 500 }
    );
  }
}
