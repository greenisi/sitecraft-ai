import type { GenerationConfig } from '@/types/project';

/**
 * Builds the user prompt for generating a SaaS website.
 * Includes a marketing landing page, pricing table, features section,
 * auth page stubs, and a dashboard shell.
 */
export function buildSaasPrompt(config: GenerationConfig): string {
  const { business, branding, sections, saas, aiPrompt } = config;

  const sectionList = sections
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      let line = `- ${s.type}${s.variant ? ` (variant: ${s.variant})` : ''}`;
      if (s.content) {
        const hints = Object.entries(s.content)
          .map(([k, v]) => `${k}="${v}"`)
          .join(', ');
        if (hints) line += ` | hints: ${hints}`;
      }
      if (s.items && s.items.length > 0) {
        const itemLines = s.items.map((item) => {
          const entries = Object.entries(item)
            .filter(([k]) => k !== '_type')
            .map(([k, v]) => `${k}: "${v}"`)
            .join(', ');
          return `    * ${entries}`;
        });
        line += `\n${itemLines.join('\n')}`;
      }
      return line;
    })
    .join('\n');

  const features = saas?.features?.length
    ? saas.features
        .map((f) => `  - "${f.title}": ${f.description}${f.icon ? ` (icon: ${f.icon})` : ''}`)
        .join('\n')
    : '  (Generate 4-6 compelling features for the product)';

  const pricingTiers = saas?.pricingTiers?.length
    ? saas.pricingTiers
        .map(
          (t) =>
            `  - "${t.name}" $${t.price}/${t.interval}${t.highlighted ? ' [highlighted]' : ''}: ${t.features.join(', ')}`
        )
        .join('\n')
    : '  (Generate 3 tiers: Free, Pro, Enterprise)';

  const hasAuth = saas?.hasAuth !== false;
  const hasDashboard = saas?.hasDashboard !== false;

  return `Generate a complete, production-ready SaaS website with marketing pages and an application shell.

=== BUSINESS CONTEXT ===
Business name: "${business.name}"
${business.tagline ? `Tagline: "${business.tagline}"` : ''}
Description: "${business.description}"
Industry: "${business.industry}"
Target audience: "${business.targetAudience}"

=== VISUAL STYLE ===
Style: ${branding.style}
Primary color: ${branding.primaryColor}
Secondary color: ${branding.secondaryColor}
Accent color: ${branding.accentColor}
${branding.surfaceColor ? `Surface/background color: ${branding.surfaceColor}` : ''}

=== REQUESTED SECTIONS ===
${sectionList}

=== SAAS CONFIG ===
Features:
${features}

Pricing Tiers:
${pricingTiers}

Auth pages: ${hasAuth ? 'Yes' : 'No'}
Dashboard shell: ${hasDashboard ? 'Yes' : 'No'}

=== READ THE OWNER'S MIND — SILENT INFERENCE FIRST ===
Before writing any code, silently infer from the product description:
(1) WHO the buyer is — solo dev, ops manager, CFO, agency owner — and who has to approve the purchase,
(2) what they FEAR (vendor lock-in, painful migration, data security, another tool nobody uses, hidden pricing),
(3) what builds INSTANT TRUST for this buyer (recognizable customer logos, security/compliance badges,
concrete metrics, transparent pricing, real product UI), (4) the PRICE-POINT FEEL — a $9/mo indie tool
should feel friendly and fast; a $2k/mo enterprise platform should feel calm, dense with proof, and
security-forward, and (5) the ONE action: start free trial, book a demo, or join waitlist — pick the one
that matches the price point (high-touch = demo, self-serve = trial) and drive it everywhere.
Then: the section after the hero answers the buyer's biggest fear; every feature is framed as the
OUTCOME it buys ("Close the books 4 days faster" not "Powerful automation"); headlines must fail the
"could a competitor claim the exact opposite?" test — if no competitor would claim the opposite, the
headline is empty, rewrite it with a number, a mechanism, or a named workflow. BANNED copy: "Welcome to",
"We are committed to excellence", "Supercharge your workflow", "Take your business to the next level", lorem ipsum.

=== FILES TO GENERATE ===

**Marketing -- Shared Components**

1. \`src/components/marketing/Navbar.tsx\` -- Fixed navigation bar (follow DESIGN VARIETY navbar style):
   - \`'use client'\` component with useState for mobile menu toggle
   - Use the navbar style from DESIGN VARIETY instructions (solid white, solid dark, brand-colored, or bg-white/90 backdrop-blur — always a solid, always-visible background; never transparent)
   - Logo with gradient or primary brand color
   - Links: Features, Pricing, ${hasAuth ? 'Sign In' : 'Contact'}
   - Primary CTA button: "Get Started" / "Start Free Trial" with hover:scale-105
   - Mobile hamburger with Menu/X icons, full-screen overlay — the menu panel is ALWAYS solid bg-white with text-gray-900
   - \`aria-expanded\` and \`aria-label\` for accessibility

2. \`src/components/marketing/Footer.tsx\` -- Professional 4-column dark footer:
   - Dark themed: \`bg-gray-900 text-gray-300 pt-16 pb-8\`
   - Column 1: Brand, description, social icons
   - Column 2: Product links (Features, Pricing, Integrations, API)
   - Column 3: Company links (About, Blog, Careers, Contact)
   - Column 4: Newsletter signup
   - Bottom bar: copyright + Privacy/Terms/Security links
   - Responsive layout

**Marketing -- Home / Landing Page**

3. \`src/components/marketing/Hero.tsx\` -- Premium SaaS hero (follow DESIGN VARIETY hero style):
   - Use the hero layout from DESIGN VARIETY instructions (gradient, split, dark, minimal, etc.)
   - Large headline with impactful typography
   - Sub-headline with supporting copy
   - Email capture or CTA button with hover:scale-105 and glow effect
   - Product screenshot/mockup placeholder with subtle floating animation (use the named animate-float utility, never an arbitrary animate-[...] value)
   - Trust indicators: "No credit card required", "Free 14-day trial"

4. \`src/components/marketing/FeatureGrid.tsx\` -- Features section as a bento grid with
   mixed-size cells (some wide, some tall — product UI shots, an oversized metric moment,
   feature callouts), NOT a uniform grid of icon cards with titles + descriptions.
   Responsive grid layout. Use lucide-react icons sparingly as accents.

5. \`src/components/marketing/FeatureShowcase.tsx\` -- Alternating left-right feature
   sections with image on one side and text on the other. Highlight 2-3 key features
   in detail.

6. \`src/components/marketing/SocialProof.tsx\` -- Logos bar ("Trusted by") and/or
   testimonial quotes. Use placeholder company names.

7. \`src/components/marketing/PricingTable.tsx\` -- Pricing cards for each tier.
   Highlighted/recommended tier stands out. Toggle for monthly/yearly. \`'use client'\`.

8. \`src/components/marketing/FAQ.tsx\` -- Accordion FAQ section with 5-6 relevant
   questions. \`'use client'\` for accordion state.

9. \`src/components/marketing/CTABanner.tsx\` -- Full-width call-to-action with gradient
   background, headline, and signup button.

10. \`src/app/page.tsx\` -- Marketing landing page composing: Hero, SocialProof,
    FeatureGrid, FeatureShowcase, PricingTable, FAQ, CTABanner.

11. \`src/app/pricing/page.tsx\` -- Dedicated pricing page with PricingTable and FAQ.

12. \`src/app/(marketing)/layout.tsx\` -- Marketing layout wrapping pages with the
    marketing Navbar and Footer.

${
  hasAuth
    ? `**Auth Pages (stubs)**

