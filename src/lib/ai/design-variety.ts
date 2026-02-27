import type { GenerationConfig } from '@/types/project';

/**
 * Design Variety System
 *
 * Provides industry-aware color palettes, font pairings, layout styles,
 * and hero variants so every generated website feels unique.
 * The system uses deterministic hashing on the business name + industry
 * to select a consistent but varied combination each time.
 */

// ─── Color Palettes ─────────────────────────────────────────────────────────

export interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  mood: string;
}

/**
 * Curated palettes grouped by industry vibe.
 * Each group has 5+ palettes so we can rotate.
 */
const PALETTES: Record<string, ColorPalette[]> = {
  nature: [
    { name: 'Forest Canopy', primary: '#15803d', secondary: '#365314', accent: '#eab308', mood: 'earthy' },
    { name: 'Sage Garden', primary: '#4d7c0f', secondary: '#78716c', accent: '#f97316', mood: 'organic' },
    { name: 'Mossy Stone', primary: '#166534', secondary: '#57534e', accent: '#84cc16', mood: 'natural' },
    { name: 'Tropical Leaf', primary: '#059669', secondary: '#0d9488', accent: '#fbbf24', mood: 'vibrant' },
    { name: 'Autumn Harvest', primary: '#b45309', secondary: '#4d7c0f', accent: '#dc2626', mood: 'warm' },
    { name: 'Ocean Breeze', primary: '#0369a1', secondary: '#15803d', accent: '#06b6d4', mood: 'fresh' },
  ],
  tech: [
    { name: 'Electric Indigo', primary: '#4f46e5', secondary: '#7c3aed', accent: '#06b6d4', mood: 'innovative' },
    { name: 'Neon Midnight', primary: '#6d28d9', secondary: '#1e1b4b', accent: '#22d3ee', mood: 'futuristic' },
    { name: 'Crisp Blue', primary: '#2563eb', secondary: '#475569', accent: '#f59e0b', mood: 'professional' },
    { name: 'Carbon Fiber', primary: '#18181b', secondary: '#3f3f46', accent: '#8b5cf6', mood: 'dark-modern' },
    { name: 'Arctic Dawn', primary: '#0284c7', secondary: '#e2e8f0', accent: '#10b981', mood: 'clean' },
    { name: 'Gradient Sky', primary: '#7c3aed', secondary: '#2563eb', accent: '#f43f5e', mood: 'playful-tech' },
  ],
  luxury: [
    { name: 'Black Gold', primary: '#1c1917', secondary: '#78716c', accent: '#d4a574', mood: 'opulent' },
    { name: 'Champagne Rose', primary: '#9f1239', secondary: '#fdf2f8', accent: '#d4a574', mood: 'refined' },
    { name: 'Midnight Emerald', primary: '#064e3b', secondary: '#1c1917', accent: '#fbbf24', mood: 'prestigious' },
    { name: 'Royal Navy', primary: '#1e3a5f', secondary: '#c2a66b', accent: '#f5f0e8', mood: 'classic' },
    { name: 'Mauve Silk', primary: '#581c87', secondary: '#faf5ff', accent: '#c084fc', mood: 'elegant' },
    { name: 'Ivory Noir', primary: '#292524', secondary: '#f5f5f4', accent: '#a16207', mood: 'sophisticated' },
  ],
  warm: [
    { name: 'Sunset Glow', primary: '#ea580c', secondary: '#fef3c7', accent: '#dc2626', mood: 'energetic' },
    { name: 'Terracotta', primary: '#c2410c', secondary: '#78716c', accent: '#fbbf24', mood: 'rustic' },
    { name: 'Cherry Blossom', primary: '#be185d', secondary: '#fce7f3', accent: '#f97316', mood: 'warm-playful' },
    { name: 'Amber Fire', primary: '#d97706', secondary: '#451a03', accent: '#ef4444', mood: 'bold' },
    { name: 'Coral Reef', primary: '#e11d48', secondary: '#fff1f2', accent: '#fb923c', mood: 'lively' },
    { name: 'Burnt Sienna', primary: '#9a3412', secondary: '#fef2f2', accent: '#16a34a', mood: 'artisanal' },
  ],
  cool: [
    { name: 'Arctic Ice', primary: '#0891b2', secondary: '#ecfeff', accent: '#6366f1', mood: 'cool-clean' },
    { name: 'Steel Blue', primary: '#1d4ed8', secondary: '#f1f5f9', accent: '#0ea5e9', mood: 'trustworthy' },
    { name: 'Teal Calm', primary: '#0d9488', secondary: '#f0fdfa', accent: '#8b5cf6', mood: 'serene' },
    { name: 'Slate Modern', primary: '#334155', secondary: '#f8fafc', accent: '#3b82f6', mood: 'minimal-cool' },
    { name: 'Aqua Marine', primary: '#0e7490', secondary: '#155e75', accent: '#fcd34d', mood: 'ocean' },
    { name: 'Periwinkle Mist', primary: '#6366f1', secondary: '#eef2ff', accent: '#14b8a6', mood: 'dreamy' },
  ],
  health: [
    { name: 'Clinical White', primary: '#0369a1', secondary: '#f0f9ff', accent: '#10b981', mood: 'clinical' },
    { name: 'Healing Green', primary: '#16a34a', secondary: '#f0fdf4', accent: '#2563eb', mood: 'wellness' },
    { name: 'Zen Garden', primary: '#4d7c0f', secondary: '#fefce8', accent: '#0d9488', mood: 'peaceful' },
    { name: 'Vitality Orange', primary: '#ea580c', secondary: '#fff7ed', accent: '#059669', mood: 'active' },
    { name: 'Lavender Calm', primary: '#7c3aed', secondary: '#faf5ff', accent: '#22d3ee', mood: 'tranquil' },
    { name: 'Ocean Therapy', primary: '#0891b2', secondary: '#ecfeff', accent: '#84cc16', mood: 'refreshing' },
  ],
  creative: [
    { name: 'Neon Pop', primary: '#e11d48', secondary: '#fef08a', accent: '#8b5cf6', mood: 'bold-creative' },
    { name: 'Sunset Canvas', primary: '#f97316', secondary: '#7c3aed', accent: '#06b6d4', mood: 'artistic' },
    { name: 'Candy Shop', primary: '#ec4899', secondary: '#a78bfa', accent: '#34d399', mood: 'playful' },
    { name: 'Electric Lime', primary: '#65a30d', secondary: '#1e1b4b', accent: '#f43f5e', mood: 'edgy' },
    { name: 'Cosmic Purple', primary: '#9333ea', secondary: '#0f172a', accent: '#f59e0b', mood: 'cosmic' },
    { name: 'Retro Wave', primary: '#db2777', secondary: '#1e3a5f', accent: '#22d3ee', mood: 'retro' },
  ],
};

