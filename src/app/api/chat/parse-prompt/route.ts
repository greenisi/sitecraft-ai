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
      "primaryColor": "#hex - choose a color that matches the business type",
      "secondaryColor": "#hex - complementary color",
      "accentColor": "#hex - accent color for CTAs",
      "fontHeading": "string - one of: Inter, DM Sans, Space Grotesk, Plus Jakarta Sans, Outfit, Sora, Poppins, Manrope, Playfair Display, Lora",
      "fontBody": "string - one of the same font options",
      "style": "minimal" | "bold" | "elegant" | "playful" | "corporate"
    },
    "sections": [
      { "id": "unique-id", "type": "hero" | "features" | "pricing" | "testimonials" | "cta" | "contact" | "about" | "gallery" | "faq" | "stats" | "team" | "blog-preview" | "product-grid" | "custom", "order": 0 }
    ],
    "aiPrompt": "string - a detailed description of the website to generate, including design preferences, content style, and any specific requirements mentioned by the user"
  },
  "projectName": "string - a good project name based on the business",
  "planDescription": "string - a 2-3 sentence description of what you'll build, written in first person (I'll create...). Be specific about sections, colors, and style."
}

Guidelines for choosing configuration:
- For landscaping/outdoor businesses: use green/earth tones, "bold" or "minimal" style
- For restaurants/food: warm colors, "elegant" or "playful" style, include gallery
- For tech/SaaS: blue/purple tones, "minimal" or "corporate" style, include pricing + features
- For local services (plumbing, cleaning, etc.): use "local-service" type, include contact + testimonials + stats
- For e-commerce: include product-grid, pricing sections
- Always include hero and at least 3-4 other sections
- Choose fonts that match the style (Playfair Display for elegant, Inter/Space Grotesk for minimal/tech, Poppins for playful)
- Generate realistic, contextual business descriptions

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