13. \`src/components/auth/AuthForm.tsx\` -- Shared auth form component with email/password
    fields, submit button, and toggle between sign-in / sign-up modes. \`'use client'\`.
    On submit, show a toast/message (no real auth backend).

14. \`src/app/(auth)/sign-in/page.tsx\` -- Sign in page with AuthForm in sign-in mode.
    Centered card layout.

15. \`src/app/(auth)/sign-up/page.tsx\` -- Sign up page with AuthForm in sign-up mode.
    Centered card layout.

16. \`src/app/(auth)/layout.tsx\` -- Minimal auth layout (centered, no marketing nav).`
    : ''
}

${
  hasDashboard
    ? `**Dashboard Shell**

${hasAuth ? '17' : '13'}. \`src/components/dashboard/Sidebar.tsx\` -- Collapsible sidebar with nav links
    (Dashboard, Analytics, Settings, etc.) and user avatar placeholder. \`'use client'\`.

${hasAuth ? '18' : '14'}. \`src/components/dashboard/DashboardHeader.tsx\` -- Top header bar with page
    title, search input, notification bell icon, and user dropdown.

${hasAuth ? '19' : '15'}. \`src/components/dashboard/StatsCards.tsx\` -- Row of stat cards showing
    placeholder KPIs (total users, revenue, active projects, etc.) with trend arrows.

${hasAuth ? '20' : '16'}. \`src/components/dashboard/RecentActivity.tsx\` -- Table or list of recent
    activity items with timestamps and status badges.

${hasAuth ? '21' : '17'}. \`src/app/(dashboard)/dashboard/page.tsx\` -- Main dashboard page with
    StatsCards and RecentActivity.

${hasAuth ? '22' : '18'}. \`src/app/(dashboard)/layout.tsx\` -- Dashboard layout with Sidebar and
    DashboardHeader.`
    : ''
}

