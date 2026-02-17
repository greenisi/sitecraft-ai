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

const SYSTEM_PROMPT = `You are a website configuration expert. Given a user's natural language description, extract structured configuration for an AI website generator.

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "config": {
    "siteType": "landing-page" | "business" | "ecommerce" | "saas" | "local-service",
    "business": {
      "name": "string - business name from prompt, or generate a good one",
      "tagline": "string - short tagline",
      "description": "string - what the business does (2-3 sentences)",
      "industry": "string - industry category",
      "targetAudience": "string - who the website is for"
    },
    "branding": {
      "primaryColor": "#hex - choose a UNIQUE color that matches the business type and mood",
      "secondaryColor": "#hex - complementary or contrasting color",
      "accentColor": "#hex - accent color for CTAs — should pop against primary",
      "surfaceColor": "#hex - background color (light like #ffffff or dark like #0f0f23)",
      "fontHeading": "string - one of: Inter, DM Sans, Space Grotesk, Plus Jakarta Sans, Outfit, Sora, Poppins, Manrope, Playfair Display, Lora",
      "fontBody": "string - one of the same font options (should differ from heading font for variety)",
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
    "aiPrompt": "string - a detailed description of the website to generate, including design preferences, content style, and any specific requirements mentioned by the user. Include notes about desired mood, visual approach, and unique design elements."
  },
  "projectName": "string - a good project name based on the business",
  "planDescription": "string - a 2-3 sentence description of what you'll build, written in first person (I'll create...). Be specific about sections, colors, and style."
}

CRITICAL: Every website must have a UNIQUE visual identity. Follow these industry-specific guidelines:

Landscaping/Outdoor: Greens (#15803d, #4d7c0f, #059669), earth tones, or autumn oranges (#b45309). Bold or organic style. Pair with warm accents (gold, orange).
Restaurants/Food: Deep warm colors — burgundy (#9f1239), terracotta (#c2410c), burnt orange (#ea580c), or rich brown (#78350f). Elegant or warm-rustic style. Use Playfair Display or Lora headings.
Tech/SaaS: Electric indigo (#4f46e5), deep violet (#6d28d9), crisp blue (#2563eb), or carbon dark (#18181b). Minimal or dark-modern style. Use Space Grotesk or Inter headings.
Healthcare/Wellness: Calming blues (#0369a1), healing greens (#16a34a), or lavender (#7c3aed). Clean minimal style. Friendly, approachable fonts.
Real Estate/Luxury: Black (#1c1917), navy (#1e3a5f), emerald (#064e3b), or champagne rose (#9f1239). Elegant style. Use Playfair Display.
Fitness/Sports: High-energy — red (#dc2626), orange (#ea580c), or dark (#18181b) with neon accents. Bold style. Strong typography.
Education: Friendly blues (#2563eb), teals (#0d9488), or greens (#16a34a). Clean, approachable style. Poppins or DM Sans.
Creative/Design/Agency: Bold unconventional — neon pink (#e11d48), electric purple (#9333ea), lime (#65a30d), or cosmic (#7c3aed). Playful or vibrant style.
Legal/Finance: Navy (#1e3a5f), slate (#334155), or deep blue (#1d4ed8). Corporate or elegant style. Classic serif headings.
Construction/Trades: Strong oranges (#ea580c), reds (#dc2626), or deep blue (#1e40af). Bold or corporate style.

IMPORTANT COLOR RULES:
- NEVER default to generic blue (#3b82f6) or dark slate (#0f172a) for every site
- Primary and secondary colors should create clear visual contrast
- The accent color should POP — it's used for CTA buttons and highlights
- For a given industry, vary the specific shade and approach each time
- Choose heading and body fonts that DIFFER from each other (e.g., Playfair Display + Inter, NOT Inter + Inter)

SECTION VARIETY:
- Don't always use the same section order. Vary it based on the business.
- Some sites should lead with stats, some with testimonials, some with features
- Include 4-6 sections for variety, not always the same 4

For follow-up messages (when chatHistory is provided):
- Only modify the parts the user mentions
- Keep everything else from the previous configuration
- If the user says "add pricing" - add a pricing section
- If the user says "make it more colorful" - adjust colors
- If the user says "change the name" - update business name`;

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
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

    // ── Check subscription plan ─────────────────────────────────────────
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
            { error: 'subscription_required', message: 'Please subscribe to the Beta plan to use AI features.' },
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
        messages.push({
          role: 'user',
          content: `Previous configuration: ${JSON.stringify(existingConfig)}`,
        });
        messages.push({
          role: 'assistant',
          content: 'I have the previous configuration. What changes would you like?',
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
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }

    const { config, projectName, planDescription } = parsed;

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
    });
  } catch (error) {
    console.error('Parse prompt error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to parse prompt',
      },
      { status: 500 }
    );
  }
}
