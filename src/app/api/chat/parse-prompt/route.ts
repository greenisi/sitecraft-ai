import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient as createClient } from '@/lib/supabase/server';
import { getAnthropicClient, GENERATION_MODEL } from '@/lib/ai/client';
import type { SectionConfig } from '@/types/project';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface RequestBody {
    projectId: string;
    prompt: string;
    chatHistory?: Array<{ role: string; content: string }>;
}

const SYSTEM_PROMPT = `You are a friendly, expert website design consultant and configuration AI for Innovated Marketing \u2014 an AI-powered website builder. You help business owners create professional websites through conversation.

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
- Users can upload images and logos that will be used on their website
- SEO optimization (meta titles, descriptions, keywords, schema markup, SEO score)
- Social media post generation (Instagram, Facebook, X/Twitter)
- Google Business Profile setup guidance
- Ad copy generation (coming soon)

DO NOT recommend or suggest things outside the platform's capabilities. These will BREAK the website or confuse the user:
- Custom domain setup (coming soon)
- Backend functionality, databases, or user authentication
- Payment processing or e-commerce checkout (no Stripe, PayPal, etc.)
- Blog CMS or dynamic content management
- Email marketing or CRM integration (coming soon)
- Interactive features like chatbots, search bars with real search, live feeds
- Animations beyond what Tailwind CSS provides (no Framer Motion, GSAP, etc.)
- Third-party API integrations or plugins
- Form submissions that connect to external services (forms are static/visual only unless using the built-in contact form component)
- Dark mode toggle (the site has a fixed theme, not a toggle)
- Multi-language/i18n support

RESPONSE FORMAT:
Return ONLY valid JSON (no markdown, no explanation).

You have FOUR modes:

MODE 1 - CONVERSATION (use when you need more info from the user):
{
  "mode": "conversation",
  "planDescription": "Your conversational response with questions. Be warm, specific, and ask 2-4 focused questions.",
  "followUpSuggestions": ["Quick reply option 1", "Quick reply option 2", "Quick reply option 3"]
}

MODE 2 - GENERATE (use ONLY for first-time website creation or MAJOR redesigns):
{
  "mode": "generate",
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
    "aiPrompt": "string - detailed description for the AI generator."
  },
  "projectName": "string",
  "planDescription": "string",
  "followUpSuggestions": ["string"]
}

MODE 3 - EDIT (use for surgical changes to an ALREADY GENERATED website):
{
  "mode": "edit",
  "editInstructions": "Detailed description of exactly what to change in the targeted files. Be specific about text changes, color changes, layout changes, etc.",
  "targetFiles": ["src/components/Hero.tsx", "src/components/Navbar.tsx"],
  "planDescription": "Conversational response explaining what you will change (1-2 sentences).",
  "followUpSuggestions": ["string"]
}

MODE 4 - MARKETING (use for SEO, social media, ads, and business growth tasks):
{
  "mode": "marketing",
  "marketingAction": "generate_seo" | "seo_score" | "google_business_guide" | "social_posts" | "ad_copy",
  "marketingOptions": {},
  "planDescription": "Conversational response explaining what you will do.",
  "followUpSuggestions": ["string"]
}

marketingOptions examples:
- For social_posts: { "platforms": ["instagram", "facebook", "x"], "count": 7, "timeframe": "this week" }
- For generate_seo: { "pages": ["/", "/about", "/contact"] }
- For ad_copy: { "platforms": ["google_ads", "meta_ads"], "variations": 3 }
- For others: {} (empty object is fine)

WHEN TO USE EACH MODE:

CONVERSATION mode:
- For the user's FIRST message UNLESS they explicitly say "build it", "generate", "create my website now"
- When the user asks questions, wants help planning, or says things like "help me", "I'm not sure"
- To ask about: business details, target audience, preferred style/colors, must-have pages/sections
- Ask 2-4 focused questions at a time

GENERATE mode (FULL rebuild - expensive, avoid when possible):
- ONLY for the initial website creation when no website exists yet
- When the user explicitly asks to "rebuild", "start over", "completely redesign"
- When the user wants to change the site type entirely (e.g. from business to ecommerce)
- When adding multiple new pages or doing a major structural overhaul

MARKETING mode:
- When the user asks about SEO, meta tags, Google ranking, search visibility
- When the user asks to create social media posts, content calendar, social content
- When the user asks about Google Business Profile, Google Maps listing
- When the user asks about ads, Facebook ads, Google Ads, ad copy, generate ads, create ad copy, run ads, advertising
- When the user asks to "market my business", "get more customers", "promote my site"
- When the user asks for their SEO score or wants to check their site's SEO health
- IMPORTANT: Marketing mode requires a website to already exist. If no website has been generated yet, use CONVERSATION mode to tell the user they need to build their site first.

EDIT mode (SURGICAL changes - preferred for existing websites):
- For ANY change request on an already-generated website
- Changing text, colors, images, or content in specific sections
- Adding or modifying a single section or component
- Changing the hero headline, updating contact info, tweaking styles
- Swapping images, updating testimonials, changing button text
- Even for adding a new section: target the page file that needs the new section imported
- targetFiles should list ONLY the files that need to change (usually 1-3 files)
- Common file paths: src/components/Hero.tsx, src/components/Navbar.tsx, src/components/Footer.tsx, src/components/Features.tsx, src/components/Testimonials.tsx, src/components/Pricing.tsx, src/components/FAQ.tsx, src/components/Contact.tsx, src/components/About.tsx, src/components/Gallery.tsx, src/components/Stats.tsx, src/components/CallToAction.tsx, src/app/page.tsx, src/components/Layout.tsx
- NEVER use GENERATE mode for small changes - it wastes time and credits by rebuilding everything

FOLLOW-UP SUGGESTIONS:
Always include 2-3 short, actionable follow-up suggestions that the user can click.
These suggestions will be sent as the user's next message, so they MUST be things the platform can actually do.

CRITICAL RULES FOR SUGGESTIONS:
- ONLY suggest things listed under "CAPABILITIES YOU CAN RECOMMEND" above
- NEVER suggest features outside the platform's capabilities (custom domains, backend functionality, payment processing, blog CMS, database setup, user authentication, API integrations, third-party plugins)
- NEVER suggest "Add animations" or "Add interactive features" — the platform generates static React components, not complex interactive apps
- NEVER suggest "Add a blog", "Set up email", "Connect payment", "Add login/signup", "Add search functionality", "Add a chatbot", "Add social media feed", "Integrate with Stripe/PayPal", or any backend/dynamic feature
- Suggestions should be visual/content changes OR marketing actions: colors, text, layout, SEO, social posts, etc.
- Keep suggestions under 8 words — they appear as small clickable chips
- Make suggestions specific to what was just built/changed
- After website generation, suggest marketing actions like "Optimize my SEO" or "Create social posts"

For CONVERSATION mode examples:
- "I want a modern, clean look"
- "Something bold and colorful"
- "Let me upload my logo first"

For GENERATE mode examples:
- "Add a testimonials section"
- "Change the color scheme"
- "Make the hero bolder"

For EDIT mode examples:
- "Make the text bigger"
- "Change background to dark"
- "Update the contact info"

CRITICAL COLOR RULES:
- NEVER default to generic blue (#3b82f6) or dark slate (#0f172a)
- Primary and secondary colors should create clear visual contrast
- The accent color should POP for CTA buttons
- Choose heading and body fonts that DIFFER from each other

CRITICAL RULES FOR SECTIONS AND PAGES (GENERATE mode only):
- MINIMUM 5 sections for any website
- Every website MUST generate at least 4 pages: Home (/), About (/about), Services or equivalent (/services, /menu, /work), and Contact (/contact)
- Include a 5th page when appropriate

IMPORTANT - DETECTING EDIT vs GENERATE:
If the chat history shows that a website has ALREADY been generated (look for messages like "Your website is ready", "I've created", previous generation results), then ALL subsequent change requests MUST use EDIT mode, NOT GENERATE mode. The ONLY exception is if the user explicitly says "rebuild from scratch", "start over", or "completely redesign".

Examples of EDIT mode requests (NEVER use GENERATE for these):
- "Change the hero text"
- "Make the colors warmer"
- "Add a FAQ section"
- "Update the phone number"
- "Change the font"
- "Move the testimonials above the pricing"
- "Add more images to the gallery"
- "Change the button color to green"
- "Update the business hours"
- "Add a new team member"
`;

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
        .select('id, user_id, generation_config, status')
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

    if (profile.plan === 'free' || profile.generation_credits <= 0) {
        return NextResponse.json(
            {
                error: 'no_credits',
                message: 'You have no generation credits.',
            },
            { status: 402 }
        );
    }

    try {
        const anthropic = getAnthropicClient();

        // Build messages array
        const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

        // Determine if a website has already been generated for this project
        const hasExistingWebsite = project.status === 'generated';

        // Include chat history for context
        if (chatHistory && chatHistory.length > 0) {
            const existingConfig = project.generation_config;
            if (existingConfig && (existingConfig as Record<string, unknown>).siteType) {
                // Fetch existing file list to help the AI know what files exist
                const { data: latestVersionData } = await supabase
                    .from('generation_versions')
                    .select('id')
                    .eq('project_id', projectId)
                    .eq('status', 'complete')
                    .order('version_number', { ascending: false })
                    .limit(1)
                    .single();

                const existingFileList: string[] = [];
                if (latestVersionData) {
                    const { data: existingFiles } = await supabase
                        .from('generated_files')
                        .select('file_path')
                        .eq('version_id', latestVersionData.id);

                    if (existingFiles) {
                        for (const f of existingFiles) {
                            existingFileList.push(f.file_path);
                        }
                    }
                }

                messages.push({
                    role: 'user',
                    content: 'Previous configuration: ' + JSON.stringify(existingConfig) + '\\n\\nThe current website has these existing files: ' + JSON.stringify(existingFileList) + '. When using EDIT mode, reference these exact file paths in targetFiles.',
                });
                messages.push({
                    role: 'assistant',
                    content: 'I have the previous configuration and file list. I will use EDIT mode for surgical changes and only use GENERATE mode if you want a complete rebuild.',
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

        // Add hint about existing website status
        let promptWithContext = prompt;
        if (hasExistingWebsite) {
            promptWithContext = prompt + '\\n\\n[SYSTEM: A website has already been generated for this project. Use EDIT mode for changes unless the user explicitly asks for a complete rebuild.]';
        }

        messages.push({ role: 'user', content: promptWithContext });

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

            // Try to extract from a fenced json block first
            const jsonBlockMatch = jsonStr.match(/```(?:json)?\s*\n([\s\S]*?)```/);
            if (jsonBlockMatch) {
                jsonStr = jsonBlockMatch[1].trim();
            } else if (jsonStr.startsWith('```')) {
                // Fallback: strip wrapping code fences
                jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            } else {
                // Try to find raw JSON object (handles text before/after JSON)
                const firstBrace = jsonStr.indexOf('{');
                const lastBrace = jsonStr.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
                }
            }

            parsed = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('JSON parse failed. Raw response:', textBlock.text.substring(0, 500));
            throw new Error('Failed to parse AI response as JSON');
        }

        const { config, projectName, planDescription, followUpSuggestions, mode, editInstructions, targetFiles, marketingAction, marketingOptions } = parsed;

        // MODE 4: Marketing - return marketing action details
        if (mode === 'marketing') {
            return NextResponse.json({
                mode: 'marketing',
                marketingAction: marketingAction || 'generate_seo',
                marketingOptions: marketingOptions || {},
                planDescription: planDescription || 'Working on your marketing...',
                followUpSuggestions: followUpSuggestions || [],
            });
        }

        // MODE 1: Conversation - return early
        if (mode === 'conversation') {
            return NextResponse.json({
                mode: 'conversation',
                planDescription: planDescription || 'Let me ask you a few questions to build the perfect website.',
                followUpSuggestions: followUpSuggestions || [],
            });
        }

        // MODE 3: Edit - return edit instructions and target files
        if (mode === 'edit') {
            return NextResponse.json({
                mode: 'edit',
                editInstructions: editInstructions || planDescription,
                targetFiles: targetFiles || [],
                planDescription: planDescription || 'I will make the requested changes.',
                followUpSuggestions: followUpSuggestions || [],
            });
        }

        // MODE 2: Generate - full rebuild
        if (profile.plan === 'free' || profile.generation_credits <= 0) {
            return NextResponse.json(
                { error: 'no_credits', message: 'No credits remaining.' },
                { status: 402 }
            );
        }

        // Enforce minimum sections for GENERATE mode
        if (config.sections && config.sections.length < 5) {
            const existingTypes = new Set(config.sections.map((s: SectionConfig) => s.type));
            const additionalSections = ['testimonials', 'stats', 'faq', 'cta', 'about', 'gallery', 'team'];
            let order = config.sections.length;
            for (const sType of additionalSections) {
                if (config.sections.length >= 5) break;
                if (!existingTypes.has(sType)) {
                    config.sections.push({ id: 'section-' + order, type: sType, order: order });
                    order++;
                }
            }
        }

        if (config.sections) {
            config.sections = config.sections.map(
                (s: SectionConfig, i: number) => ({
                    ...s,
                    id: s.id || 'section-' + i,
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
            mode: 'generate',
            config,
            planDescription: planDescription || 'I will create a website based on your description.',
            followUpSuggestions: followUpSuggestions || [],
        });
    } catch (error) {
        console.error('Parse prompt error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to parse prompt',
            },
            { status: 500 }
        );
    }
}