**Global Config**

${hasAuth && hasDashboard ? '23' : hasAuth || hasDashboard ? '19' : '13'}. \`src/app/layout.tsx\` -- Root layout with html, body, font imports (next/font/google),
    global CSS import. Minimal -- route groups handle sub-layouts.

${hasAuth && hasDashboard ? '24' : hasAuth || hasDashboard ? '20' : '14'}. \`src/app/globals.css\` -- Tailwind directives and any global utility styles.

${config.navigation ? `=== NAVIGATION CONFIG ===
${config.navigation.navbarStyle ? `Navbar style: ${config.navigation.navbarStyle}` : ''}
${config.navigation.navbarPosition ? `Navbar position: ${config.navigation.navbarPosition}` : ''}
${config.navigation.footerStyle ? `Footer style: ${config.navigation.footerStyle}` : ''}
${config.navigation.socialLinks?.length ? `Social links: ${config.navigation.socialLinks.map((l) => `${l.platform}: ${l.url}`).join(', ')}` : ''}
` : ''}
${aiPrompt ? `=== ADDITIONAL INSTRUCTIONS ===\n${aiPrompt}\n` : ''}
=== QUALITY REQUIREMENTS ===
- Above-the-fold content animates with CSS-only utilities (animate-fade-in-up, animate-rise-in, animate-blur-in — they fire on render and can never leave content hidden). Below-the-fold sections use the fail-open useReveal hook from the system prompt (starts visible, opts into the reveal only once the observer is confirmed working, 2.5s failsafe). NEVER initialize any element as opacity-0/hidden by default.
- All buttons MUST have hover:scale-105 and transition effects
- Cards MUST have hover:-translate-y-1 hover:shadow-xl effects
- The hero style should follow the DESIGN VARIETY instructions (gradient, split, dark, minimal, etc.)
- The navbar style should follow the DESIGN VARIETY instructions (solid white, solid dark, brand-colored, or bg-white/90 backdrop-blur — always a solid, always-visible background; never transparent)
- Footer MUST be 4-column dark themed with newsletter signup
- Mobile hamburger menu MUST work with useState toggle
- Add \`pt-16\` to page content for fixed navbar
- Marketing pages must feel polished, modern, and conversion-optimized
- Dashboard is a static shell with placeholder data — no real API calls
- Auth forms are stubs: handle submit on the client with a success message, no backend
- Use realistic SaaS copy appropriate for "${business.industry}" — precise, outcome-driven, zero filler
- Include ONE signature layout moment that fits the product: a bento feature grid with product UI in mixed-size cells, an oversized metric moment (one number at huge scale with context copy), or a sticky side rail walking through the workflow — not the same hero-features-pricing-CTA rhythm as every other SaaS site
- Pricing toggle should switch between monthly and yearly prices (yearly = monthly * 10)
- Organize files into route groups: (marketing), (auth), (dashboard)
- CRITICAL: Follow the DESIGN VARIETY instructions at the end of this prompt for hero, navbar, features layout, and testimonial style. Each website MUST look unique.
- Generate ALL files listed above in a single response
`;
}