// ─── Font Pairings ──────────────────────────────────────────────────────────

export interface FontPairing {
  name: string;
  heading: string;
  body: string;
  vibe: string;
}

const FONT_PAIRINGS: FontPairing[] = [
  { name: 'Modern Tech', heading: 'Space Grotesk', body: 'Inter', vibe: 'technical' },
  { name: 'Clean Minimal', heading: 'Inter', body: 'Inter', vibe: 'minimal' },
  { name: 'Elegant Serif', heading: 'Playfair Display', body: 'Inter', vibe: 'elegant' },
  { name: 'Friendly Modern', heading: 'Poppins', body: 'DM Sans', vibe: 'friendly' },
  { name: 'Bold Statement', heading: 'Sora', body: 'Inter', vibe: 'bold' },
  { name: 'Classic Lora', heading: 'Lora', body: 'DM Sans', vibe: 'classic' },
  { name: 'Creative DM', heading: 'DM Sans', body: 'Inter', vibe: 'creative' },
  { name: 'Professional', heading: 'Manrope', body: 'Inter', vibe: 'corporate' },
  { name: 'Contemporary', heading: 'Outfit', body: 'DM Sans', vibe: 'contemporary' },
  { name: 'Luxe Serif', heading: 'Playfair Display', body: 'Lora', vibe: 'luxurious' },
  { name: 'Urban Sharp', heading: 'Archivo Black', body: 'Inter', vibe: 'bold' },
  { name: 'Geometric Clean', heading: 'Plus Jakarta Sans', body: 'DM Sans', vibe: 'contemporary' },
  { name: 'Warm Humanist', heading: 'Nunito', body: 'Nunito Sans', vibe: 'friendly' },
  { name: 'Swiss Precision', heading: 'Satoshi', body: 'Inter', vibe: 'minimal' },
  { name: 'Luxury Display', heading: 'Cormorant Garamond', body: 'Inter', vibe: 'luxurious' },
  { name: 'Tech Mono Mix', heading: 'JetBrains Mono', body: 'Inter', vibe: 'technical' },

];

