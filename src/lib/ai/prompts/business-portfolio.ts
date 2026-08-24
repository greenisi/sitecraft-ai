import type { GenerationConfig } from '@/types/project';

/**
 * Builds the user prompt for generating a multi-page business / portfolio website.
 * Pages: Home, About, Services (or Work), Contact, and a 5th page (Testimonials, Gallery, or Pricing).
 */
export function buildBusinessPortfolioPrompt(config: GenerationConfig): string {
  const { business, branding, sections, aiPrompt } = config;

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

  return `Generate a complete, production-ready 5-page business / portfolio website. You MUST generate at least 5 separate page.tsx files.

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
Heading font: ${branding.fontHeading}
Body font: ${branding.fontBody}

=== REQUESTED SECTIONS ===
${sectionList}

=== READ THE OWNER'S MIND — SILENT INFERENCE FIRST ===
Before writing any code, silently infer from "${business.industry}" and the description:
(1) WHO the client/customer is and how they found this site (referral? search? proposal link?),
(2) what they FEAR when choosing this kind of firm (amateur work, overbilling, poor communication,
wrong fit), (3) what builds INSTANT TRUST here — for portfolio-led businesses it is the WORK itself
plus named clients and credentials; for service firms it is process, people, and proof, (4) the
PRICE-POINT FEEL (a boutique consultancy must feel quieter and more confident than a volume shop),
and (5) the ONE action: request a consultation, view the work, or get a proposal.
Then make every page serve those inferences: lead with the strongest proof this industry's buyers
check, put the ONE action in the hero, navbar, and a dedicated section, and write copy in the firm's
own voice — a design studio sounds nothing like an accounting firm. Headlines must make a claim a
competitor could not claim verbatim (name the niche, the method, the results, the city). BANNED:
"Welcome to our website", "We are committed to excellence", "Your trusted partner", lorem ipsum.

=== SITE STRUCTURE & FILES ===

**Shared Components**

1. \`src/components/Navbar.tsx\` -- Fixed navigation bar (follow DESIGN VARIETY navbar style):
   - \`'use client'\` component with useState for mobile menu toggle
   - Use the navbar style from DESIGN VARIETY instructions (solid white, solid dark, brand-colored, or bg-white/90 backdrop-blur) — always a solid, always-visible background, NEVER transparent
   - Logo/business name with primary brand color
   - Desktop nav links: Home, About, Services, Contact using \`next/link\`
   - CTA button in nav with hover:scale-105 effect
   - Mobile hamburger menu with Menu/X icons from lucide-react
   - Full-screen mobile overlay with smooth opacity transition — the menu panel is ALWAYS solid bg-white with text-gray-900
   - \`aria-expanded\` and \`aria-label\` for accessibility

2. \`src/components/Footer.tsx\` -- Professional 4-column dark footer:
   - Dark themed: \`bg-gray-900 text-gray-300 pt-16 pb-8\`
   - Column 1: Brand name, short description, social media icons
   - Column 2: Quick Links (Home, About, Services, Testimonials, Contact)
   - Column 3: Contact Info (address, phone, email, hours)
   - Column 4: Newsletter signup with email input and subscribe button
   - Bottom bar: copyright with dynamic year + Privacy/Terms links
   - Responsive: 4-col desktop → 2-col tablet → stacked mobile

3. \`src/components/SectionHeading.tsx\` -- Reusable section heading component with
   title, optional subtitle, and configurable alignment.

**Home Page**

4. \`src/components/Hero.tsx\` -- Premium hero section (follow DESIGN VARIETY hero style):
   - Use the hero layout from the DESIGN VARIETY instructions (gradient, split, dark, minimal, etc.)
   - Large, impactful headline
   - ONE dominant CTA button (filled, hover:scale-105, hover:shadow-lg); optionally a quiet text-link secondary — not two side-by-side buttons in a centered hero
   - Decorative elements appropriate to the hero style
   - Subtle floating animation on decorative elements

5. \`src/components/ServicesPreview.tsx\` -- Service preview as a numbered editorial list:
   - 'use client' component using the fail-open useReveal hook from the system prompt (starts visible, opts into the reveal only once the observer is confirmed working, 2.5s failsafe) — NEVER initialize any element as opacity-0/hidden by default
   - Numbered editorial list of 3-4 services (01, 02, 03…) with full-bleed photography per item — NOT an icon card grid with "Learn more" links
   - Item hover: \`hover:-translate-y-1 hover:shadow-xl transition-all duration-300\`
   - Staggered animation delays

6. \`src/components/Stats.tsx\` -- Oversized-number stats moment (an editorial layout, not 3 plain numbers in a row):
   - 'use client' — stat counters render their FINAL value by default (fail-open) and only animate 0→value with requestAnimationFrame once the fail-open useReveal hook confirms visibility. Never render 0 or blank as the default state
   - Key metrics at huge, oversized type scale with supporting editorial copy
   - Background gradient or subtle pattern

7. \`src/app/page.tsx\` -- Home page composing Hero, ServicesPreview, Stats, and a CTA.

**About Page**

8. \`src/components/AboutContent.tsx\` -- Company story, mission, values. Two-column
   layout with text and image placeholder.

9. \`src/components/TeamGrid.tsx\` -- Team members grid with avatar placeholders,
   names, roles, and optional social links. Generate 3-4 realistic team members.

10. \`src/app/about/page.tsx\` -- About page composing AboutContent and TeamGrid.

**Services / Work Page**

11. \`src/components/ServiceCard.tsx\` -- Detailed service entry with an oversized index
    number (01, 02…), title, description, and feature bullet points.

12. \`src/components/ServicesList.tsx\` -- Numbered editorial list of ServiceCards with
    full-bleed photography per item (not an icon card grid). Generate
    4-6 services relevant to "${business.industry}".

13. \`src/app/services/page.tsx\` -- Services page composing ServicesList.

**Contact Page**

14. \`src/components/ContactForm.tsx\` -- Contact form with name, email, subject,
    and message fields. Use \`'use client'\` for form state. Show a success message
    on submit (client-side only, no backend).

15. \`src/components/ContactInfo.tsx\` -- Contact details: address placeholder, phone,
    email, and business hours. Use lucide-react icons for each item.

16. \`src/app/contact/page.tsx\` -- Contact page with two-column layout: ContactForm
    and ContactInfo side by side.

**Testimonials Page (/testimonials)**

19. \`src/components/TestimonialsGrid.tsx\` -- Full testimonials page:
   - 'use client' using the fail-open useReveal hook from the system prompt (starts visible, 2.5s failsafe) — never initialize any element as opacity-0/hidden by default
   - 6-8 detailed testimonial cards with star ratings, customer names, roles, and review text
   - Mix of card sizes (featured large + standard grid)
   - Each card with hover effects and staggered animations
   - Filter or category tabs if appropriate for the industry

20. \`src/components/TestimonialStats.tsx\` -- Social proof section:
   - Overall rating display (e.g., "4.9 out of 5 stars")
   - Total review count
   - Platform badges (Google, Yelp, etc.)
   - Counters render their FINAL value by default (fail-open) and only animate 0→value when the reveal hook confirms visibility — never render 0 or blank as the default state

21. \`src/app/testimonials/page.tsx\` -- Testimonials page composing TestimonialsGrid and TestimonialStats. Add \`pt-16\` for fixed navbar.

**Layout & Config**

17. \`src/app/layout.tsx\` -- Root layout wrapping all pages with Navbar and Footer.
    Import fonts via next/font/google and global CSS.

18. \`src/app/globals.css\` -- Tailwind directives plus global styles.

${config.navigation ? `=== NAVIGATION CONFIG ===
${config.navigation.navbarStyle ? `Navbar style: ${config.navigation.navbarStyle}` : ''}
${config.navigation.navbarPosition ? `Navbar position: ${config.navigation.navbarPosition}` : ''}
${config.navigation.footerStyle ? `Footer style: ${config.navigation.footerStyle}` : ''}
${config.navigation.socialLinks?.length ? `Social links: ${config.navigation.socialLinks.map((l) => `${l.platform}: ${l.url}`).join(', ')}` : ''}
` : ''}
${aiPrompt ? `=== ADDITIONAL INSTRUCTIONS ===\n${aiPrompt}\n` : ''}
=== QUALITY REQUIREMENTS ===
- Preserve the exact business name everywhere: navigation, hero, page titles, and footer. Never replace it with a generic category name.
- Use only facts provided in the business context. Never fabricate reviews, ratings, years in business, customer counts, staff, contact details, hours, addresses, newsletter signups, or guarantees.
- Omit a testimonials, stats, team, newsletter, or emergency section when no real details were provided. A focused site is better than a padded template.
- Above-the-fold content animates with CSS-only utilities (animate-fade-in-up, animate-rise-in, animate-blur-in — they fire on render and can never leave content hidden). Below-the-fold sections use the fail-open useReveal hook from the system prompt (starts visible, opts into the reveal only once the observer is confirmed working, 2.5s failsafe). NEVER initialize any element as opacity-0/hidden by default, and NEVER use arbitrary animation values like animate-[fade-in-up_0.7s_ease-out_forwards] — only the NAMED Tailwind utilities from the design system
- All buttons MUST have hover:scale-105 and transition effects
- Cards MUST have hover:-translate-y-1 hover:shadow-xl effects
- The hero style should follow the DESIGN VARIETY instructions (gradient, split, dark, minimal, etc.)
- The navbar style should follow the DESIGN VARIETY instructions (solid white, solid dark, brand-colored, or bg-white/90 backdrop-blur) — always a solid, always-visible background, never transparent
- Footer MUST be 4-column with newsletter signup
- Mobile hamburger menu MUST work with useState toggle
- Use realistic, industry-appropriate content — NEVER lorem ipsum
- Include ONE signature layout moment that fits the business: an asymmetric editorial hero, an oversized stat or claim at huge type scale, or a full-bleed image interlude between sections — not the same hero-services-stats-CTA rhythm as every other business site
- All navigation links must use \`next/link\` with correct paths (/, /about, /services, /contact)
- Pages must feel cohesive: consistent colors, typography, spacing
- EVERY button must link to a real page using next/link: "Learn More" → /about, "View Services" → /services, "Contact Us" → /contact, "See Reviews" → /testimonials
- CTA buttons in hero and section cards MUST use <Link href="/path"> not <a href="#"> or <button>
- Add \`pt-16\` to page content to account for fixed navbar
- CRITICAL: Follow the DESIGN VARIETY instructions at the end of this prompt for hero, navbar, features layout, and testimonial style. Each website MUST look unique.
- Generate ALL files listed above in a single response
`;
}
