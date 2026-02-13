import type { GenerationConfig } from '@/types/project';

/**
 * Builds the user prompt for generating a multi-page business / portfolio website.
 * Pages: Home, About, Services (or Work), and Contact.
 */
export function buildBusinessPortfolioPrompt(config: GenerationConfig): string {
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

  return `Generate a complete, production-ready multi-page business / portfolio website.

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

1. \`src/components/Navbar.tsx\` -- Fixed glassmorphism navigation bar:
   - \`'use client'\` component with useState for mobile menu toggle
   - Glassmorphism: \`fixed top-0 w-full z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-sm\`
   - Logo/business name with primary brand color
   - Desktop nav links: Home, About, Services, Contact using \`next/link\`
   - CTA button in nav with hover:scale-105 effect
   - Mobile hamburger menu with Menu/X icons from lucide-react
   - Full-screen mobile overlay with smooth opacity transition
   - \`aria-expanded\` and \`aria-label\` for accessibility

2. \`src/components/Footer.tsx\` -- Professional 4-column dark footer:
   - Dark themed: \`bg-gray-900 text-gray-300 pt-16 pb-8\`
   - Column 1: Brand name, short description, social media icons
   - Column 2: Quick Links (Home, About, Services, Contact)
   - Column 3: Contact Info (address, phone, email, hours)
   - Column 4: Newsletter signup with email input and subscribe button
   - Bottom bar: copyright with dynamic year + Privacy/Terms links
   - Responsive: 4-col desktop → 2-col tablet → stacked mobile

3. \`src/components/SectionHeading.tsx\` -- Reusable section heading component with
   title, optional subtitle, and configurable alignment.

**Home Page**

4. \`src/components/Hero.tsx\` -- Premium hero section:
   - Bold gradient background or professional image
   - Decorative blurred circles: \`absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl\`
   - Large headline with gradient text effect for key words
   - Two CTA buttons: primary (filled, hover:scale-105, hover:shadow-lg) and secondary (outlined)
   - Subtle floating animation on decorative elements

5. \`src/components/ServicesPreview.tsx\` -- Service preview with scroll-triggered animations:
   - 'use client' component with IntersectionObserver for fade-in
   - Grid of 3-4 services with icons, titles, descriptions, "Learn more" links
   - Card hover: \`hover:-translate-y-1 hover:shadow-xl transition-all duration-300\`
   - Staggered animation delays

6. \`src/components/Stats.tsx\` -- Animated stats section:
   - 'use client' for animated number counting with useEffect + setInterval
   - Key metrics with large numbers that count up when visible
   - Background gradient or subtle pattern

7. \`src/app/page.tsx\` -- Home page composing Hero, ServicesPreview, Stats, and a CTA.

**About Page**

8. \`src/components/AboutContent.tsx\` -- Company story, mission, values. Two-column
   layout with text and image placeholder.

9. \`src/components/TeamGrid.tsx\` -- Team members grid with avatar placeholders,
   names, roles, and optional social links. Generate 3-4 realistic team members.

10. \`src/app/about/page.tsx\` -- About page composing AboutContent and TeamGrid.

**Services / Work Page**

11. \`src/components/ServiceCard.tsx\` -- Detailed service card with icon, title,
    description, and feature bullet points.

12. \`src/components/ServicesList.tsx\` -- Responsive grid of ServiceCards. Generate
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

**Layout & Config**

17. \`src/app/layout.tsx\` -- Root layout wrapping all pages with Navbar and Footer.
    Import fonts via next/font/google and global CSS.

18. \`src/app/globals.css\` -- Tailwind directives plus global styles.

${aiPrompt ? `=== ADDITIONAL INSTRUCTIONS ===\n${aiPrompt}\n` : ''}
=== QUALITY REQUIREMENTS ===
- Every section MUST have scroll-triggered fade-in animations using IntersectionObserver
- All buttons MUST have hover:scale-105 and transition effects
- Cards MUST have hover:-translate-y-1 hover:shadow-xl effects
- Hero MUST have gradient backgrounds and decorative blur elements
- Navbar MUST be glassmorphism style (backdrop-blur-md bg-white/80)
- Footer MUST be 4-column dark themed with newsletter signup
- Mobile hamburger menu MUST work with useState toggle
- Use realistic, industry-appropriate content — NEVER lorem ipsum
- All navigation links must use \`next/link\` with correct paths (/, /about, /services, /contact)
- Pages must feel cohesive: consistent colors, typography, spacing
- Add \`pt-16\` to page content to account for fixed navbar
- Generate ALL files listed above in a single response
`;
}