// ─── Hero Variants ──────────────────────────────────────────────────────────

export interface HeroVariant {
  id: string;
  name: string;
  description: string;
}

const HERO_VARIANTS: HeroVariant[] = [
  {
    id: 'gradient-bold',
    name: 'Bold Gradient',
    description: 'Full-width gradient background (primary to secondary) with large centered text, two CTA buttons, and decorative blur circles. Text is white/light on the gradient.',
  },
  {
    id: 'split-image',
    name: 'Split Layout',
    description: 'Two-column layout: left side has headline, description, and CTAs on a light/white background. Right side has a large image placeholder or illustration area with a subtle background shape.',
  },
  {
    id: 'dark-hero',
    name: 'Dark Cinematic',
    description: 'Dark/near-black background (bg-gray-950 or bg-neutral-900) with white text, a subtle gradient overlay, floating decorative dots or grid pattern, and a prominent glowing CTA button.',
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'White/very light background, centered text with extra-large typography, minimal decorations. Only a thin accent line or small icon above the headline. Lots of whitespace. Single CTA.',
  },
  {
    id: 'angled-bg',
    name: 'Angled Background',
    description: 'Hero with a diagonal/angled background split — top portion is colored (primary gradient), bottom is white. Content sits at the intersection. Creates dynamic visual movement.',
  },
  {
    id: 'video-bg-style',
    name: 'Full-Bleed Image',
    description: 'Full-width background image placeholder with dark overlay (bg-black/60). White text centered on top. Tall hero (min-h-[80vh]). Evokes premium/cinematic feel.',
  },
  {
    id: 'card-hero',
    name: 'Card Overlay',
    description: 'Subtle patterned or light gradient background with a floating white card in the center containing the headline, description, and CTAs. Card has shadow-2xl and rounded-2xl.',
  },
  {
    id: 'asymmetric',
    name: 'Asymmetric Layout',
    description: 'Off-center layout where text is positioned on the left third, with a large decorative shape (circle or blob using primary color at 10-20% opacity) on the right. Creates visual interest through asymmetry.',
  },
  {
    id: 'floating-cards',
    name: 'Floating Cards Hero',
    description: 'Dark or gradient background with the headline on the left, and 2-3 floating glassmorphism cards (tilted slightly with rotate-1, rotate-2) on the right side showing key stats, features, or testimonials. Cards use bg-white/10 backdrop-blur-xl with shadow-2xl.',
  },
  {
    id: 'text-reveal',
    name: 'Oversized Typography',
    description: 'Minimal hero focused on massive typography. Business name in text-8xl lg:text-9xl font-black with gradient text treatment. A single compelling tagline below in normal size. One CTA button. Background is white or very light with subtle grain texture. No images.',
  },
  {
    id: 'magazine-layout',
    name: 'Magazine Editorial',
    description: 'Editorial/magazine-style layout with a large image taking up 60% of the hero, text overlapping the image boundary on one side (negative margin). Thin accent lines and small uppercase labels. Feels like a high-end print layout translated to web.',
  },
  {
    id: 'stacked-media',
    name: 'Stacked Image Collage',
    description: 'Three overlapping images arranged in a stacked/offset pattern on one side of the hero (like photos scattered on a desk). Text on the other side. Creates depth through z-index layering and slight rotations. Shadow on each image.',
  },
  {
    id: 'wave-gradient',
    name: 'Wave Gradient',
    description: 'Hero with a flowing wave-shaped gradient background (using SVG wave at the bottom). Gradient goes from primary-600 at top to primary-900 at bottom. Content centered on the gradient. Wave separates hero from next section smoothly.',
  },
  {
    id: 'spotlight',
    name: 'Spotlight Focus',
    description: 'Near-black background (bg-gray-950) with a radial gradient spotlight effect (a large circle of primary-500/20 behind the text). White headline with one word in accent color. Dramatic, cinematic feel. Small decorative dots or stars scattered.',
  },
];

