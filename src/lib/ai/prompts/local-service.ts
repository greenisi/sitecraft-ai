import type { GenerationConfig } from '@/types/project';

/**
 * Builds the user prompt for generating a multi-page local service business website.
 * Pages: Home (/), Services (/services), About (/about), Contact (/contact).
 * Covers businesses like plumbers, electricians, landscapers, cleaners,
 * HVAC technicians, roofers, and similar local trades/services.
 */
export function buildLocalServicePrompt(config: GenerationConfig): string {
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

  return `Generate a complete, production-ready MULTI-PAGE local service business website.
This is a 4-page site for a local trade or service company (plumber, electrician,
landscaper, cleaner, HVAC, roofer, etc.) that serves customers in a specific
geographic area. The site must inspire trust, make it extremely easy to contact
the business, and convert visitors into leads or phone calls.

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
   - Desktop nav links: Home, Services, About, Contact using \`next/link\`
   - Prominently-styled "Call Now" phone number link on desktop (with Phone icon)
   - Mobile hamburger menu with Menu/X icons from lucide-react
   - Full-screen mobile overlay with smooth opacity transition
   - Optional top banner for emergency/24-7 availability (colored accent strip)
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

4. \`src/components/Hero.tsx\` -- Bold hero section:
   - Strong headline emphasizing core service and locality (e.g., "Trusted ${business.industry} in [City]")
   - Gradient background or professional background image placeholder
   - Decorative blur elements behind hero content
   - Prominent "Call Now" CTA button with Phone icon (\`tel:\` link, hover:scale-105)
   - Secondary "Get a Free Quote" CTA button
   - Trust statement strip: "Licensed & Insured | 15+ Years | 5-Star Rated"
   - Subtle animation on hero elements

5. \`src/components/TrustBadges.tsx\` -- Horizontal trust indicators strip:
   - "Licensed & Insured", "BBB Accredited", "X+ Years Experience",
     "100% Satisfaction Guarantee", "Free Estimates"
   - Use lucide-react icons (Shield, Award, Clock, CheckCircle, Star)
   - Scroll-triggered fade-in animation
   - Cards with hover effects

6. \`src/components/ServicesPreview.tsx\` -- Preview grid of 3-4 top services:
   - Responsive grid with lucide-react icons, titles, short descriptions
   - "View All Services" link to /services page
   - Card hover: \`hover:-translate-y-1 hover:shadow-xl transition-all duration-300\`
   - Scroll-triggered staggered animation

7. \`src/components/ReviewsPreview.tsx\` -- 3 featured testimonial cards:
   - 5-star rating display with Star icons
   - Customer name, location, review text
   - "See All Reviews" link
   - Hover:rotate-1 micro-interaction
   - Scroll-triggered animation

8. \`src/components/EmergencyCallout.tsx\` -- Full-width emergency banner:
   - Accent/contrasting color background with gradient
   - "24/7 Emergency Service Available" headline
   - Large click-to-call phone number with Phone icon
   - Urgency-driven copy
   - Only include if relevant to the industry

9. \`src/components/CallToAction.tsx\` -- Bottom CTA section:
   - Gradient background with decorative elements
   - Compelling headline: "Ready to Get Started?"
   - Phone CTA + Quote CTA buttons with glow effects

10. \`src/app/page.tsx\` -- Home page composing: Hero, TrustBadges, ServicesPreview,
    ReviewsPreview, EmergencyCallout, CallToAction. Server Component.
    Add \`pt-16\` for fixed navbar.

**Services Page (/services)**

11. \`src/components/ServicesGrid.tsx\` -- Full services grid:
    - 'use client' for scroll-triggered animations
    - 6-8 detailed service cards with icons, titles, descriptions, feature bullets
    - Responsive: 1 col mobile, 2 tablet, 3 desktop
    - Card hover effects with shadow and translate
    - Staggered fade-in animation
    - Generate realistic services for "${business.industry}"

12. \`src/components/BeforeAfterGallery.tsx\` -- Before/After project gallery:
    - 3-4 before/after pairs with placeholder images
    - Labels "Before" / "After" and short project description
    - Responsive grid layout
    - Hover effects on image containers

13. \`src/components/ServiceAreas.tsx\` -- Geographic areas served:
    - Grid of city/neighborhood names with MapPin icons
    - Brief description of coverage area
    - Map placeholder with neutral background and map pin icon

14. \`src/app/services/page.tsx\` -- Services page composing: ServicesGrid,
    BeforeAfterGallery, ServiceAreas. Add \`pt-16\` for fixed navbar.

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

${aiPrompt ? `=== ADDITIONAL INSTRUCTIONS ===\n${aiPrompt}\n` : ''}
=== QUALITY REQUIREMENTS ===
- Every section MUST have scroll-triggered fade-in animations using IntersectionObserver
- All buttons MUST have hover:scale-105 and transition effects
- Cards MUST have hover:-translate-y-1 hover:shadow-xl effects
- Hero MUST have gradient backgrounds and decorative blur elements
- Navbar MUST be glassmorphism style (backdrop-blur-md bg-white/80)
- Footer MUST be 4-column dark themed
- Mobile hamburger menu MUST work with useState toggle
- Phone numbers MUST use \`tel:\` links for click-to-call on mobile
- Use realistic, industry-appropriate content — NEVER lorem ipsum
- All nav links must use \`next/link\` with correct paths (/, /services, /about, /contact)
- The tone should be trustworthy, professional, and locally-focused
- Emphasize ease of contact: phone and CTA visible on every page
- Generate ALL files listed above in a single response
`;
}
