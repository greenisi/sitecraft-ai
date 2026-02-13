import type { GenerationConfig } from '@/types/project';

/**
 * Builds the user prompt for generating a multi-page landing/marketing website.
 * Pages: Home (/), About (/about), Pricing (/pricing), Contact (/contact).
 */
export function buildLandingPagePrompt(config: GenerationConfig): string {
  const { business, branding, sections, aiPrompt } = config;

  const sectionList = sections
    .sort((a, b) => a.order - b.order)
    .map(
      (s) =>
        `- ${s.type}${s.variant ? ` (variant: ${s.variant})` : ''}${
          s.content
            ? ` | hints: ${Object.entries(s.content)
                .map(([k, v]) => `${k}="${v}"`)
                .join(', ')}`
            : ''
        }`
    )
    .join('\n');

  return `Generate a complete, production-ready MULTI-PAGE marketing website.
This is a 4-page site with shared layout, navigation, and footer.

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
Heading font: ${branding.fontHeading}
Body font: ${branding.fontBody}

=== REQUESTED SECTIONS ===
${sectionList}

=== SITE STRUCTURE & FILES ===

**Shared Components**

1. \`src/components/Navbar.tsx\` -- Fixed navigation bar (follow DESIGN VARIETY navbar style):
   - \`'use client'\` component with useState for mobile menu toggle
   - Use the navbar style from the DESIGN VARIETY instructions (glassmorphism, dark, transparent, solid, or colored)
   - Logo/business name with gradient or primary brand color
   - Desktop nav links: Home, About, Pricing, Contact using \`next/link\` with \`href="/about"\` etc.
   - CTA button in nav: "Get Started" with hover:scale-105 effect
   - Mobile hamburger menu using Menu/X icons from lucide-react
   - Full-screen mobile overlay with smooth opacity transition
   - \`aria-expanded\` and \`aria-label\` for accessibility
   - Click any link closes mobile menu

2. \`src/components/Footer.tsx\` -- Professional 4-column dark footer:
   - Dark themed: \`bg-gray-900 text-gray-300 pt-16 pb-8\`
   - Column 1: Brand name, short description, social media icons (Facebook, Twitter/X, Instagram, LinkedIn)
   - Column 2: Quick Links (Home, About, Pricing, Contact, Blog, Careers)
   - Column 3: Contact Info (address placeholder, phone, email, business hours)
   - Column 4: Newsletter signup with email input and subscribe button
   - Bottom bar: copyright with dynamic year + Privacy Policy / Terms links
   - Responsive: 4-col desktop → 2-col tablet → stacked mobile
   - All links have \`hover:text-white transition-colors\` effect

3. \`src/components/SectionHeading.tsx\` -- Reusable section heading component with
   title, optional subtitle/description, configurable alignment, and optional gradient accent line.

**Home Page (/)**

4. \`src/components/Hero.tsx\` -- Premium hero section (follow DESIGN VARIETY hero style):
   - Use the hero layout specified in the DESIGN VARIETY instructions
   - Large, impactful headline (gradient text, white on dark, or dark on light — depending on hero style)
   - Supporting sub-headline
   - Two CTA buttons: primary (filled, hover:scale-105, hover:shadow-lg) and secondary (outlined)
   - Trust indicators below CTAs (e.g., "No credit card required", "14-day free trial")
   - Decorative elements appropriate to the hero style (blur circles, shapes, overlays, etc.)
   - Subtle floating animation on decorative elements

5. \`src/components/Features.tsx\` -- Feature grid with scroll-triggered animations:
   - 'use client' component with IntersectionObserver for scroll-triggered fade-in
   - 3-6 feature cards in responsive grid (1 col mobile, 2 tablet, 3 desktop)
   - Each card: lucide-react icon in colored circle, title, description
   - Card hover effects: \`hover:-translate-y-1 hover:shadow-xl transition-all duration-300\`
   - Staggered animation delays: delay-100, delay-200, delay-300

6. \`src/components/Testimonials.tsx\` -- Social proof section:
   - 'use client' component with scroll-triggered animations
   - 3 testimonial cards with avatar placeholders, names, roles, star ratings, quote text
   - Cards with hover:rotate-1 micro-interaction
   - Generate realistic testimonials for "${business.industry}"

7. \`src/components/CallToAction.tsx\` -- Full-width CTA banner:
   - Gradient background with decorative elements
   - Compelling headline and supporting text
   - Large prominent CTA button with glow effect: \`hover:shadow-primary-500/25\`

8. \`src/app/page.tsx\` -- Home page composing: Hero, Features, Testimonials, CallToAction.
   Server Component (no 'use client'). Import components and render in order.
   Add \`pt-16\` to account for fixed navbar.

**About Page (/about)**

9. \`src/components/AboutContent.tsx\` -- Company story section:
   - 'use client' for scroll animations
   - Two-column layout: text on left, image placeholder on right
   - Mission statement, values, company story
   - Animated stat counters (years in business, clients served, etc.)
   - Fade-in on scroll

10. \`src/components/TeamGrid.tsx\` -- Team members section:
    - 3-4 team member cards with avatar placeholders, names, roles
    - Card hover effects with scale and shadow
    - Optional social links (LinkedIn, Twitter)
    - Generate realistic team members for "${business.industry}"

11. \`src/app/about/page.tsx\` -- About page composing: AboutContent, TeamGrid.
    Add \`pt-16\` for fixed navbar.

**Pricing Page (/pricing)**

12. \`src/components/PricingTable.tsx\` -- Pricing tiers section:
    - 'use client' for scroll animations and toggle
    - 3 pricing tiers in responsive grid
    - Highlighted/recommended tier with border and "Most Popular" badge
    - Each tier: name, price, feature list with check icons, CTA button
    - Card hover effects: \`hover:-translate-y-1 hover:shadow-xl\`
    - Generate realistic pricing for "${business.industry}"

13. \`src/components/FAQ.tsx\` -- Accordion FAQ section:
    - 'use client' for toggle state
    - 5-6 questions/answers relevant to "${business.industry}"
    - Smooth expand/collapse animation with ChevronDown icon rotation
    - Realistic, helpful Q&A content

14. \`src/app/pricing/page.tsx\` -- Pricing page composing: PricingTable, FAQ.
    Add \`pt-16\` for fixed navbar.

**Contact Page (/contact)**

15. \`src/components/ContactForm.tsx\` -- Lead-capture form:
    - 'use client' for form state management
    - Fields: Name, Email, Subject (dropdown), Message textarea
    - Styled inputs with focus rings: \`focus:ring-2 focus:ring-primary-500/50\`
    - Submit button with loading state
    - Success message on submit (client-side only)

16. \`src/components/ContactInfo.tsx\` -- Contact details:
    - Phone, email, address placeholder, business hours
    - Each item with lucide-react icon
    - Clean card layout with subtle background

17. \`src/app/contact/page.tsx\` -- Contact page with two-column layout:
    ContactForm (left) and ContactInfo (right). Add \`pt-16\` for fixed navbar.

**Layout & Config**

18. \`src/app/layout.tsx\` -- Root layout wrapping ALL pages with Navbar and Footer.
    Import fonts via next/font/google and global CSS. The layout should render
    Navbar at top and Footer at bottom, with {children} in between.

19. \`src/app/globals.css\` -- Tailwind directives (@tailwind base, components, utilities)
    plus custom smooth scrolling and any global styles.

${aiPrompt ? `=== ADDITIONAL INSTRUCTIONS ===\n${aiPrompt}\n` : ''}
=== QUALITY REQUIREMENTS ===
- Every section MUST have scroll-triggered fade-in animations
- All buttons MUST have hover:scale-105 and transition effects
- Cards MUST have hover:-translate-y-1 hover:shadow-xl effects
- The hero style should follow the DESIGN VARIETY instructions (gradient, split, dark, minimal, etc.)
- The navbar style should follow the DESIGN VARIETY instructions (glassmorphism, dark, transparent, etc.)
- The footer MUST be 4-column with newsletter signup
- Mobile hamburger menu MUST work with useState toggle
- Use realistic, industry-appropriate content — NEVER lorem ipsum
- All navigation links must use \`next/link\` with correct paths (/, /about, /pricing, /contact)
- Pages must feel cohesive: consistent colors, typography, spacing
- CRITICAL: Follow the DESIGN VARIETY instructions at the end of this prompt for hero, navbar, features layout, and testimonial style. Each website MUST look unique.
- Generate ALL files listed above in a single response
`;
}