// ─── Layout Patterns ────────────────────────────────────────────────────────

export interface LayoutPattern {
  id: string;
  name: string;
  description: string;
}

const SECTION_LAYOUT_PATTERNS: LayoutPattern[] = [
  {
    id: 'cards-grid',
    name: 'Card Grid',
    description: 'Features/services displayed in a responsive card grid (3-col desktop, 2-col tablet, 1-col mobile). Each card has an icon, title, and description with hover lift effect.',
  },
  {
    id: 'alternating-rows',
    name: 'Alternating Rows',
    description: 'Features shown as alternating left-right rows. Odd rows: image left, text right. Even rows: text left, image right. Creates a zigzag visual flow down the page.',
  },
  {
    id: 'icon-list',
    name: 'Icon + Text List',
    description: 'Vertical list of features with a large icon on the left and title + description on the right. Clean, scannable layout. Good for 4-6 items.',
  },
  {
    id: 'bento-grid',
    name: 'Bento Grid',
    description: 'Asymmetric grid layout (like Apple/Vercel style) where items have different sizes. One large featured item spans 2 columns, others are single-column. Creates visual hierarchy.',
  },
  {
    id: 'centered-stack',
    name: 'Centered Stack',
    description: 'All items centered and stacked vertically with generous spacing. Each item has a centered icon, large title, and description. Minimalist and elegant.',
  },
  {
    id: 'sidebar-features',
    name: 'Sidebar + Content',
    description: 'Left sidebar with feature/service navigation tabs. Right content area shows the selected feature detail with image and description. Interactive tab-switching layout.',
  },
  {
    id: 'timeline',
    name: 'Timeline Layout',
    description: 'Vertical timeline with alternating left-right content blocks connected by a central line and dots. Each node has an icon, title, and description. Great for process steps, history, or milestones.',
  },
  {
    id: 'overlap-grid',
    name: 'Overlapping Grid',
    description: 'Cards that slightly overlap each other in a staggered grid. First card has a larger size spanning 2 rows. Creates depth with varying z-index and shadow levels. Premium, magazine-style layout.',
  },
];

const TESTIMONIAL_PATTERNS: LayoutPattern[] = [
  {
    id: 'cards-row',
    name: 'Card Row',
    description: '3 testimonial cards in a horizontal row with avatar, star rating, quote text, and name/role. Cards have subtle background and hover rotation.',
  },
  {
    id: 'large-quote',
    name: 'Large Featured Quote',
    description: 'One large testimonial at the center with oversized quotation marks, large text, and prominent attribution. Flanked by smaller quotes on either side.',
  },
  {
    id: 'masonry',
    name: 'Masonry Layout',
    description: 'Testimonials in a masonry/Pinterest-style layout with varying heights. Some quotes are short, some long. Creates organic, authentic feel.',
  },
  {
    id: 'slider',
    name: 'Carousel Slider',
    description: 'Single testimonial visible at a time with arrow buttons to navigate and dot indicators. Auto-advances. Smooth slide transition.',
  },
];

// ─── Navbar Variants ────────────────────────────────────────────────────────

export interface NavbarVariant {
  id: string;
  description: string;
}

const NAVBAR_VARIANTS: NavbarVariant[] = [
  {
    id: 'glassmorphism',
    description: 'Glassmorphism: `fixed top-0 w-full z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-sm`. Light, transparent feel.',
  },
  {
    id: 'solid-white',
    description: 'Solid white: `fixed top-0 w-full z-50 bg-white shadow-md`. Clean and crisp with stronger shadow.',
  },
  {
    id: 'dark-nav',
    description: 'Dark navbar: `fixed top-0 w-full z-50 bg-gray-950 text-white border-b border-gray-800`. Text is white/gray-300, CTA button uses accent color.',
  },
  {
    id: 'transparent-hero',
    description: 'Transparent over hero: `fixed top-0 w-full z-50 bg-transparent`. Text is white. Adds bg-white/90 backdrop-blur-md shadow-sm on scroll using a useEffect scroll listener.',
  },
  {
    id: 'colored-nav',
    description: 'Brand colored: `fixed top-0 w-full z-50 bg-primary-600 text-white shadow-md`. CTA button uses white bg with primary text color.',
  },
];

