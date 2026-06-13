import type { GenerationConfig } from '@/types/project';
import { renderTradeHintBlock } from './home-pro-trades';

/**
 * Builds the user prompt for generating a multi-page local business website.
 * Pages are adapted to the actual industry. Trade/service companies usually use
 * Home, Services, About, Contact, while restaurants, studios, clinics, venues,
 * and other local businesses may need Menu, Reservations, Work, Booking, etc.
 *
 * If the business.industry matches a known home pro trade (pressure washing,
 * HVAC, roofing, plumbing, electrical, painting, landscaping, lawn care, junk
 * removal), the prompt is enriched with trade-specific hints so the generated
 * site actually looks/feels like that trade, not a generic local business.
 */
export function buildLocalServicePrompt(config: GenerationConfig): string {
  const { business, branding, sections, aiPrompt } = config;
  const tradeHintBlock = renderTradeHintBlock(business.industry);

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

  return `Generate a complete, production-ready MULTI-PAGE local business website.
This is a location-based business that serves customers in a specific geographic
area. It might be a trade/service company, restaurant, studio, clinic, fitness
business, salon, venue, or other local brand. The site must feel tailored to the
exact industry, inspire trust, and make the correct conversion path obvious:
call, book, reserve, request a quote, visit, order, or inquire.

CRITICAL: Do not force every local business into a contractor/trade template.
Adapt the pages, CTAs, proof points, imagery, and copy to the actual industry.

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
${tradeHintBlock}
=== READ THE OWNER'S MIND — SILENT INFERENCE FIRST ===
Before writing any code, silently infer from "${business.industry}" and the description:
(1) WHO the customer is, (2) what they FEAR when hiring a local business like this (no-shows,
overcharging, amateur work, bad food, awkward experience), (3) what builds INSTANT TRUST in
this exact industry, (4) the PRICE-POINT FEEL (budget/mid/premium), and (5) the ONE action
the site exists to drive (call, book, reserve, request quote, visit, order).
Then: the section right after the hero must answer the customer's biggest fear; trust signals
must be the ones THIS industry's buyers actually check; the ONE action must appear in the
hero, the navbar CTA, and a dedicated conversion section. Industry-distinct decision flows:
- Restaurants: menu and atmosphere first; hours, location, and reservations visible without scrolling far
- Trades/home services: proof of work (before/after, real jobs) and licensing first; quote/call always reachable
- Clinics/salons/studios: practitioner credibility and the booking flow first; calm reassurance over hype
- Venues/fitness: the space and the experience first; schedule/booking second
The owner should look at the finished site and think "how did it know exactly what my customers need?"

=== SITE STRUCTURE & FILES ===

**Shared Components**

1. \`src/components/Navbar.tsx\` -- Fixed navigation bar (follow DESIGN VARIETY navbar style):
   - \`'use client'\` component with useState for mobile menu toggle
   - Use the navbar style from DESIGN VARIETY instructions (glassmorphism, dark, transparent, solid, or colored)
   - Logo/business name with primary brand color
   - Desktop nav links must match the industry and generated pages using \`next/link\`
   - Use industry-appropriate CTA: Call Now for trades, Reserve for restaurants, Book for appointments, View Work for studios, Request Quote for construction/landscaping
   - Mobile hamburger menu with Menu/X icons from lucide-react
   - Full-screen mobile overlay with smooth opacity transition
   - Optional top banner only when it fits the industry
   - \`aria-expanded\` and \`aria-label\` for accessibility

2. \`src/components/Footer.tsx\` -- Professional 4-column dark footer:
   - Dark themed: \`bg-gray-900 text-gray-300 pt-16 pb-8\`
   - Column 1: Business name, short description, social icons (Facebook, Google, Yelp, Instagram)
   - Column 2: Our Services (list 6-8 service links)
   - Column 3: Service Areas (list 6-8 cities/neighborhoods)
   - Column 4: Contact Info (phone with tel: link, email, address, business hours)
   - Bottom bar: copyright with dynamic year + License/Insurance info
   - Responsive: 4-col desktop → 2-col tablet → stacked mobile
   - All links have \`hover:text-white transition-colors\`

3. \`src/components/SectionHeading.tsx\` -- Reusable section heading with title,
   optional subtitle, and configurable alignment.

**Home Page (/)**

4. \`src/components/Hero.tsx\` -- Bold hero section (follow DESIGN VARIETY hero style):
   - Strong industry-specific headline emphasizing the business, experience, product, craft, or locality
   - Use the hero layout from DESIGN VARIETY instructions (gradient, split, dark, full-bleed image, etc.)
   - Use the correct CTA pair for the industry: Reserve/View Menu, Book Appointment, Request Quote/View Projects, Shop Collection, Contact Studio, etc.
   - Trust/credibility strip should fit the industry: reviews, press, years, certifications, awards, featured projects, chef/menu notes, service areas, or client logos
   - Visual elements must fit the industry style
   - Subtle animation on hero elements

5. \`src/components/TrustBadges.tsx\` -- Horizontal trust indicators strip:
   - Use industry-appropriate proof points. Examples:
     landscaping: "Native Plant Experts", "Licensed & Insured", "Seasonal Care Plans"
     construction: "Licensed GC", "Permit Coordination", "Safety-First Crews"
     restaurant: "Seasonal Menu", "Biodynamic Wines", "Reservations Open"
     clinic: "Board-Certified Team", "Insurance Friendly", "Same-Week Appointments"
   - Use lucide-react icons only when they strengthen the concept
   - Scroll-triggered fade-in animation
   - Cards with hover effects

6. \`src/components/ServicesPreview.tsx\` -- Preview grid of 3-4 top services:
   - Rename/adapt this component's content to the industry: Services, Menu Highlights, Capabilities, Treatments, Programs, Collections, or Selected Work
   - Use photography where possible; avoid generic icon-only cards
   - "View All Services" link to /services page
   - Card hover: \`hover:-translate-y-1 hover:shadow-xl transition-all duration-300\`
   - Scroll-triggered staggered animation

7. \`src/components/ReviewsPreview.tsx\` -- 3 featured testimonial cards:
   - 5-star rating display with Star icons
   - Customer name, location, review text
   - "See All Reviews" link
   - Hover:rotate-1 micro-interaction
   - Scroll-triggered animation

8. \`src/components/EmergencyCallout.tsx\` -- Full-width urgency/CTA banner:
   - Accent/contrasting color background with gradient
   - Only use emergency language for industries that truly offer emergency service
   - Otherwise use the correct conversion moment: reservation banner, booking banner, quote banner, consultation banner, or visit-us banner

9. \`src/components/CallToAction.tsx\` -- Bottom CTA section:
   - Gradient background with decorative elements
   - Compelling headline: "Ready to Get Started?"
   - Phone CTA + Quote CTA buttons with glow effects

10. \`src/app/page.tsx\` -- Home page composing: Hero, TrustBadges, ServicesPreview,
    ReviewsPreview, EmergencyCallout, CallToAction. Server Component.
    Add \`pt-16\` for fixed navbar.

**Services Page (/services)**

11. \`src/components/ServicesGrid.tsx\` -- Full industry offering grid:
    - 'use client' for scroll-triggered animations
    - 6-8 detailed offerings with titles, descriptions, feature bullets, and industry-specific imagery
    - Responsive: 1 col mobile, 2 tablet, 3 desktop
    - Card hover effects with shadow and translate
    - Staggered fade-in animation
    - Generate realistic services for "${business.industry}"

12. \`src/components/BeforeAfterGallery.tsx\` -- Gallery, work, or proof section:
    - For landscaping/construction/home services: 3-4 before/after or project pairs
    - For restaurants: food/dining gallery and menu highlights
    - For studios/creative: selected work/case studies
    - For clinics/fitness: spaces, team, treatment/program visuals
    - Labels "Before" / "After" and short project description
    - Responsive grid layout
    - Hover effects on image containers

13. \`src/components/ServiceAreas.tsx\` -- Geographic areas served:
    - Grid of city/neighborhood names with MapPin icons
    - Brief description of coverage area
    - Map placeholder with neutral background and map pin icon

14. \`src/app/services/page.tsx\` -- Services page composing: ServicesGrid,
    BeforeAfterGallery, ServiceAreas. Add \`pt-16\` for fixed navbar.

If the user's requested pages are more industry-specific than Services, generate
those pages instead and make navigation match them exactly. For restaurants,
prefer Menu and Reservations pages. For construction, prefer Services/Projects.
For landscaping, prefer Services/Portfolio or Gallery. For creative studios,
prefer Work/Services. Do not include nav links for pages you do not generate.

**About Page (/about)**

15. \`src/components/AboutContent.tsx\` -- Company story section:
    - 'use client' for scroll animations
    - Two-column layout: company story text + image placeholder
    - Mission/values section
    - Animated stat counters (years in business, projects completed, happy customers)
    - Certifications and licenses section

16. \`src/components/WhyChooseUs.tsx\` -- Why choose us section:
    - 4-6 differentiator cards with icons
    - e.g., "Licensed & Insured", "Transparent Pricing", "Same-Day Service"
    - Scroll-triggered staggered animation

17. \`src/app/about/page.tsx\` -- About page composing: AboutContent, WhyChooseUs.
    Add \`pt-16\` for fixed navbar.

**Contact Page (/contact)**

18. \`src/components/ContactForm.tsx\` -- Lead-capture form:
    - 'use client' for form state
    - Fields: Name, Phone Number, Email, Service Needed (dropdown with services),
      Preferred Date/Time, Message textarea
    - Styled inputs with focus rings
    - Submit button with loading state
    - Success message on submit (client-side only)

19. \`src/components/ContactInfo.tsx\` -- Contact details:
    - Phone number with tel: link, email, address placeholder, business hours
    - Each with lucide-react icon
    - Clean card layout

20. \`src/components/FAQ.tsx\` -- Accordion FAQ section:
    - 'use client' for toggle state
    - 5-6 questions relevant to "${business.industry}"
    - Smooth expand/collapse with ChevronDown rotation
    - Realistic, helpful Q&A content

21. \`src/app/contact/page.tsx\` -- Contact page with two-column layout:
    ContactForm (left) and ContactInfo (right), plus FAQ below.
    Add \`pt-16\` for fixed navbar.

**Layout & Config**

22. \`src/app/layout.tsx\` -- Root layout wrapping ALL pages with Navbar and Footer.
    Import fonts via next/font/google and global CSS. Navbar at top, Footer at bottom,
    {children} in between.

23. \`src/app/globals.css\` -- Tailwind directives plus custom styles.

${config.navigation ? `=== NAVIGATION CONFIG ===
${config.navigation.navbarStyle ? `Navbar style: ${config.navigation.navbarStyle}` : ''}
${config.navigation.navbarPosition ? `Navbar position: ${config.navigation.navbarPosition}` : ''}
${config.navigation.footerStyle ? `Footer style: ${config.navigation.footerStyle}` : ''}
${config.navigation.socialLinks?.length ? `Social links: ${config.navigation.socialLinks.map((l) => `${l.platform}: ${l.url}`).join(', ')}` : ''}
` : ''}
${aiPrompt ? `=== ADDITIONAL INSTRUCTIONS ===\n${aiPrompt}\n` : ''}
=== QUALITY REQUIREMENTS ===
- The site must look unique AND industry-specific. Use the DESIGN VARIETY and INDUSTRY VISUAL DNA instructions as hard creative direction.
- Every section MUST have scroll-triggered fade-in animations using IntersectionObserver
- All buttons MUST have hover:scale-105 and transition effects
- Cards MUST have hover:-translate-y-1 hover:shadow-xl effects
- The hero style should follow the DESIGN VARIETY instructions (gradient, split, dark, minimal, etc.)
- The navbar style should follow the DESIGN VARIETY instructions (glassmorphism, dark, transparent, etc.)
- Footer MUST be 4-column dark themed
- Mobile hamburger menu MUST work with useState toggle
- Phone numbers MUST use \`tel:\` links for click-to-call on mobile
- Use realistic, industry-appropriate content — NEVER lorem ipsum
- Copy must be voice-matched to the trade/industry: plainspoken and proof-heavy for trades, sensory for restaurants, calm and credentialed for clinics. BANNED: "Welcome to our website", "We are committed to excellence", "Your trusted partner", "Quality you can trust". Every headline must make a claim a competitor could NOT claim verbatim — name the place, the method, the years, the guarantee.
- Include ONE signature layout moment that fits the industry (full-bleed photo interlude for restaurants/landscaping, oversized stat or before/after centerpiece for trades, asymmetric editorial hero for studios) — not the same hero-features-testimonials-CTA rhythm as every other site
- All nav links must use \`next/link\` with correct paths matching the pages actually generated
- The tone should be trustworthy, professional, and locally-focused
- Emphasize the right conversion action for the industry on every page
- CRITICAL: Follow the DESIGN VARIETY instructions at the end of this prompt for hero, navbar, features layout, and testimonial style. Each website MUST look unique.
- Generate ALL files listed above in a single response
`;
}
