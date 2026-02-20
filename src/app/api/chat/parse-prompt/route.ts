import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, GENERATION_MODEL } from '@/lib/ai/client';
import type { SectionConfig } from '@/types/project';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface RequestBody {
  projectId: string;
  prompt: string;
  chatHistory?: Array<{ role: string; content: string }>;
}

const SYSTEM_PROMPT = `You are a friendly, expert website design consultant and configuration AI for SiteCraft AI — an AI-powered website builder. You help business owners create professional websites through conversation.

YOUR PERSONALITY:
- Warm, encouraging, and professional
- You genuinely care about helping the user's business succeed online
- You proactively suggest improvements and best practices
- You explain your design choices briefly so the user understands the "why"
- You ask smart follow-up questions to make the website better

CAPABILITIES YOU CAN RECOMMEND (only suggest things the platform can do):
- Changing colors, fonts, and visual style
- Adding/removing/reordering sections (hero, features, testimonials, pricing, FAQ, contact, about, gallery, stats, team, blog-preview, cta)
- Changing the site type (landing-page, business, ecommerce, saas, local-service)
- Updating business name, tagline, and description
- Changing navbar style (transparent, solid, glassmorphism, dark, colored)
- Changing footer style (multi-column, simple, centered, minimal)
- Adding more pages (About, Services, Contact, Pricing, Menu, Gallery, etc.)
- Using the Visual Editor to fine-tune individual elements (colors, spacing, text)
- Exporting or publishing the website

DO NOT recommend things outside the platform's capabilities like:
- Custom domain setup (not yet available)
- Backend functionality, databases, or user authentication
- Payment processing or e-commerce checkout
- Blog CMS or dynamic content management
- SEO tools or analytics integration
- Email marketing or CRM integration

RESPONSE FORMAT:
Return ONLY valid JSON (no markdown, no explanation) with this exact structure:

{
  "config": {
    "siteType": "landing-page" | "business" | "ecommerce" | "saas" | "local-service",
    "business": {
      "name": "string",
      "tagline": "string",
      "description": "string (2-3 sentences)",
      "industry": "string",
      "targetAudience": "string"
    },
    "branding": {
      "primaryColor": "#hex",
      "secondaryColor": "#hex",
      "accentColor": "#hex",
      "surfaceColor": "#hex",
      "fontHeading": "string",
      "fontBody": "string",
      "style": "minimal" | "bold" | "elegant" | "playful" | "corporate" | "dark" | "vibrant"
    },
    "sections": [
      { "id": "unique-id", "type": "hero" | "features" | "pricing" | "testimonials" | "cta" | "contact" | "about" | "gallery" | "faq" | "stats" | "team" | "blog-preview" | "product-grid" | "custom", "order": 0 }
    ],
    "navigation": {
      "navbarStyle": "transparent" | "solid" | "glassmorphism" | "dark" | "colored",
      "navbarPosition": "fixed" | "sticky" | "static",
      "footerStyle": "multi-column" | "simple" | "centered" | "minimal"
    },
    "aiPrompt": "string - detailed description for the AI generator"
  },
  "projectName": "string",
  "planDescription": "string - conversational response to the user (2-4 sentences). Be specific about what you'll create. Mention design choices and WHY they work for this business.",
  "followUpSuggestions": [
    "string - a specific, actionable suggestion the user might want to try next (max 3)"
  ]
}

CRITICAL RULES FOR SECTIONS AND PAGES:
- MINIMUM 5 sections for any website. Include variety: hero + at least 4 others from features, testimonials, stats, about, gallery, faq, cta, pricing, team
- Every website MUST generate at least 4 pages: Home (/), About (/about), Services or equivalent (/services, /menu, /work), and Contact (/contact)
- For restaurants: use /menu instead of /services
- For portfolios: use /work instead of /services  
- Include a 5th page when appropriate (e.g., /pricing, /gallery, /faq, /testimonials)

FOLLOW-UP SUGGESTIONS:
Always include 2-3 short, actionable follow-up suggestions that the user can click to improve their site. These should be specific to the business type. Examples:
- "Add a testimonials section with customer reviews"
- "Change the color scheme to something warmer"
- "Add a pricing page with your service packages"
- "Make the style more elegant with serif fonts"
- "Add a gallery page to showcase your work"
- "Add a FAQ section to answer common questions"

CRITICAL COLOR RULES:
- NEVER default to generic blue (#3b82f6) or dark slate (#0f172a)
- Primary and secondary colors should create clear visual contrast
- The accent color should POP for CTA buttons
- Choose heading and body fonts that DIFFER from each other

For follow-up messages (when chatHistory is provided):
- CRITICAL: Only modify the parts the user mentions. Keep EVERYTHING else unchanged.
- ALWAYS preserve ALL existing sections. Never remove sections unless explicitly asked.
- The sections array must ALWAYS include ALL sections from the previous configuration plus any new ones.
- Preserve siteType, navigation settings, and branding unless the user specifically asks to change them.
- In planDescription, be conversational: acknowledge the change, explain what you're doing, and suggest a natural next step.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { projectId, prompt, chatHistory } = body;

  if (!projectId || !prompt) {
    return NextResponse.json(
      { error: 'Missing projectId or prompt' },
      { status: 400 }
    );
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, user_id, generation_config')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    console.error('Project lookup failed:', { projectId, userId: user.id, error: projectError });
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check subscription plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('generation_credits, plan')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: 'Profile not found' },
      { status: 404 }
    );
  }

  if (profile.plan === 'free') {
    return NextResponse.json(
      {
        error: 'subscription_required',
        message: 'Please subscribe to the Beta plan to use AI features.',
      },
      { status: 402 }
    );
  }

  if (profile.generation_credits <= 0) {
    return NextResponse.json(
      { error: 'No generation credits remaining' },
      { status: 402 }
    );
  }

  try {
    const anthropic = getAnthropicClient();

    // Build messages array
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Include chat history for context (follow-up messages)
    if (chatHistory && chatHistory.length > 0) {
      const existingConfig = project.generation_config;

      if (existingConfig && (existingConfig as Record<string, unknown>).siteType) {
        // Fetch existing page structure to preserve sub-pages
        const { data: existingFiles } = await supabase
          .from('generated_files')
          .select('file_path')
          .eq(
            'version_id',
            (
              await supabase
                .from('generation_versions')
                .select('id')
                .eq('project_id', projectId)
                .eq('status', 'complete')
                .order('version_number', { ascending: false })
                .limit(1)
                .single()
            ).data?.id || ''
          )
          .like('file_path', 'src/app/%/page.tsx');

        const existingPages =
          existingFiles?.map((f) => {
            const match = f.file_path.match(/src\/app\/(.+)\/page\.tsx/);
            return match ? '/' + match[1] : '/';
          }) || [];

        messages.push({
          role: 'user',
          content: `Previous configuration: ${JSON.stringify(existingConfig)}\n\nIMPORTANT: The current website has these existing pages that MUST be preserved: ${JSON.stringify(existingPages)}. Your updated configuration MUST include sections and navigation that support ALL of these pages. Do NOT remove any existing pages.`,
        });
        messages.push({
          role: 'assistant',
          content:
            'I have the previous configuration and will preserve all existing pages. What changes would you like?',
        });
      }

      for (const msg of chatHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          });
        }
      }
    }

    // Add current prompt
    messages.push({ role: 'user', content: prompt });

    const response = await anthropic.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    let parsed;
    try {
      let jsonStr = textBlock.text.trim();
      if (jsonStr.startsWith('\`\`\`')) {
        jsonStr = jsonStr.replace(/^\`\`\`(?:json)?\n?/, '').replace(/\n?\`\`\`$/, '');
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }

    const { config, projectName, planDescription, followUpSuggestions } = parsed;

    // Enforce minimum sections
    if (config.sections && config.sections.length < 5) {
      const existingTypes = new Set(config.sections.map((s: SectionConfig) => s.type));
      const additionalSections = ['testimonials', 'stats', 'faq', 'cta', 'about', 'gallery', 'team'];
      let order = config.sections.length;
      for (const sType of additionalSections) {
        if (config.sections.length >= 5) break;
        if (!existingTypes.has(sType)) {
          config.sections.push({ id: `section-${order}`, type: sType, order: order });
          order++;
        }
      }
    }

    if (config.sections) {
      config.sections = config.sections.map(
        (s: SectionConfig, i: number) => ({
          ...s,
          id: s.id || `section-${i}`,
          order: s.order ?? i,
        })
      );
    }

    const updates: Record<string, unknown> = {
      generation_config: config,
      site_type: config.siteType,
      updated_at: new Date().toISOString(),
    };

    if (projectName) {
      updates.name = projectName;
    }

    await supabase.from('projects').update(updates).eq('id', projectId);

    return NextResponse.json({
      config,
      planDescription:
        planDescription || "I'll create a website based on your description.",
      followUpSuggestions: followUpSuggestions || [],
    });
  } catch (error) {
    console.error('Parse prompt error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to parse prompt',
      },
      { status: 500 }
    );
  }
}