// ─── Industry Mapping ───────────────────────────────────────────────────────

interface IndustryProfile {
  paletteGroup: string;
  fontVibes: string[];
  heroStyles: string[];
  sectionLayouts: string[];
  testimonialStyles: string[];
  navbarStyles: string[];
  visualNotes: string;
}

const INDUSTRY_PROFILES: Record<string, IndustryProfile> = {
  landscaping: {
    paletteGroup: 'nature',
    fontVibes: ['bold', 'friendly', 'contemporary'],
    heroStyles: ['split-image', 'full-bleed-image', 'gradient-bold', 'angled-bg'],
    sectionLayouts: ['cards-grid', 'alternating-rows', 'bento-grid'],
    testimonialStyles: ['cards-row', 'masonry'],
    navbarStyles: ['glassmorphism', 'solid-white', 'transparent-hero'],
    visualNotes: 'Use nature imagery placeholders. Emphasize outdoor/green spaces.',
  },
  restaurant: {
    paletteGroup: 'warm',
    fontVibes: ['elegant', 'classic', 'luxurious'],
    heroStyles: ['video-bg-style', 'dark-hero', 'split-image', 'spotlight', 'magazine-layout'],
    sectionLayouts: ['alternating-rows', 'bento-grid', 'centered-stack'],
    testimonialStyles: ['large-quote', 'slider'],
    navbarStyles: ['dark-nav', 'transparent-hero', 'glassmorphism'],
    visualNotes: 'Warm, inviting atmosphere. Food-focused imagery placeholders.',
  },
  technology: {
    paletteGroup: 'tech',
    fontVibes: ['technical', 'minimal', 'bold'],
    heroStyles: ['gradient-bold', 'dark-hero', 'minimal-clean', 'asymmetric', 'floating-cards', 'text-reveal', 'spotlight'],
    sectionLayouts: ['bento-grid', 'cards-grid', 'sidebar-features'],
    testimonialStyles: ['cards-row', 'slider'],
    navbarStyles: ['glassmorphism', 'dark-nav', 'transparent-hero'],
    visualNotes: 'Modern, cutting-edge feel. Abstract shapes and gradients.',
  },
  healthcare: {
    paletteGroup: 'health',
    fontVibes: ['minimal', 'friendly', 'corporate'],
    heroStyles: ['split-image', 'minimal-clean', 'card-hero'],
    sectionLayouts: ['cards-grid', 'icon-list', 'centered-stack'],
    testimonialStyles: ['cards-row', 'large-quote'],
    navbarStyles: ['solid-white', 'glassmorphism'],
    visualNotes: 'Clean, trustworthy, calming. Soft rounded corners.',
  },
  realestate: {
    paletteGroup: 'luxury',
    fontVibes: ['luxury', 'serif-heavy', 'elegant'],
    heroStyles: ['video-bg-style', 'dark-hero', 'split-image', 'magazine-layout', 'stacked-media'],
    sectionLayouts: ['bento-grid', 'alternating-rows', 'cards-grid'],
    testimonialStyles: ['large-quote', 'cards-row'],
    navbarStyles: ['dark-nav', 'transparent-hero', 'glassmorphism'],
    visualNotes: 'Premium, aspirational. Property-focused imagery.',
  },
  fitness: {
    paletteGroup: 'warm',
    fontVibes: ['bold', 'contemporary', 'friendly'],
    heroStyles: ['video-bg-style', 'gradient-bold', 'dark-hero', 'angled-bg'],
    sectionLayouts: ['cards-grid', 'alternating-rows', 'bento-grid'],
    testimonialStyles: ['masonry', 'slider'],
    navbarStyles: ['dark-nav', 'colored-nav', 'glassmorphism'],
    visualNotes: 'High energy, dynamic. Action-oriented imagery.',
  },
  education: {
    paletteGroup: 'cool',
    fontVibes: ['friendly', 'minimal', 'contemporary'],
    heroStyles: ['split-image', 'card-hero', 'minimal-clean'],
    sectionLayouts: ['cards-grid', 'icon-list', 'alternating-rows'],
    testimonialStyles: ['cards-row', 'slider'],
    navbarStyles: ['glassmorphism', 'solid-white', 'colored-nav'],
    visualNotes: 'Approachable, organized. Learning-focused visuals.',
  },
  ecommerce: {
    paletteGroup: 'creative',
    fontVibes: ['contemporary', 'bold', 'friendly'],
    heroStyles: ['split-image', 'video-bg-style', 'gradient-bold', 'angled-bg'],
    sectionLayouts: ['bento-grid', 'cards-grid'],
    testimonialStyles: ['cards-row', 'masonry'],
    navbarStyles: ['solid-white', 'glassmorphism', 'dark-nav'],
    visualNotes: 'Product-focused, visually rich. Shopping-oriented layout.',
  },
  legal: {
    paletteGroup: 'luxury',
    fontVibes: ['classic', 'corporate', 'elegant'],
    heroStyles: ['minimal-clean', 'split-image', 'dark-hero'],
    sectionLayouts: ['icon-list', 'alternating-rows', 'centered-stack'],
    testimonialStyles: ['large-quote', 'cards-row'],
    navbarStyles: ['solid-white', 'dark-nav'],
    visualNotes: 'Authoritative, trustworthy. Minimal decorations.',
  },
  creative: {
    paletteGroup: 'creative',
    fontVibes: ['bold', 'contemporary', 'artistic'],
    heroStyles: ['asymmetric', 'dark-hero', 'gradient-bold', 'card-hero', 'text-reveal', 'floating-cards', 'spotlight'],
    sectionLayouts: ['bento-grid', 'masonry', 'alternating-rows'],
    testimonialStyles: ['masonry', 'large-quote'],
    navbarStyles: ['transparent-hero', 'dark-nav', 'glassmorphism'],
    visualNotes: 'Expressive, artistic. Bold typography and colors.',
  },
  construction: {
    paletteGroup: 'warm',
    fontVibes: ['bold', 'corporate', 'contemporary'],
    heroStyles: ['video-bg-style', 'gradient-bold', 'split-image'],
    sectionLayouts: ['cards-grid', 'alternating-rows', 'icon-list'],
    testimonialStyles: ['cards-row', 'slider'],
    navbarStyles: ['solid-white', 'colored-nav', 'dark-nav'],
    visualNotes: 'Strong, reliable. Project/work imagery.',
  },
  finance: {
    paletteGroup: 'cool',
    fontVibes: ['corporate', 'minimal', 'classic'],
    heroStyles: ['minimal-clean', 'split-image', 'gradient-bold'],
    sectionLayouts: ['icon-list', 'cards-grid', 'centered-stack'],
    testimonialStyles: ['large-quote', 'cards-row'],
    navbarStyles: ['solid-white', 'glassmorphism'],
    visualNotes: 'Professional, trustworthy. Data-driven visuals.',
  },
};

// Catch-all for industries not explicitly listed
const DEFAULT_PROFILE: IndustryProfile = {
  paletteGroup: 'cool',
  fontVibes: ['minimal', 'contemporary', 'clean'],
  heroStyles: ['gradient-bold', 'split-image', 'minimal-clean', 'dark-hero'],
  sectionLayouts: ['cards-grid', 'alternating-rows', 'bento-grid'],
  testimonialStyles: ['cards-row', 'large-quote', 'slider'],
  navbarStyles: ['glassmorphism', 'solid-white', 'dark-nav'],
  visualNotes: 'Clean and professional.',
};

// ─── Hashing / Selection ────────────────────────────────────────────────────

/**
 * Simple deterministic hash to pick consistent but varied options
 * based on business name + industry combination.
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

function pickFromArray<T>(arr: T[], hash: number, offset = 0): T {
  return arr[(hash + offset) % arr.length];
}

// ─── Industry Matching ──────────────────────────────────────────────────────

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  landscaping: ['landscap', 'lawn', 'garden', 'outdoor', 'tree', 'mowing', 'irrigation', 'hardscape'],
  restaurant: ['restaurant', 'food', 'dining', 'cafe', 'bakery', 'catering', 'pizza', 'sushi', 'bar', 'grill', 'bistro', 'kitchen'],
  technology: ['tech', 'software', 'saas', 'app', 'digital', 'ai', 'cloud', 'cyber', 'data', 'platform', 'startup'],
  healthcare: ['health', 'medical', 'dental', 'clinic', 'wellness', 'therapy', 'doctor', 'nursing', 'hospital', 'pharma', 'chiropractic'],
  realestate: ['real estate', 'realty', 'property', 'housing', 'mortgage', 'apartment', 'home', 'condo'],
  fitness: ['fitness', 'gym', 'yoga', 'workout', 'personal train', 'crossfit', 'martial art', 'pilates', 'sport'],
  education: ['education', 'school', 'tutoring', 'learning', 'academy', 'course', 'training', 'university', 'teaching'],
  ecommerce: ['shop', 'store', 'retail', 'ecommerce', 'e-commerce', 'marketplace', 'boutique', 'fashion', 'clothing'],
  legal: ['law', 'legal', 'attorney', 'lawyer', 'firm', 'litigation', 'counsel'],
  creative: ['design', 'creative', 'art', 'photography', 'studio', 'agency', 'branding', 'portfolio', 'media', 'video', 'film'],
  construction: ['construction', 'building', 'contractor', 'roofing', 'plumbing', 'electric', 'hvac', 'renovation', 'remodel', 'handyman', 'painting', 'flooring'],
  finance: ['finance', 'accounting', 'bank', 'investment', 'insurance', 'tax', 'wealth', 'financial', 'consulting'],
};

function matchIndustry(industry: string, description: string): string {
  const searchText = `${industry} ${description}`.toLowerCase();

  let bestMatch = 'default';
  let bestScore = 0;

  for (const [key, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (searchText.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = key;
    }
  }

  return bestMatch;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export interface DesignVariety {
  palette: ColorPalette;
  fonts: FontPairing;
  heroVariant: HeroVariant;
  sectionLayout: LayoutPattern;
  testimonialLayout: LayoutPattern;
  navbarVariant: NavbarVariant;
  industryProfile: IndustryProfile;
  matchedIndustry: string;
}

/**
 * Given a business name, industry, and description, returns a unique
 * combination of design choices that creates a distinctive website.
 */
export function getDesignVariety(
  businessName: string,
  industry: string,
  description: string
): DesignVariety {
  const matchedIndustry = matchIndustry(industry, description);
  const profile = INDUSTRY_PROFILES[matchedIndustry] || DEFAULT_PROFILE;

  // Hash based on business name + industry for consistency
  const hash = simpleHash(`${businessName.toLowerCase()}-${industry.toLowerCase()}`);

  // Pick palette from the industry's palette group
  const paletteGroup = PALETTES[profile.paletteGroup] || PALETTES.cool;
  const palette = pickFromArray(paletteGroup, hash);

  // Pick fonts from the industry's preferred vibes
  const matchingFonts = FONT_PAIRINGS.filter((f) => profile.fontVibes.includes(f.vibe));
  const fonts = matchingFonts.length > 0
    ? pickFromArray(matchingFonts, hash, 1)
    : pickFromArray(FONT_PAIRINGS, hash, 1);

  // Pick hero variant from industry preferences
  const matchingHeroes = HERO_VARIANTS.filter((h) => profile.heroStyles.includes(h.id));
  const heroVariant = matchingHeroes.length > 0
    ? pickFromArray(matchingHeroes, hash, 2)
    : pickFromArray(HERO_VARIANTS, hash, 2);

  // Pick section layout pattern
  const matchingLayouts = SECTION_LAYOUT_PATTERNS.filter((l) => profile.sectionLayouts.includes(l.id));
  const sectionLayout = matchingLayouts.length > 0
    ? pickFromArray(matchingLayouts, hash, 3)
    : pickFromArray(SECTION_LAYOUT_PATTERNS, hash, 3);

  // Pick testimonial pattern
  const matchingTestimonials = TESTIMONIAL_PATTERNS.filter((t) => profile.testimonialStyles.includes(t.id));
  const testimonialLayout = matchingTestimonials.length > 0
    ? pickFromArray(matchingTestimonials, hash, 4)
    : pickFromArray(TESTIMONIAL_PATTERNS, hash, 4);

  // Pick navbar variant
  const matchingNavbars = NAVBAR_VARIANTS.filter((n) => profile.navbarStyles.includes(n.id));
  const navbarVariant = matchingNavbars.length > 0
    ? pickFromArray(matchingNavbars, hash, 5)
    : pickFromArray(NAVBAR_VARIANTS, hash, 5);

  return {
    palette,
    fonts,
    heroVariant,
    sectionLayout,
    testimonialLayout,
    navbarVariant,
    industryProfile: profile,
    matchedIndustry,
  };
}

/**
 * Generates a design variety instruction block that gets injected into
 * the AI component generation prompt. This tells Claude exactly what
 * visual approach to use for THIS specific website.
 */
export function buildVarietyInstructions(variety: DesignVariety): string {
  return `
=== DESIGN VARIETY — UNIQUE VISUAL IDENTITY FOR THIS SITE ===

**Color Palette: "${variety.palette.name}"** (Mood: ${variety.palette.mood})
Primary: ${variety.palette.primary} | Secondary: ${variety.palette.secondary} | Accent: ${variety.palette.accent}

**Typography Pairing: "${variety.fonts.name}"** (Vibe: ${variety.fonts.vibe})
Headings: ${variety.fonts.heading} | Body: ${variety.fonts.body}

**HERO STYLE: "${variety.heroVariant.name}"**
${variety.heroVariant.description}
IMPORTANT: Follow this hero layout EXACTLY. Do NOT default to the standard gradient hero every time.

**NAVBAR STYLE: "${variety.navbarVariant.id}"**
${variety.navbarVariant.description}
IMPORTANT: Use this specific navbar style, not the default glassmorphism.

**FEATURES/SERVICES LAYOUT: "${variety.sectionLayout.name}"**
${variety.sectionLayout.description}
IMPORTANT: Use this layout pattern for the main features/services section.

**TESTIMONIALS LAYOUT: "${variety.testimonialLayout.name}"**
${variety.testimonialLayout.description}
IMPORTANT: Use this testimonial layout instead of the default card grid.

**VISUAL NOTES**: ${variety.industryProfile.visualNotes}

CRITICAL — READ THIS CAREFULLY:
This website must look COMPLETELY DIFFERENT from every other website you have ever generated.
- The hero MUST use the "${variety.heroVariant.name}" style described above — NOT a generic gradient hero
- The features/services section MUST use the "${variety.sectionLayout.name}" layout — NOT a basic 3-column card grid
- The testimonials MUST use the "${variety.testimonialLayout.name}" pattern — NOT the same cards-in-a-row
- The navbar MUST follow the "${variety.navbarVariant.id}" style — NOT default glassmorphism
- VARY the section backgrounds: alternate between white, tinted (primary-50), dark (gray-900), and gradient backgrounds
- Use CREATIVE section dividers: wave SVGs, angled clip-paths, or overlapping elements — NOT just flat color changes
- This site's color mood is "${variety.palette.mood}" — let this mood INFUSE every design decision
- Typography pairing is "${variety.fonts.name}" (${variety.fonts.vibe}) — use this to create the right emotional tone

If your output looks like a generic template, you have FAILED. This must look like a custom \$10,000+ design.
`;
}

/**
 * Override auto-picked variety with user-selected choices from the form.
 */
export function overrideVarietyWithUserChoices(
  variety: DesignVariety,
  config: GenerationConfig
): DesignVariety {
  const result = { ...variety };

  // Override hero variant if user selected one
  const heroSection = config.sections.find((s) => s.type === 'hero');
  if (heroSection?.variant) {
    const matched = HERO_VARIANTS.find((h) => h.id === heroSection.variant);
    if (matched) {
      result.heroVariant = matched;
    }
  }

  // Override navbar style from navigation config
  if (config.navigation?.navbarStyle) {
    const navbarMap: Record<string, string> = {
      transparent: 'transparent-hero',
      solid: 'solid-white',
      glassmorphism: 'glassmorphism',
      dark: 'dark-nav',
      colored: 'colored-nav',
    };
    const navId = navbarMap[config.navigation.navbarStyle] || config.navigation.navbarStyle;
    const matchedNav = NAVBAR_VARIANTS.find((n) => n.id === navId);
    if (matchedNav) {
      result.navbarVariant = matchedNav;
    }
  }

  return result;
}
