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
  moving: [
    { name: 'Kraft & Ink', primary: '#1c1917', secondary: '#e7e5e4', accent: '#c2703d', mood: 'steady' },
    { name: 'Haul Navy', primary: '#1e3a5f', secondary: '#f1f5f9', accent: '#f59e0b', mood: 'dependable' },
    { name: 'Route Green', primary: '#14532d', secondary: '#f5f5f4', accent: '#d97706', mood: 'practical' },
    { name: 'Slate Cargo', primary: '#334155', secondary: '#e2e8f0', accent: '#ca8a04', mood: 'organised' },
  ],
  pestcontrol: [
    { name: 'Guard Navy', primary: '#1e293b', secondary: '#e2e8f0', accent: '#65a30d', mood: 'protective' },
    { name: 'Charcoal Signal', primary: '#27272a', secondary: '#d4d4d8', accent: '#f59e0b', mood: 'technical' },
    { name: 'Deep Olive', primary: '#3f3f26', secondary: '#e7e5e4', accent: '#0ea5e9', mood: 'grounded' },
    { name: 'Slate Shield', primary: '#334155', secondary: '#f1f5f9', accent: '#16a34a', mood: 'assured' },
  ],
  cleaning: [
    { name: 'Fresh Slate', primary: '#0f766e', secondary: '#e7e5e4', accent: '#f59e0b', mood: 'crisp' },
    { name: 'Deep Teal', primary: '#115e59', secondary: '#f5f5f4', accent: '#84cc16', mood: 'dependable' },
    { name: 'Ink & Citrus', primary: '#1e293b', secondary: '#e2e8f0', accent: '#eab308', mood: 'brisk' },
    { name: 'Soft Marine', primary: '#155e75', secondary: '#f0fdfa', accent: '#f97316', mood: 'reassuring' },
  ],
  salon: [
    { name: 'Warm Clay', primary: '#7c2d12', secondary: '#d6d3d1', accent: '#c9a227', mood: 'tactile' },
    { name: 'Soft Plaster', primary: '#292524', secondary: '#e7e5e4', accent: '#c58b7a', mood: 'calm' },
    { name: 'Brass & Bone', primary: '#1c1917', secondary: '#f5f5f4', accent: '#b08d57', mood: 'refined' },
    { name: 'Dusk Rose', primary: '#4c1d24', secondary: '#e8dcd4', accent: '#a8927e', mood: 'intimate' },
  ],
  automotive: [
    { name: 'Lacquer Black', primary: '#0c0a09', secondary: '#44403c', accent: '#dc2626', mood: 'showroom' },
    { name: 'Chrome & Graphite', primary: '#1c1917', secondary: '#a8a29e', accent: '#0ea5e9', mood: 'precision' },
    { name: 'Garage Amber', primary: '#171717', secondary: '#525252', accent: '#f59e0b', mood: 'workshop' },
    { name: 'Deep Marine', primary: '#0f172a', secondary: '#334155', accent: '#22d3ee', mood: 'detailed' },
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
    description: 'Asymmetric gradient hero: content occupies the left 7 columns of a 12-column grid with an oversized headline, ONE dominant CTA button plus a simple text link beside it. Background is a gradient from primary-700 to primary-900 with an animate-gradient-shift background treatment. Decorative layer: a fine inline-SVG dot-grid pattern overlay at 4% opacity across the right third of the gradient (pointer-events-none). Motion: stagger the headline, sub-copy, and CTA entrances with animate-fade-in-up at 100ms increments. Text is white/light on the gradient. NO decorative blur circles, NO centered layout with two side-by-side buttons.',
  },
  {
    id: 'split-image',
    name: 'Split Layout',
    description: 'Two-column layout: left side has headline, description, and CTAs on a light/white background. Right side has a large image placeholder or illustration area with a subtle background shape. Decorative layer: back the image with an offset rounded-3xl tinted panel (primary-100, shifted down-right, behind via z-index) so it reads as stacked layers, plus one glass badge chip (backdrop-blur-md bg-white/60 ring-1) overlapping the image corner. Motion: text column enters with animate-slide-in-left, image with animate-slide-in-right, and the badge chip idles on animate-float.',
  },
  {
    id: 'dark-hero',
    name: 'Dark Cinematic',
    description: 'Dark/near-black background (bg-gray-950 or bg-neutral-900) with white text, a subtle gradient overlay, an optional grid/dot texture at 2-3% opacity, and a prominent solid high-contrast CTA button (no glow effects). Decorative layer: one very large blurred primary-600/10 orb anchored half off the top-right corner — soft structural depth, NOT a neon glow. Motion: headline enters with animate-blur-in, supporting copy with animate-fade-in-up, and a scroll-cue chevron at bottom-center gently floats (animate-float). All text stays white/gray-100 on the dark surface.',
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'White/very light background, centered text with extra-large typography, minimal decorations. Only a thin accent line or small icon above the headline. Lots of whitespace. Single CTA. Decorative layer: one whisper-quiet oversized outlined echo of the key headline word behind the text (text-transparent, 1px stroke, 4% opacity, select-none pointer-events-none) — nearly subliminal, the minimalism stays intact. Motion: headline enters with animate-rise-in and the thin accent line draws in with animate-scale-in. Text remains text-gray-900 on the light background.',
  },
  {
    id: 'angled-bg',
    name: 'Angled Background',
    description: 'Hero with a diagonal/angled background split — top portion is colored (primary gradient), bottom is white. Content sits at the intersection. Creates dynamic visual movement. Decorative layer: a 4%-opacity dot-grid overlay on the colored portion, plus a small stat/badge card (rounded-3xl, ring-1, shadow-xl, z-10) overlapping the diagonal seam. Motion: content rises with animate-rise-in and the seam-straddling badge card idles on animate-float. Keep white text on the colored portion, dark text on the white portion.',
  },
  {
    id: 'video-bg-style',
    name: 'Full-Bleed Image',
    description: 'Full-width background image placeholder with dark overlay (bg-black/60). White text centered on top. Tall hero (min-h-[80vh]). Evokes premium/cinematic feel. Decorative layer: a soft dot-grid pattern overlay at 4% opacity in one corner (pointer-events-none). Motion: slow animate-kenburns zoom on the backdrop image, headline enters with animate-blur-in, and a scroll-cue chevron at bottom-center gently floats (animate-float). White text stays on the dark overlay at all times.',
  },
  {
    id: 'card-hero',
    name: 'Card Overlay',
    description: 'Subtle patterned or light gradient background with a floating white card in the center containing the headline, description, and CTAs. Card has shadow-2xl and rounded-2xl. Decorative layer: two offset rounded-3xl tinted panes (primary-100 and a soft accent tint, ring-1) peeking out behind the white card so it reads as layered paper. Motion: the card enters with animate-scale-in while the background gradient drifts slowly with animate-gradient-shift. Dark text (text-gray-900) inside the white card.',
  },
  {
    id: 'asymmetric',
    name: 'Asymmetric Layout',
    description: 'Off-center layout where text is positioned on the left third, with a large decorative shape (circle or blob using primary color at 10-20% opacity) on the right. Creates visual interest through asymmetry. Decorative layer: give the large shape a companion — a small 4%-opacity dot-grid patch tucked behind the text column (pointer-events-none). Motion: the shape rotates almost imperceptibly with animate-spin-slow while the headline enters with animate-slide-in-left and the shape settles in with animate-blur-in.',
  },
  {
    id: 'floating-cards',
    name: 'Floating Cards Hero',
    description: 'Dark or gradient background with the headline on the left, and 2-3 floating glassmorphism cards (tilted slightly with rotate-1, rotate-2) on the right side showing key stats, features, or testimonials. Cards use bg-white/10 backdrop-blur-xl with shadow-2xl. Decorative layer: give each glass card a ring-1 ring-white/20 edge and tuck a faint grid texture at 3% opacity behind the card cluster. Motion: each card idles on animate-float with staggered delays so the stack feels alive, and the headline enters with animate-fade-in-up. All text on the dark/gradient background stays white.',
  },
  {
    id: 'text-reveal',
    name: 'Oversized Typography',
    description: 'Minimal hero focused on massive typography. Business name in text-8xl lg:text-9xl font-black with gradient text treatment. A single compelling tagline below in normal size. One CTA button. Background is white or very light with subtle grain texture. No images. Decorative layer: an oversized outlined echo of one keyword behind the headline (text-transparent, 1px stroke, 5% opacity, select-none pointer-events-none). Motion: the giant headline enters with animate-blur-in and a single animate-shimmer highlight sweeps across the gradient text treatment.',
  },
  {
    id: 'magazine-layout',
    name: 'Magazine Editorial',
    description: 'Editorial/magazine-style layout with a large image taking up 60% of the hero, text overlapping the image boundary on one side (negative margin). Thin accent lines and small uppercase labels. Feels like a high-end print layout translated to web. Decorative layer: a huge outlined folio word or issue number behind the text block at 5% opacity (text-transparent, 1px stroke, pointer-events-none). Motion: a very slow animate-kenburns drift on the large image, the overlapping text block rises in with animate-rise-in, and the thin accent rules draw in with animate-scale-in.',
  },
  {
    id: 'stacked-media',
    name: 'Stacked Image Collage',
    description: 'Three overlapping images arranged in a stacked/offset pattern on one side of the hero (like photos scattered on a desk). Text on the other side. Creates depth through z-index layering and slight rotations. Shadow on each image. Decorative layer: a 4%-opacity dot-grid patch tucked behind the photo stack, plus a glass caption chip (backdrop-blur-md bg-white/15 ring-1 ring-white/25) pinned to the front image. Motion: each photo enters with animate-scale-in at staggered delays and the top photo idles on a barely-perceptible animate-float.',
  },
  {
    id: 'wave-gradient',
    name: 'Wave Gradient',
    description: 'Hero with a flowing wave-shaped gradient background (using SVG wave at the bottom). Gradient goes from primary-600 at top to primary-900 at bottom. Content centered on the gradient. Wave separates hero from next section smoothly. Decorative layer: echo the main wave with one or two thin translucent SVG wave strokes (white at roughly 10% opacity) floating above it for layered depth. Motion: the gradient stays alive with a slow animate-gradient-shift, content enters with animate-fade-in-up, and a scroll-cue chevron gently floats (animate-float). White text on the gradient.',
  },
  {
    id: 'spotlight',
    name: 'Spotlight Focus',
    description: 'Near-black background (bg-gray-950) with a radial gradient spotlight effect (a large circle of primary-500/20 behind the text). White headline with one word in accent color. Dramatic, cinematic feel — no scattered decorative dots or stars. Decorative layer: faint concentric topo-style SVG rings around the spotlight at 3-4% white opacity (pointer-events-none). Motion: headline enters with animate-blur-in, the accent word follows with a slightly delayed animate-fade-in, and a minimal scroll-cue chevron floats at the bottom (animate-float). Still no glow effects on buttons.',
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
    description: 'Feature cards with full-bleed image tops in a mixed-size grid (one featured card spans 2 columns), text content below each image, hover lift — never icon+title+description-only cards. Depth & divider: cards are rounded-3xl with ring-1 ring-gray-900/5 and layered shadows (a tight shadow-md plus a softer ambient shadow on hover); let the featured card overlap the section heading zone slightly with negative top margin and z-10; when this section abuts a contrasting background, separate the two with one of the SECTION DIVIDER snippets (SVG wave or diagonal) instead of a hard edge.',
  },
  {
    id: 'alternating-rows',
    name: 'Alternating Rows',
    description: 'Features shown as alternating left-right rows. Odd rows: image left, text right. Even rows: text left, image right. Creates a zigzag visual flow down the page. Depth & divider: images sit in rounded-3xl frames with ring-1 and layered shadows, and each image gets a small offset tinted panel behind it (overlapping via z-index) so rows read as stacked layers rather than flat halves; hand off to any adjacent contrasting section with one of the SECTION DIVIDER snippets.',
  },
  {
    id: 'icon-list',
    name: 'Icon + Text List',
    description: 'Vertical list of features with a large icon on the left and title + description on the right. Clean, scannable layout. Good for 4-6 items. Depth & divider: wrap each row in a rounded-3xl ring-1 card that lifts with layered shadows on hover, and let the icon medallion overlap the card edge (negative margin, z-10) for depth; if this section neighbors a contrasting band, split them with one of the SECTION DIVIDER snippets.',
  },
  {
    id: 'bento-grid',
    name: 'Bento Grid',
    description: 'Asymmetric grid layout (like Apple/Vercel style) where items have different sizes. One large featured item spans 2 columns, others are single-column. Creates visual hierarchy. Depth & divider: bento cells are rounded-3xl with ring-1 ring-gray-900/5 and layered shadows, and the featured cell may overlap the grid gap with z-10 for a collage feel; transitions into darker or contrasting neighboring sections use one of the SECTION DIVIDER snippets (wave or diagonal).',
  },
  {
    id: 'centered-stack',
    name: 'Centered Stack',
    description: 'All items centered and stacked vertically with generous spacing. Each item has a centered icon, large title, and description. Minimalist and elegant. Depth & divider: give each item a floating rounded-3xl ring-1 card treatment with soft layered shadows, or a subtle tinted backdrop layer that overlaps the previous item slightly via z-index so the stack has depth; close the section against contrasting neighbors with one of the SECTION DIVIDER snippets.',
  },
  {
    id: 'sidebar-features',
    name: 'Sidebar + Content',
    description: 'Left sidebar with feature/service navigation tabs. Right content area shows the selected feature detail with image and description. Interactive tab-switching layout. Depth & divider: the content panel is a rounded-3xl ring-1 card with layered shadows, and the active tab indicator overlaps the panel edge with z-10 so the two planes visibly interlock; when this section touches a contrasting background, hand off with one of the SECTION DIVIDER snippets.',
  },
  {
    id: 'timeline',
    name: 'Timeline Layout',
    description: 'Vertical timeline with alternating left-right content blocks connected by a central line and dots. Each node has an icon, title, and description. Great for process steps, history, or milestones. Depth & divider: each node card is rounded-3xl with ring-1 and layered shadows, and the timeline dots overlap the central line with z-10 depth (ringed, not flat); transition into contrasting neighboring sections via one of the SECTION DIVIDER snippets instead of a flat edge.',
  },
  {
    id: 'overlap-grid',
    name: 'Overlapping Grid',
    description: 'Cards that slightly overlap each other in a staggered grid. First card has a larger size spanning 2 rows. Creates depth with varying z-index and shadow levels. Premium, magazine-style layout. Depth & divider: push the layering further — rounded-3xl cards with ring-1, a distinct layered shadow level per z-index tier, and at least one card breaking out of the section padding; separate this section from any contrasting neighbor with one of the SECTION DIVIDER snippets.',
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
    description: 'Glassmorphism: `fixed top-0 w-full z-50 backdrop-blur-md bg-white/90 border-b border-gray-200/50 shadow-sm`. Light, airy feel — always visible, never fully transparent.',
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
    description: 'Elevated over hero: `fixed top-0 w-full z-50 bg-gray-950/85 backdrop-blur-md text-white border-b border-white/10` — always visible; never fully transparent; no scroll-listener background toggling. Keeps the airy over-hero look with guaranteed readability. Mobile menu panel is ALWAYS solid bg-white with text-gray-900.',
  },
  {
    id: 'colored-nav',
    description: 'Brand colored: `fixed top-0 w-full z-50 bg-primary-600 text-white shadow-md`. CTA button uses white bg with text-primary-700.',
  },
];

// ─── Decorative Accents ─────────────────────────────────────────────────────
// Named decorative accent recipes. Two are hash-picked per site and become
// that site's decorative signature, applied at least twice across the page.
// All accents respect the standing bans: no neon glow, no rainbow gradients,
// no scattered emoji — these are craft layers, not clutter.

export interface DecorAccent {
  id: string;
  instruction: string;
}

export const DECOR_ACCENTS: DecorAccent[] = [
  {
    id: 'dot-grid',
    instruction:
      'An inline SVG <pattern> of tiny 1.5px circles rendered as an absolutely-positioned corner overlay (roughly 300-400px square) at 3-5% opacity, pointer-events-none, bleeding off one edge of the section. Use fill="currentColor" so it inherits the section text color and works on both light and dark surfaces.',
  },
  {
    id: 'gradient-ring',
    instruction:
      'One very large ring — a rounded-full circle (600px+) with a thick border in primary-500/10 and blur-2xl — anchored half off one edge of a section, rotating almost imperceptibly with animate-spin-slow, pointer-events-none. Reads as soft structural depth, never a neon glow.',
  },
  {
    id: 'topo-lines',
    instruction:
      'Thin concentric SVG curves (topographic contour lines) drawn with stroke="currentColor" at 4-6% opacity, fill="none", absolutely positioned behind content in one organic-feeling section, pointer-events-none. Best for nature, wellness, and organic brands; skip it for hard-edged tech.',
  },
  {
    id: 'glass-chip',
    instruction:
      'Small glass badge chips floating over imagery — backdrop-blur-md bg-white/15 ring-1 ring-white/25 rounded-full px-3 py-1 text-white text-xs font-medium — carrying a rating, location, or "Since 2008"-style marker. One chip per image maximum; optionally idle it on animate-float.',
  },
  {
    id: 'oversize-outline-word',
    instruction:
      'A huge (text-[10rem] or larger) outlined keyword behind a section heading: text-transparent with a 1px stroke via the arbitrary property [-webkit-text-stroke:1px_currentColor], at roughly 5% opacity, absolutely positioned, select-none pointer-events-none, cropped by overflow-hidden on the section.',
  },
  {
    id: 'marquee-strip',
    instruction:
      'A full-width horizontal band between two sections that scrolls a repeated row of services, keywords, or city names with animate-marquee (duplicate the row content once so the loop is seamless), items separated by small dots or asterisks, uppercase tracking-widest text-sm, on a contrasting background band with correct text contrast.',
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

interface IndustryVisualDNA {
  paletteDirection: string;
  imageryDirection: string;
  layoutDirection: string;
  contentDirection: string;
  avoid: string;
}

const INDUSTRY_PROFILES: Record<string, IndustryProfile> = {
  landscaping: {
    paletteGroup: 'nature',
    fontVibes: ['bold', 'friendly', 'contemporary'],
    heroStyles: ['split-image', 'video-bg-style', 'gradient-bold', 'angled-bg'],
    sectionLayouts: ['cards-grid', 'alternating-rows', 'bento-grid'],
    testimonialStyles: ['cards-row', 'masonry'],
    navbarStyles: ['glassmorphism', 'solid-white', 'transparent-hero'],
    visualNotes: 'Use nature imagery placeholders. Emphasize outdoor/green spaces.',
  },
  moving: {
    paletteGroup: 'moving',
    fontVibes: ['bold', 'friendly', 'contemporary'],
    heroStyles: ['split-image', 'angled-bg', 'spotlight', 'gradient-bold'],
    sectionLayouts: ['cards-grid', 'alternating-rows', 'centered-stack'],
    testimonialStyles: ['cards-row', 'masonry'],
    navbarStyles: ['solid-white', 'transparent-hero', 'glassmorphism'],
    visualNotes: 'Crews, trucks and wrapped furniture carry the page. Real loading, not a stock couple holding a box.',
  },
  pestcontrol: {
    paletteGroup: 'pestcontrol',
    fontVibes: ['bold', 'contemporary', 'technical'],
    heroStyles: ['split-image', 'angled-bg', 'spotlight', 'dark-hero'],
    sectionLayouts: ['cards-grid', 'alternating-rows', 'centered-stack'],
    testimonialStyles: ['cards-row', 'masonry'],
    navbarStyles: ['solid-white', 'transparent-hero', 'glassmorphism'],
    visualNotes: 'The technician, the property and the treatment plan carry the page. Never close-up insect photography.',
  },
  cleaning: {
    paletteGroup: 'cleaning',
    fontVibes: ['friendly', 'contemporary', 'bold'],
    heroStyles: ['split-image', 'angled-bg', 'gradient-bold', 'spotlight'],
    sectionLayouts: ['cards-grid', 'alternating-rows', 'centered-stack'],
    testimonialStyles: ['cards-row', 'masonry'],
    navbarStyles: ['solid-white', 'glassmorphism', 'transparent-hero'],
    visualNotes: 'Before/after and the finished room carry the page. Real spaces, not gloved hands on a white background.',
  },
  salon: {
    paletteGroup: 'salon',
    fontVibes: ['elegant', 'contemporary', 'friendly'],
    heroStyles: ['split-image', 'magazine-layout', 'spotlight', 'dark-hero'],
    sectionLayouts: ['alternating-rows', 'centered-stack', 'bento-grid'],
    testimonialStyles: ['cards-row', 'masonry'],
    navbarStyles: ['transparent-hero', 'solid-white', 'glassmorphism'],
    visualNotes: 'Real client work and the room itself carry the page. Close-ups of finished hair, hands and skin, never stock models.',
  },
  automotive: {
    paletteGroup: 'automotive',
    fontVibes: ['bold', 'contemporary', 'technical'],
    heroStyles: ['dark-hero', 'split-image', 'spotlight', 'video-bg-style'],
    sectionLayouts: ['alternating-rows', 'bento-grid', 'cards-grid'],
    testimonialStyles: ['cards-row', 'masonry'],
    navbarStyles: ['transparent-hero', 'solid-white', 'glassmorphism'],
    visualNotes: 'Paint, reflection and surface detail carry the page. Close-ups of finish, not stock garages.',
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
    fontVibes: ['luxurious', 'elegant', 'classic'],
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
    fontVibes: ['bold', 'contemporary', 'creative'],
    heroStyles: ['asymmetric', 'dark-hero', 'gradient-bold', 'card-hero', 'text-reveal', 'floating-cards', 'spotlight'],
    sectionLayouts: ['bento-grid', 'overlap-grid', 'alternating-rows'],
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

const INDUSTRY_VISUAL_DNA: Record<string, IndustryVisualDNA> = {
  landscaping: {
    paletteDirection: 'Lead with layered greens, moss, sage, deep forest, warm stone, and sunlit earth accents. Green should be the unmistakable first read, but pair it with natural neutrals so it feels premium instead of cartoonish.',
    imageryDirection: 'Use lush yards, native planting, stonework, outdoor-living photography, irrigation details, before/after transformations, and close-up texture shots of leaves, gravel, timber, and water.',
    layoutDirection: 'Use sweeping full-width outdoor photography, before/after galleries, service-area maps, seasonal care sections, project showcases, and image-led alternating rows.',
    contentDirection: 'Emphasize curb appeal, outdoor living, low-maintenance beauty, native planting, drainage, maintenance plans, and local climate expertise.',
    avoid: 'Avoid generic office/team imagery, tech gradients, neon colors, construction-only yellow/black palettes, and icon-card grids without landscape photography.',
  },
  moving: {
    paletteDirection: 'Deep ink, navy or forest against warm paper neutrals, with one kraft-orange or amber accent taken from tape and cardboard.',
    imageryDirection: 'Use the real crew loading, furniture wrapped and strapped, the truck at a kerb, boxes labelled in a hallway, and a settled room at the other end. Avoid stock couples holding a single box and avoid empty white rooms.',
    layoutDirection: 'Use a quote form or estimate CTA above the fold, local versus long-distance split clearly, what is included per service, a plain move-day sequence, coverage or route area, and insurance and licensing stated near the CTA.',
    contentDirection: 'Emphasize how the estimate is produced and whether it is binding, what insurance covers, crew size and timing, whether packing materials are included, storage between dates, and how stairs, lifts and long carries are handled.',
    avoid: 'Avoid red-and-yellow rental-truck styling, stock couples with a cardboard box, vague "stress-free" promises with no pricing detail, and hiding how the estimate is calculated.',
  },
  pestcontrol: {
    paletteDirection: 'Deep navy, charcoal or olive against a light neutral base, with one signal accent on CTAs. Calm authority, never alarm.',
    imageryDirection: 'Use the uniformed technician at a property, treatment equipment handled properly, sealed entry points, and clean protected homes. NEVER macro insect photography -- it repels the visitor at the exact moment they are deciding to call.',
    layoutDirection: 'Use a fast contact or inspection CTA above the fold, pests handled listed plainly, the treatment plan as a numbered sequence, recurring protection plans compared, licensing and safety stated, and service-area coverage.',
    contentDirection: 'Emphasize response time, whether treatments are safe around children and pets, what the inspection covers, what happens if the problem returns, licensing, and recurring protection versus one-off treatment.',
    avoid: 'Avoid close-up insect imagery, red-and-black danger styling, cartoon bug mascots, fear-based headlines, and the landscaping green palette which makes a pest firm look like a lawn service.',
  },
  cleaning: {
    paletteDirection: 'Cool, clean and organised: deep teal or slate against generous white, with one bright accent reserved for CTAs. Calm rather than clinical.',
    imageryDirection: 'Use real before/after of actual rooms, the finished space in natural light, and the crew at work in uniform. Avoid gloved hands on white backgrounds, spray bottles, and sparkle graphics.',
    layoutDirection: 'Use a before/after slider as the primary proof, a clear checklist of what is included per visit, one-off versus recurring plans side by side, service-area coverage, and a booking or quote path from every screen.',
    contentDirection: 'Emphasize exactly what is cleaned, how long it takes, whether products are supplied, whether the team is background-checked and insured, recurring versus one-off pricing, and how to book.',
    avoid: 'Avoid hospital blue-and-white, bleach-bottle green, cartoon sparkles, stock gloved hands, and vague promises of quality with no checklist of what is actually done.',
  },
  salon: {
    paletteDirection: 'Warm neutral base -- bone, plaster, clay -- with one muted accent. Restraint reads as expensive here; saturation reads as a chain.',
    imageryDirection: 'Use real finished work in close-up: hair after a cut and colour, hands, brows, skin. Show the room, the chair, the light. Never stock models with perfect studio lighting.',
    layoutDirection: 'Use an image-led hero, a clear service-and-price list, stylist or team introductions with real faces, a booking path visible from every screen, and a gallery of actual work.',
    contentDirection: 'Emphasize what a first visit is like, how long treatments take, who the stylists are, what is included, and how to book. Price transparency builds more trust here than adjectives.',
    avoid: 'Avoid lavender-and-white wellness cliches, hot pink, gold-on-black glamour, stock model headshots, and vague luxury language with no service list or prices.',
  },
  automotive: {
    paletteDirection: 'Dark and reflective: lacquer black, graphite, gunmetal and chrome, with ONE signal accent (signal red, amber or electric cyan). The page should feel like a lit detailing bay, not a forecourt.',
    imageryDirection: 'Use macro shots of paint, water beading on a finish, reflections and clear-coat depth, wheels and trim close up, before/after panels, and the car half-lit in a dark bay. Show surfaces, not showrooms.',
    layoutDirection: 'Use full-bleed dark hero with a single vehicle, before/after sliders, tiered package comparison, a visible process sequence (assess, correct, protect), and service-area coverage.',
    contentDirection: 'Emphasize the finish and what protects it, turnaround time, what is included at each tier, whether the work is mobile or in-bay, and how long the protection lasts.',
    avoid: 'Avoid dealership blue-and-silver, safety-yellow construction palettes, generic mechanic clip art, stock handshake photos, and 3-up icon-card grids with no vehicle photography.',
  },
  restaurant: {
    paletteDirection: 'Use warm hospitality colors: cream, charcoal, wine, tomato, olive, brass, espresso, or smoke. The palette should feel edible, tactile, and atmospheric.',
    imageryDirection: 'Use plated dishes, dining room atmosphere, chef/fire/steam details, wine pours, ingredient close-ups, table settings, and full-bleed food photography.',
    layoutDirection: 'Use editorial restaurant pacing: full-bleed hero, menu/reservation flow, menu highlights, reservation CTA, chef story, press/reviews, atmospheric image breaks, and no generic service-card grids.',
    contentDirection: 'Emphasize cuisine, neighborhood, reservation flow, seasonal menus, chef point of view, wine/beverage program, hours, and dining experience.',
    avoid: 'Avoid contractor trust badges, emergency banners, BBB-style claims, generic "services" language, and 3-up icon-card grids.',
  },
  construction: {
    paletteDirection: 'Use construction-grade confidence: safety yellow, equipment amber, concrete/steel neutrals, black, rust, navy, and white. Accent colors should feel industrial and durable.',
    imageryDirection: 'Use job-site photography, framing, cranes, concrete, tools, crews at work, finished remodels, blueprints, materials, and strong project photography.',
    layoutDirection: 'Use bold geometric sections, project case studies, capabilities grids with photos, process timelines, certification/safety bars, and before/after builds.',
    contentDirection: 'Emphasize licensed crews, timelines, craftsmanship, safety, project management, warranties, permits, remodel/build specialties, and local proof.',
    avoid: 'Avoid soft spa palettes, floral/nature cues unless landscaping-related, delicate serif luxury treatment, and abstract SaaS-style dashboards.',
  },
  technology: {
    paletteDirection: 'Use precise tech palettes: electric blue, indigo, cyan, graphite, cool white, or controlled green. Keep it sleek and product-led.',
    imageryDirection: 'Use product UI, dashboards, abstract data surfaces, teams collaborating, device mockups, cloud/security/data visuals, and interface screenshots when relevant.',
    layoutDirection: 'Use bento grids, feature deep-dives, product screenshots, comparison tables, integration strips, pricing, social proof logos, and tight information hierarchy.',
    contentDirection: 'Emphasize outcomes, speed, automation, security, integrations, ROI, onboarding, and clear product differentiation.',
    avoid: 'Avoid generic stock business people, unrelated nature imagery, overly playful gradients, and local-service emergency/phone-first patterns.',
  },
  healthcare: {
    paletteDirection: 'Use calming clinical trust: white, soft blue, teal, healing green, lavender, and gentle neutrals. Contrast must feel clean and accessible.',
    imageryDirection: 'Use welcoming care environments, practitioners, patient interactions, treatment rooms, wellness details, and calm human photography.',
    layoutDirection: 'Use clear appointment CTAs, provider/service sections, insurance/credential trust blocks, patient testimonials, FAQ, and accessible spacing.',
    contentDirection: 'Emphasize care quality, credentials, comfort, outcomes, appointment booking, insurance/financing, and patient reassurance.',
    avoid: 'Avoid harsh black/yellow palettes, aggressive sales copy, nightlife/restaurant mood, and vague medical claims.',
  },
  realestate: {
    paletteDirection: 'Use luxury property colors: ivory, charcoal, deep navy, warm taupe, brass, emerald, and clean white. The palette should feel high-value and calm.',
    imageryDirection: 'Use exterior/interior property photography, neighborhood scenes, agents, architectural details, kitchens, views, and lifestyle images.',
    layoutDirection: 'Use large image-led hero sections, featured listings, neighborhood guides, valuation CTA, agent story, testimonial proof, and elegant property cards.',
    contentDirection: 'Emphasize market expertise, buyer/seller outcomes, luxury service, local neighborhoods, valuation, and trust.',
    avoid: 'Avoid playful neon colors, generic SaaS illustrations, contractor emergency badges, and dense text without property imagery.',
  },
  fitness: {
    paletteDirection: 'Use energetic performance colors: black, white, red, orange, cobalt, lime, or steel. The palette should feel active and motivating.',
    imageryDirection: 'Use movement, classes, coaching, equipment, transformation, community, training floor, and high-energy photography.',
    layoutDirection: 'Use bold hero imagery, class/program cards, schedule/pricing sections, trainer profiles, transformation stats, and strong CTA bands.',
    contentDirection: 'Emphasize energy, results, coaching, accountability, community, program fit, and trial offers.',
    avoid: 'Avoid sleepy corporate layouts, delicate luxury restaurant typography, and generic "services" copy.',
  },
  ecommerce: {
    paletteDirection: 'Use product-led colors that complement the merchandise. Keep backgrounds clean so product photography sells the site.',
    imageryDirection: 'Use product photography, lifestyle shots, close-ups, collections, category imagery, packaging, and editorial commerce images.',
    layoutDirection: 'Use collection grids, featured products, editorial lookbook sections, reviews, guarantees, shipping/returns trust, and strong product detail blocks.',
    contentDirection: 'Emphasize product benefits, materials, collections, social proof, shipping, returns, and buying confidence.',
    avoid: 'Avoid service-business phone-first CTAs, unrelated stock people, and "Add to cart" unless full cart/checkout exists.',
  },
  creative: {
    paletteDirection: 'Use expressive but controlled creative palettes: black/white with one punch color, gallery neutrals, or refined editorial color. Let portfolio work drive the palette.',
    imageryDirection: 'Use portfolio work, studio process, brand boards, mockups, editorial imagery, behind-the-scenes, and case-study visuals.',
    layoutDirection: 'Use asymmetry, bento case studies, oversized typography, portfolio grids, process sections, client proof, and studio story.',
    contentDirection: 'Emphasize point of view, selected work, process, outcomes, client fit, and creative credibility.',
    avoid: 'Avoid generic corporate service grids, random icons, and stock photos that do not show creative output.',
  },
  default: {
    paletteDirection: 'Choose colors that clearly match the business category and emotional promise. Make the industry recognizable from the first viewport.',
    imageryDirection: 'Use photography and visual details that belong to the actual business type, not generic office or abstract filler imagery.',
    layoutDirection: 'Choose section patterns that match how customers evaluate this business: proof, work samples, products, services, booking, menu, listings, or portfolio as appropriate.',
    contentDirection: 'Write industry-specific copy with concrete proof, realistic services/products, local context, and conversion paths that fit the business.',
    avoid: 'Avoid one-size-fits-all SaaS, contractor, or agency layouts when the industry calls for a different pattern.',
  },
};

// ─── Industry Reference Styles ──────────────────────────────────────────────
// Real-world brands known for premium, distinctive web design in each
// vertical. The AI is instructed to model these — capture the FEEL (typography
// confidence, photographic style, layout discipline, color restraint) without
// copying. This is how human designers work too: every great vertical has a
// design canon, and channeling that canon is what separates a $50K build from
// generic AI output.

interface ReferenceStyle {
  /** Real-world brands the model should channel — chosen for design quality, not popularity. */
  references: string[];
  /** The shared design moves across these references that produce the premium feel. */
  designMoves: string[];
  /** Vertical-specific anti-patterns that make a site read as cheap or AI-generated. */
  antiPatterns: string[];
}

const REFERENCE_STYLES: Record<string, ReferenceStyle> = {
  landscaping: {
    references: [
      'Studio Mead (studiomead.com) — earthy, editorial photography',
      'Yardzen (yardzen.com) — clean modern with confident type',
      'James Doyle Design Associates — magazine-style portfolio',
    ],
    designMoves: [
      'Full-bleed nature photography as the primary visual — hero is a single beautiful image, not a gradient',
      'Generous whitespace with editorial-feeling captions ("Designed in 2024" style supporting copy)',
      'Restrained palette: deep greens, warm earth tones, ivory; one accent color used sparingly',
      'Heading-heavy layout: massive serif or sans display type (text-6xl–text-8xl) carries the page',
      'Project/portfolio cards with hover scale + subtle vignette, not stock card grids',
      'Sections often start with a single oversized number or short label ("01 — Landscape Design")',
    ],
    antiPatterns: [
      'Gradient backgrounds — landscaping needs real photography',
      'Three-up icon-text feature cards (the AI default)',
      'Dark hero with neon accent lines — feels tech, not horticultural',
    ],
  },
  moving: {
    references: [
      'Bellhop and Piece of Cake -- estimate-first, plain pricing language',
      'Independent local firms -- crew photography, licence and insurance shown',
      'Modern logistics sites -- route and coverage treated as real content',
    ],
    designMoves: [
      'Estimate or quote CTA above the fold, since these visitors are comparing on a deadline',
      'Local and long-distance presented as two clear paths, not one blurred service',
      'Move-day sequence as a numbered timeline: survey, pack, load, transit, place',
      'What is included stated as text -- materials, wrapping, disassembly, stairs, storage',
      'Crew and truck photography rather than stock lifestyle imagery',
      'Insurance, licence and coverage area stated plainly near the booking path',
    ],
    antiPatterns: [
      'Red-and-yellow rental-truck styling, which reads as a hire depot not a crew',
      'Stock couples smiling with one cardboard box in an empty white room',
      '"Stress-free" and "trusted" with no estimate detail behind them',
      'Hiding how the estimate is calculated until a phone call',
    ],
  },
  pestcontrol: {
    references: [
      'Aptive and Terminix -- plan comparison, fast contact path',
      'Independent regional firms -- technician-led photography, licence numbers shown',
      'Modern home-services sites on Squarespace -- calm, plan-first layouts',
    ],
    designMoves: [
      'Inspection or contact CTA visible above the fold, because these visitors arrive urgent',
      'Pests handled listed plainly as text, not as a grid of insect icons',
      'Treatment plan shown as a numbered sequence: inspect, treat, seal, follow up',
      'Recurring protection plans compared side by side with what each covers',
      'Licence number, insurance and pet/child safety stated as plain text near the CTA',
      'Photography of the technician and the protected home, never the pest',
    ],
    antiPatterns: [
      'Macro insect photography, which repels at the decision moment',
      'Red-and-black danger styling and fear-based headlines',
      'Cartoon bug mascots, which undercut a licensed professional service',
      'The landscaping green palette, which makes a pest firm look like a lawn service',
    ],
  },
  cleaning: {
    references: [
      'Homeaglow and Tidy -- plain pricing, obvious booking path',
      'Independent commercial janitorial firms -- checklist-led, photographic proof',
      'Local domestic services on Squarespace -- before/after led',
    ],
    designMoves: [
      'Before/after of a real room as the hero, ideally an interactive slider',
      'A literal checklist of what is included, per room or per visit',
      'Recurring and one-off plans compared side by side with real prices',
      'Trust markers stated plainly: insured, background-checked, products supplied',
      'Service-area coverage shown as a list or map rather than claimed vaguely',
      'A booking or quote CTA that follows the visitor down the page',
    ],
    antiPatterns: [
      'Stock gloved hands and spray bottles on a white background',
      'Cartoon sparkle and bubble motifs, which read as a franchise flyer',
      'Hospital blue-and-white palettes that feel clinical rather than domestic',
      'Quality claims with no checklist, no prices and no booking path',
    ],
  },
  salon: {
    references: [
      'Hershesons (hershesons.com) -- editorial, real client work',
      'Blue Tit London -- confident type, unpolished real photography',
      'Independent studios on Squarespace -- price list front and centre',
    ],
    designMoves: [
      'Image-led hero showing the room or a finished client, not a stock model',
      'Service and price list treated as a designed element, not hidden in a PDF',
      'Stylist introductions with real photographs and a line about what they do best',
      'Gallery of actual work, close-cropped, in a masonry or offset grid',
      'Booking CTA persistently reachable, including a sticky bar on mobile',
      'Generous whitespace and one warm accent; restraint reads as expensive',
    ],
    antiPatterns: [
      'Lavender-and-white gradients (the wellness-template default)',
      'Stock model headshots with studio lighting -- instantly reads as fake',
      'Luxury adjectives with no prices, no service list and no booking path',
      'Three-up icon cards for services instead of a real menu',
    ],
  },
  automotive: {
    references: [
      'Gtechniq and Gyeon — product-led, dark, macro finish photography',
      'Detailing studios on Squarespace — single-vehicle hero, tiered packages',
      'Porsche Classic — restrained type over large vehicle imagery',
    ],
    designMoves: [
      'Full-bleed dark hero with one vehicle lit from the side — no gradient backgrounds',
      'Macro detail shots as section breaks: beading, clear-coat depth, wheel faces',
      'Before/after treated as the primary proof, ideally an interactive slider',
      'Tiered packages as a comparison, with what is included stated plainly rather than iconified',
      'A visible process sequence — assess, correct, protect — numbered and spare',
      'One signal accent used only on CTAs, so the eye always knows where to go',
    ],
    antiPatterns: [
      'Dealership blue-and-silver corporate palettes',
      'Safety-yellow and black, which reads as construction rather than finish work',
      'Three-up icon-text cards with no vehicle photography (the AI default)',
      'Stock imagery of mechanics under bonnets when the business does appearance work',
    ],
  },
  restaurant: {
    references: [
      'Eleven Madison Park (elevenmadisonpark.com) — minimalist editorial',
      'Mission Chinese — playful but disciplined typography',
      'Blue Hill at Stone Barns — large-format food photography',
      'Local boutique restaurants on Squarespace (Brine, Estela, Misi)',
    ],
    designMoves: [
      'Hero is one full-bleed plated-food or interior photograph, no overlays except a small wordmark',
      'Serif display headlines (Playfair, Cormorant) paired with one clean sans body',
      'Menu sections rendered as elegant typography lists, not card grids — like a printed menu',
      'Reservations CTA is small, confident, never neon',
      'Story/about section uses a pull-quote layout with a single chef portrait',
    ],
    antiPatterns: [
      'Card grids of "menu items" with prices and Add-to-cart buttons (looks ecommerce, not restaurant)',
      'Dark gradient hero (kills appetite — food sites need light, airy, photographic)',
      'Stock chef icon illustrations',
    ],
  },
  technology: {
    references: [
      'Linear (linear.app) — geometric clarity, bento-grid feature explainers',
      'Vercel (vercel.com) — confident type, dark hero, gradient mesh used once',
      'Stripe (stripe.com) — gradient hero done right + crisp data visuals',
      'Arc Browser — playful but premium',
    ],
    designMoves: [
      'Bento-grid feature section with screenshots/diagrams in each cell, not just icons',
      'Code or product UI screenshots embedded in hero or features — credibility through visuals',
      'One signature gradient mesh OR aurora effect, used once (hero), never repeated per section',
      'Geometric sans (Inter, Geist, Söhne-style) at very large sizes — type does the talking',
      'Customer logo bar uses real recognizable logos in monochrome, properly aligned',
    ],
    antiPatterns: [
      'Multiple rainbow gradients on every section',
      'Floating 3D blob shapes',
      'Generic "Why Choose Us" three-icon section',
    ],
  },
  healthcare: {
    references: [
      'One Medical (onemedical.com) — calm, photographic, human',
      'Hims & Hers — clean editorial with confident product photography',
      'Modern dental practices on Squarespace (Tend, Dntl Bar)',
    ],
    designMoves: [
      'Real human photography (not stock smiles) — diverse, candid, well-lit',
      'Soft pastel or warm-neutral palette — sage, cream, warm white, one calm accent',
      'Hero is photograph + short reassuring headline, no medical jargon',
      'Service sections use icon + photo combinations, not just icons',
      'Trust signals (insurance logos, certifications) shown as a quiet logo bar, not a hero element',
    ],
    antiPatterns: [
      'Bright red/blue Bootstrap-era medical theme',
      'Stock photos of doctors holding stethoscopes pointing at the camera',
      'Cluttered insurance/intake form on the homepage',
    ],
  },
  realestate: {
    references: [
      'Compass (compass.com) — full-bleed property photography, serif type',
      'The Agency (theagencyre.com) — black/white editorial luxury',
      'Curbed/Architectural Digest property features',
      'Boutique brokerage sites (Modlin Group, Nest Seekers premium pages)',
    ],
    designMoves: [
      'Property listings displayed as large editorial cards with full-bleed photography, not table rows',
      'Serif display headlines paired with all-caps eyebrow labels',
      'Generous whitespace; black and ivory dominate; one warm accent (gold, oxblood)',
      'Agent profile sections use single portrait + pull quote, not bio paragraphs',
      'Neighborhood guides use map + photo grid combinations',
    ],
    antiPatterns: [
      'Three-column property grids with prices and Add-to-favorites hearts (looks Zillow, not luxury)',
      'Generic stock home photography (use lifestyle/architectural photography style instead)',
    ],
  },
  fitness: {
    references: [
      'Equinox (equinox.com) — black-and-white editorial, athletic typography',
      'Tracksmith (tracksmith.com) — heritage-meets-modern',
      'Barry\'s Bootcamp — bold red accent on dark editorial',
      'Boutique studios on Squarespace (Y7, SLT)',
    ],
    designMoves: [
      'Black and white photography of real movement, large-scale',
      'Heavy display sans (Druk, Akzidenz) for headlines, sometimes oversized to crop edges',
      'One bold accent color (red, electric blue) used sparingly on CTAs',
      'Class schedule rendered as a clean grid, like a printed timetable',
      'Trainer profiles use single portrait + short bio, magazine style',
    ],
    antiPatterns: [
      'Neon gradient hero with "Get Fit Now!" — reads as cheap',
      'Stock photos of generic gym equipment',
      'Excessive glowing borders or pulsing CTA buttons',
    ],
  },
  education: {
    references: [
      'Brilliant (brilliant.org) — playful but rigorous',
      'MasterClass (masterclass.com) — cinematic photography of instructors',
      'On Deck (beondeck.com) — clean editorial layout',
      'Y Combinator startup school',
    ],
    designMoves: [
      'Instructor or student photography as the primary visual',
      'Hero often features a single confident headline + short paragraph + one CTA',
      'Curriculum displayed as numbered chapter lists, not card grids',
      'Soft confident palette — navy, cream, one signal accent',
    ],
    antiPatterns: [
      'Stock photos of laptops with code on screen',
      'Generic "graduation cap" iconography',
    ],
  },
  ecommerce: {
    references: [
      'Aesop (aesop.com) — restraint, single-product hero, editorial type',
      'Glossier (glossier.com) — clean photography, signature pink used once',
      'Hims (hims.com) — confident product photography on solid backgrounds',
      'Allbirds, Outdoor Voices, Norse Store',
    ],
    designMoves: [
      'Product hero is a single oversized product photograph on solid or subtle gradient background',
      'Editorial copy treatments — short, confident, no exclamation marks',
      'Product grid uses generous whitespace, large product photos, minimal labels',
      'Featured product sections use full-bleed lifestyle photography + small product callouts',
      'Brand-color accent used once (the buy button), not everywhere',
    ],
    antiPatterns: [
      'Carousel of stock product images',
      'Star-rating burst graphics on every product',
      'Yellow "SALE!" badges with neon glow',
    ],
  },
  legal: {
    references: [
      'Sullivan & Cromwell-style classic firm sites',
      'Modern boutique firms (Wilkinson Walsh, Susman Godfrey)',
      'Loeb & Loeb',
    ],
    designMoves: [
      'Quiet authority — black/navy/ivory palette, minimal accent',
      'Serif display type for headlines, sans for body',
      'Practice areas as a numbered editorial list, not card grid',
      'Attorney profiles as single portrait + name + concise bio',
      'No imagery of gavels or scales — use architectural or office photography instead',
    ],
    antiPatterns: [
      'Royal blue gradient hero with stock photo of a handshake',
      'Generic "Law" iconography (gavels, scales of justice, columns)',
      'Card grids of "Why Choose Us" reasons',
    ],
  },
  creative: {
    references: [
      'Pentagram (pentagram.com) — case-study-driven editorial layout',
      'Studio Dumbar (studiodumbar.com) — bold typographic personality',
      'Awwwards SOTM winners',
      'Read Receipts portfolio sites (Lotta Nieminen, Aaron Lowell Denton)',
    ],
    designMoves: [
      'Asymmetric editorial layouts — projects shown as full-width hero + offset captions',
      'Massive display type, often custom or bespoke font',
      'Bold one-color hero (single saturated color or black) with confident type',
      'Project case studies use scroll-driven storytelling — image, then context, then image',
      'Microinteractions: cursor follow, hover image previews, smooth scroll reveals (via the fail-open useReveal hook only)',
    ],
    antiPatterns: [
      'Standard portfolio card grid of square thumbnails',
      'Multiple decorative gradients',
      'Generic "Selected Work" section title — use the brand voice',
    ],
  },
  construction: {
    references: [
      'Turner Construction (turnerconstruction.com) — large-scale project photography',
      'Skanska (skanska.com) — confident corporate editorial',
      'Boutique design-build firms (Bone Structure, Plant Prefab)',
    ],
    designMoves: [
      'Hero is a single dramatic project photograph — finished work, not workers in hardhats',
      'Project portfolio shown as full-bleed hero images with year + location captions',
      'Strong typography: industrial sans (Druk, Founders Grotesk) at large sizes',
      'Restrained palette: charcoal, concrete, one warm accent (steel blue, terracotta)',
      'Process explainer uses numbered editorial layout, not icon-card grid',
    ],
    antiPatterns: [
      'Cartoonish illustrations of houses or wrenches',
      'Three-up icon section with hammers, paint rollers, blueprints',
    ],
  },
  finance: {
    references: [
      'Wealthfront (wealthfront.com) — editorial, photographic, calm',
      'Ramp (ramp.com) — clean type, geometric data visuals',
      'Mercury (mercury.com) — premium SaaS feel for finance',
    ],
    designMoves: [
      'Calm photographic hero — daylight interior, quiet portrait — not stock graphs',
      'Confident geometric sans, large sizes, generous line height',
      'Data shown as elegant minimalist charts inline with copy — not screenshots',
      'Restrained palette — navy, ivory, one signal accent',
      'Compliance/credentials shown as a quiet footer logo bar',
    ],
    antiPatterns: [
      'Stock photos of stacks of coins or hands shaking over a desk',
      'Bull/bear iconography',
      'Bright green growth-arrow accents on every section',
    ],
  },
};

const DEFAULT_REFERENCE_STYLE: ReferenceStyle = {
  references: [
    'Awwwards Site of the Month winners in adjacent industries',
    'High-end Squarespace and Webflow showcase templates',
    'Boutique studio portfolio sites',
  ],
  designMoves: [
    'Full-bleed photography or single confident illustration as the hero',
    'Generous whitespace with editorial-feeling supporting copy',
    'Display sans or serif at very large sizes carrying the page',
    'One accent color used sparingly on CTAs',
    'Subtle, slow microinteractions — not bouncing animations',
  ],
  antiPatterns: [
    'Three-up icon-text feature card grid',
    'Centered hero with two side-by-side CTA buttons',
    'Multiple rainbow gradient sections',
  ],
};

// Catch-all for industries not explicitly listed
const DEFAULT_PROFILE: IndustryProfile = {
  paletteGroup: 'cool',
  fontVibes: ['minimal', 'contemporary', 'corporate'],
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
  restaurant: ['restaurant', 'food', 'dining', 'cafe', 'coffee', 'espresso', 'bakery', 'catering', 'pizza', 'sushi', 'grill', 'bistro', 'kitchen', 'deli', 'diner', 'brewery', 'taproom'],
  technology: ['tech', 'software', 'saas', 'app', 'digital', 'cloud', 'cyber', 'platform', 'startup'],
  healthcare: ['health', 'medical', 'dental', 'clinic', 'wellness', 'therapy', 'doctor', 'nursing', 'hospital', 'pharma', 'chiropractic'],
  realestate: ['real estate', 'realty', 'realtor', 'housing', 'mortgage', 'apartment', 'condo', 'listing', 'brokerage'],
  fitness: ['fitness', 'gym', 'yoga', 'workout', 'personal train', 'crossfit', 'martial art', 'pilates'],
  education: ['education', 'school', 'tutoring', 'learning', 'academy', 'course', 'university', 'teaching'],
  // 'shop' alone is dropped: barber shop, body shop, tire shop, coffee shop
  // and print shop are not online stores, and it was claiming all of them.
  // 'store', 'retail' and the rest carry the vertical without it.
  ecommerce: ['online shop', 'store', 'retail', 'ecommerce', 'e-commerce', 'marketplace', 'boutique', 'fashion', 'clothing', 'dispensary'],
  legal: ['law', 'legal', 'attorney', 'lawyer', 'litigation', 'counsel'],
  creative: ['design', 'creative', 'photography', 'studio', 'agency', 'branding', 'portfolio', 'media', 'video', 'film', 'florist', 'floral', 'flower'],
  construction: ['construction', 'building', 'contractor', 'roofing', 'roofer', 'plumbing', 'electric', 'hvac', 'renovation', 'remodel', 'handyman', 'painting', 'flooring', 'cabling', 'wiring', 'siding', 'gutter', 'masonry', 'concrete', 'paving', 'fencing'],
  // Multi-word entries earn their length: "Tire Shop" tied with ecommerce's
  // 'shop' on both score and specificity, and lost to whichever vertical was
  // declared first. "tire shop" outranks "shop" on its own merits.
  moving: ['moving company', 'movers', 'mover', 'moving', 'relocation', 'removals', 'long distance moving', 'packing service', 'self storage', 'storage unit', 'van line', 'junk removal'],
  pestcontrol: ['pest control', 'pest', 'exterminator', 'extermination', 'termite', 'rodent', 'bed bug', 'mosquito', 'wildlife removal', 'fumigation', 'insect', 'infestation'],
  cleaning: ['cleaning', 'cleaner', 'janitorial', 'maid', 'housekeeping', 'pressure wash', 'power wash', 'window cleaning', 'carpet cleaning', 'deep clean', 'move-out clean', 'disinfect', 'sanitiz', 'sanitis'],
  salon: ['salon', 'barber', 'barbershop', 'hair', 'hairdress', 'stylist', 'beauty', 'nails', 'nail salon', 'lash', 'brow', 'waxing', 'grooming', 'blowout', 'esthetician', 'day spa', 'med spa', 'spa'],
  automotive: ['auto', 'automotive', 'detailing', 'car wash', 'collision', 'body shop', 'tire shop', 'auto shop', 'repair shop', 'mechanic', 'tire', 'windshield', 'ceramic coating', 'paint correction', 'dealership', 'vehicle'],
  finance: ['finance', 'accounting', 'bank', 'investment', 'insurance', 'tax', 'wealth', 'financial'],
};

// Removed deliberately, each having graded real businesses into the wrong
// vertical: 'ai' matched inside "repair"; 'home' and 'property' made every
// home-service business look like an estate agent; 'art' hid inside "start";
// 'bar' inside "barn"; 'data' and 'sport' and 'firm' and 'consulting' and
// 'training' were generic enough to pull unrelated trades. Keep keywords
// specific enough that a whole-word match is genuine evidence.


export function matchIndustryFromInputs(industry: string, description: string): string {
  return matchIndustry(industry, description);
}

/**
 * Per-industry palette character descriptions — concrete color language the
 * design system generator can lock onto. Without this, the model tends to
 * default to generic dark navy + neutral palettes regardless of industry,
 * producing a "competent template" feel instead of a vertical-specific one.
 */
const INDUSTRY_PALETTE_CHARACTER: Record<string, string> = {
  landscaping:
    'Deep verdant greens (forest, sage, moss), warm earth tones (terracotta, ivory, weathered stone), and ONE warm accent (amber, ochre, or burnt sienna). The palette must immediately read as a horticultural studio — NOT a tech startup or a corporate firm. NEVER produce a navy-and-gold or blue-dominant palette for a landscaping business.',
  restaurant:
    'Warm appetizing tones — burnt orange, deep cream, charcoal — paired with a single signal accent (oxblood, mustard, or olive). NEVER cold blue or grayscale palettes (kills appetite). Inspired by editorial food photography.',
  technology:
    'Confident contemporary palette: deep ink/charcoal as primary, off-white or warm bone as background, ONE saturated signal color (electric indigo, viridian, or coral) used sparingly on CTAs. Avoid stock SaaS blue.',
  moving:
    'Steady and practical: deep ink, navy or forest as primary, warm paper neutrals as the base, ONE warm accent (kraft orange, amber, or ochre) drawn from tape and cardboard. It should feel like a crew that shows up on time, not a discount broker. Avoid the red-and-yellow rental-truck look and avoid stock-corporate blue-and-grey.',
  pestcontrol:
    'Calm authority rather than alarm: deep navy, charcoal or dark olive as primary, generous light neutral as the base, ONE signal accent (leaf green, amber, or clear blue) on CTAs. It must read as a licensed professional protecting a home, not a horror poster. Avoid the landscaping green palette, and avoid red-and-black danger styling.',
  cleaning:
    'Crisp and reassuring: deep teal, slate or ink as primary, generous cool white and soft grey as the base, ONE bright accent (amber, citrus, or lime) on CTAs. It should read as dependable and organised. Avoid hospital blue-and-white, bleach-bottle green, and cartoon sparkle motifs.',
  salon:
    'Warm tactile neutrals: bone, plaster, clay and soft taupe as the base, with ONE muted metallic or warm accent (brass, terracotta, dusty rose) used sparingly. It should feel like a considered room, not a spa brochure. Avoid lavender-and-white wellness cliches, hot pink, and gold-on-black glamour.',
  automotive:
    'Deep lacquer black or graphite as primary, chrome and cool grey as neutrals, ONE signal accent (signal red, amber, or electric cyan) used on CTAs and nowhere else. The palette should read like a detailing bay under lights: dark, reflective, precise. Avoid dealership blue-and-silver and avoid safety-yellow construction palettes.',
  healthcare:
    'Calm restorative palette: soft sage or warm cream backgrounds, deep navy or forest as primary text/dark sections, ONE warm accent (terracotta, dusty rose, or warm gold). Avoid bright clinical blue and red.',
  realestate:
    'Editorial luxury palette: ivory and warm white backgrounds, deep black or oxblood for headlines, brushed gold or champagne accent. Avoid Zillow-blue and corporate slate.',
  fitness:
    'High-contrast editorial: black and bone as base, ONE bold accent (signal red, electric chartreuse, or oxidized copper). Avoid neon gradients and pastel pinks.',
  education:
    'Warm scholarly palette: deep navy or aubergine paired with cream, ONE warm accent (mustard, rust, or sage). Avoid stock-corporate blue-and-orange.',
  ecommerce:
    'Quiet sophisticated palette that lets product photography carry the page: warm white background, near-black text, ONE brand-color accent. Avoid SALE-yellow and bright red.',
  legal:
    'Quiet authority palette: ivory and rich black, ONE deep accent (oxblood, forest, or navy). Restrained, never bright. Avoid royal blue and gold-everywhere stereotypes.',
  creative:
    'Bold expressive palette — pick ONE saturated hero color (cobalt, magenta, viridian, vermilion) against bone/black. Color should feel curated, not random.',
  construction:
    'Industrial editorial: charcoal, concrete, weathered steel, ONE warm accent (oxidized copper, safety-cone orange used sparingly, or terracotta). Avoid red-white-blue patriotism.',
  finance:
    'Calm intelligent palette: warm cream or bone background, deep navy or charcoal text, ONE quiet signal accent (forest green, mustard, or burgundy). Avoid generic Wall Street green-and-blue.',
  default:
    'A restrained, considered palette with one dominant primary, one supporting neutral, and one accent used sparingly. Aim for editorial coherence over decorative variety.',
};

/**
 * Returns concrete palette guidance for the design system generator,
 * derived from the matched industry. The generator uses this to bias toward
 * the right vertical character even when the user provided weak/default
 * branding inputs.
 */
export function getIndustryPaletteGuidance(industry: string, description: string): {
  matchedIndustry: string;
  paletteGroup: string;
  paletteCharacter: string;
  examplePalette: ColorPalette;
} {
  const matched = matchIndustry(industry, description);
  const profile = INDUSTRY_PROFILES[matched] || DEFAULT_PROFILE;
  const group = PALETTES[profile.paletteGroup] || PALETTES.cool;
  const examplePalette = group[0];
  const paletteCharacter = INDUSTRY_PALETTE_CHARACTER[matched] || INDUSTRY_PALETTE_CHARACTER.default;
  return {
    matchedIndustry: matched,
    paletteGroup: profile.paletteGroup,
    paletteCharacter,
    examplePalette,
  };
}

function matchIndustry(industry: string, description: string): string {
  // Substring matching graded a roofing company as "technology" because "ai"
  // appears inside "repair". "property" in "off your property" scored real
  // estate, "home" scores it for any home-service business, and "art" hides
  // inside "start". All three tied at one point and the winner was decided by
  // whichever key happened to be declared first.
  //
  // So: whole words only, the declared industry counts for more than prose,
  // and longer keywords count for more than short ones because they are the
  // specific ones. Ties resolve by the more specific match rather than by
  // object order.
  const industryText = industry.toLowerCase();
  const descriptionText = description.toLowerCase();

  // Both ends anchored, with only ordinary inflections allowed to follow.
  // A leading boundary alone still matched "deli" inside "delivery" and would
  // match "app" inside "appointment", which graded an auto detailer as a
  // restaurant and would grade any business taking appointments as a tech
  // company. The optional suffixes keep intentional stems working, so
  // "landscap" still reaches landscaping, landscape and landscapers.
  const hits = (haystack: string, keyword: string): boolean =>
    new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:e|s|es|ing|ed|er|ers)?\\b`,
      'i'
    ).test(haystack);

  let bestMatch = 'default';
  let bestScore = 0;
  let bestSpecificity = 0;

  for (const [key, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    let score = 0;
    let specificity = 0;

    for (const kw of keywords) {
      // The industry field is what the business said it does. Prose is
      // corroboration, not the claim itself.
      if (hits(industryText, kw)) {
        score += 3;
        specificity = Math.max(specificity, kw.length);
      } else if (hits(descriptionText, kw)) {
        score += 1;
        specificity = Math.max(specificity, kw.length);
      }
    }

    if (score > bestScore || (score === bestScore && score > 0 && specificity > bestSpecificity)) {
      bestScore = score;
      bestSpecificity = specificity;
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
  referenceStyle: ReferenceStyle;
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

  // Hash based on business name + industry + description for consistency.
  // Each dimension gets its own independent hash (salted) so the six picks
  // are decorrelated instead of all shifting together off a single hash.
  const base = `${businessName.toLowerCase()}-${industry.toLowerCase()}-${description.toLowerCase().slice(0, 80)}`;
  const dim = (salt: string): number => simpleHash(`${base}::${salt}`);

  // Pick palette from the industry's palette group
  const paletteGroup = PALETTES[profile.paletteGroup] || PALETTES.cool;
  const palette = pickFromArray(paletteGroup, dim('palette'));

  // Pick fonts from the industry's preferred vibes
  const matchingFonts = FONT_PAIRINGS.filter((f) => profile.fontVibes.includes(f.vibe));
  const fonts = matchingFonts.length > 0
    ? pickFromArray(matchingFonts, dim('fonts'))
    : pickFromArray(FONT_PAIRINGS, dim('fonts'));

  // Pick hero variant from industry preferences
  const matchingHeroes = HERO_VARIANTS.filter((h) => profile.heroStyles.includes(h.id));
  const heroVariant = matchingHeroes.length > 0
    ? pickFromArray(matchingHeroes, dim('hero'))
    : pickFromArray(HERO_VARIANTS, dim('hero'));

  // Pick section layout pattern
  const matchingLayouts = SECTION_LAYOUT_PATTERNS.filter((l) => profile.sectionLayouts.includes(l.id));
  const sectionLayout = matchingLayouts.length > 0
    ? pickFromArray(matchingLayouts, dim('layout'))
    : pickFromArray(SECTION_LAYOUT_PATTERNS, dim('layout'));

  // Pick testimonial pattern
  const matchingTestimonials = TESTIMONIAL_PATTERNS.filter((t) => profile.testimonialStyles.includes(t.id));
  const testimonialLayout = matchingTestimonials.length > 0
    ? pickFromArray(matchingTestimonials, dim('testimonial'))
    : pickFromArray(TESTIMONIAL_PATTERNS, dim('testimonial'));

  // Pick navbar variant
  const matchingNavbars = NAVBAR_VARIANTS.filter((n) => profile.navbarStyles.includes(n.id));
  const navbarVariant = matchingNavbars.length > 0
    ? pickFromArray(matchingNavbars, dim('navbar'))
    : pickFromArray(NAVBAR_VARIANTS, dim('navbar'));

  const referenceStyle = REFERENCE_STYLES[matchedIndustry] || DEFAULT_REFERENCE_STYLE;

  return {
    palette,
    fonts,
    heroVariant,
    sectionLayout,
    testimonialLayout,
    navbarVariant,
    industryProfile: profile,
    matchedIndustry,
    referenceStyle,
  };
}

/**
 * Generates a design variety instruction block that gets injected into
 * the AI component generation prompt. This tells Claude exactly what
 * visual approach to use for THIS specific website.
 */
/**
 * Structural recipes per interior page role. Each page of a site gets its
 * own composition so no page clones another — while the coherence contract
 * (emitted below) keeps tokens identical so the site never reads as
 * Frankenstein. Every recipe stays inside existing law: fail-open reveals,
 * verified-gallery images, contrast rules, no icon-card grids.
 */
interface PageRecipe {
  id: string;
  instruction: string;
}

const PAGE_LAYOUT_RECIPES: Record<string, PageRecipe[]> = {
  services: [
    { id: 'numbered-editorial-rows', instruction: 'Numbered editorial rows (01/02/03) with full-bleed photography alternating sides; oversized serif numerals as texture; one tinted band per practice area.' },
    { id: 'sticky-chapters', instruction: 'Use the STICKY STACKED CHAPTERS template — one full-viewport sticky panel per service, photo backdrop with dark scrim, panels sliding over each other on scroll.' },
    { id: 'banded-chapters', instruction: 'Full-width horizontal bands, one per service: each band carries its own tinted background, a 7/5 split of photography and copy, and a wave divider into the next band.' },
    { id: 'side-rail-index', instruction: 'Two-column: a slim left rail with a sticky index of service names (active item in accent color), right column of tall scrolling detail panels with photography and pricing chips.' },
  ],
  about: [
    { id: 'story-timeline', instruction: 'Vertical story timeline with year markers on a center line, alternating entries, small photos clipped in rounded-full/arch masks; ends in an oversized founding-belief pull quote.' },
    { id: 'split-manifesto', instruction: 'Asymmetric manifesto: a sticky left column with one oversized serif statement, right column scrolling through values/team/credentials with portrait photography and glass chips.' },
    { id: 'photo-chapters', instruction: 'Chapters separated by full-bleed parallax image interludes with single-line captions; between them, dense editorial text blocks with drop caps and stat callouts.' },
  ],
  portfolio: [
    { id: 'snap-gallery-strips', instruction: 'Use the HORIZONTAL SNAP GALLERY template as the spine: one snap strip per project category, section headings offset left, captions with project location.' },
    { id: 'case-study-rows', instruction: 'Stacked case-study rows: oversized project number, full-width photo with kenburns, then a 2-column detail grid (scope, materials, timeline) under each.' },
    { id: 'mixed-mosaic', instruction: 'Mixed-size mosaic grid (one hero cell spanning 2 cols, satellites around it) with hover captions sliding up; a full-bleed interlude photo halfway down.' },
  ],
  contact: [
    { id: 'split-photo-form', instruction: 'Split layout: form on the left, a tall verified photo on the right with floating glass chips (hours, phone, service area); marquee of neighborhoods above the footer.' },
    { id: 'card-over-backdrop', instruction: 'Full-bleed verified photo backdrop with dark scrim; the contact form floats as a centered rounded-3xl card with ring and heavy shadow; contact details as glass chips below the card.' },
    { id: 'faq-beside-form', instruction: 'Two columns: the form beside an FAQ accordion (smooth height transitions); a slim dark strip at the top with phone/email/hours in a single credential line.' },
  ],
};

export function buildVarietyInstructions(variety: DesignVariety): string {
  const dna = INDUSTRY_VISUAL_DNA[variety.matchedIndustry] || INDUSTRY_VISUAL_DNA.default;

  // Hash-pick TWO distinct signature decorative accents for this site,
  // mirroring the per-dimension salted-hash pattern used in getDesignVariety.
  // The base is derived from the site's already-picked variety dimensions so
  // the accents are deterministic per site.
  const accentBase = `${variety.palette.name.toLowerCase()}-${variety.fonts.name.toLowerCase()}-${variety.matchedIndustry}-${variety.heroVariant.id}`;
  const accentDim = (salt: string): number => simpleHash(`${accentBase}::${salt}`);
  const accentOne = pickFromArray(DECOR_ACCENTS, accentDim('accent1'));
  let accentTwo = pickFromArray(DECOR_ACCENTS, accentDim('accent2'));
  if (accentTwo.id === accentOne.id) {
    accentTwo = pickFromArray(DECOR_ACCENTS, accentDim('accent2'), 1);
  }

  // One structural recipe per interior page, salted per role so picks are
  // independent; a simple uniqueness pass guarantees no two pages share a
  // recipe id (pools are per-role so collisions are already unlikely).
  const usedRecipeIds = new Set<string>();
  const pageRecipes = Object.entries(PAGE_LAYOUT_RECIPES).map(([role, pool]) => {
    let pick = pickFromArray(pool, accentDim(`page-${role}`));
    let offset = 1;
    while (usedRecipeIds.has(pick.id) && offset < pool.length) {
      pick = pickFromArray(pool, accentDim(`page-${role}`), offset);
      offset++;
    }
    usedRecipeIds.add(pick.id);
    return { role, pick };
  });

  // Editorial verticals — for these, the system-prompt's editorial templates
  // OVERRIDE the variety system's hero/section variants. The variety system's
  // hero variants (spotlight, floating-cards, etc.) produce SaaS-template
  // patterns that are wrong for landscaping, restaurant, real estate, legal,
  // creative, etc. Tell the model to ignore the variety hero and use the
  // editorial templates from the system prompt.
  const EDITORIAL_INDUSTRIES = new Set([
    'landscaping',
    'restaurant',
    'realestate',
    'legal',
    'creative',
    'finance',
    'healthcare',
  ]);
  const isEditorial = EDITORIAL_INDUSTRIES.has(variety.matchedIndustry);

  const heroBlock = isEditorial
    ? `**HERO — USE EDITORIAL TEMPLATES (override):**
This is a ${variety.matchedIndustry} business — an EDITORIAL vertical. The
system prompt's "EDITORIAL DESIGN MANDATES" section gives you Pattern A
(full-bleed photographic hero) and Pattern B (asymmetric 12-column grid
hero). Pick ONE of those patterns and adapt it. Do NOT use the variety
system's hero variant suggestion — those variants (spotlight, floating-
cards, gradient-bold, angled-bg, etc.) produce SaaS-template patterns that
are wrong for editorial brands. The reference style guide above (Aesop,
Pentagram, Compass, Eleven Madison Park, etc.) describes what the hero
should FEEL like; the editorial Pattern A/B templates show the TSX
structure to copy.

If the brand calls for photography (most editorial verticals), use
Pattern A with a real \`<img>\` element from Unsplash for the hero
backdrop. NEVER omit the photography because it's "decorative" — for
restaurants, landscapers, real estate, fitness, the photo IS the design.`
    : `**HERO STYLE: "${variety.heroVariant.name}"**
${variety.heroVariant.description}
IMPORTANT: Follow this hero layout EXACTLY. Do NOT default to the standard gradient hero every time.`;

  const sectionLayoutBlock = isEditorial
    ? `**SERVICES / FEATURES SECTION — USE EDITORIAL NUMBERED LIST (override):**
For this editorial vertical, do NOT use the variety system's section
layout. Use the EDITORIAL NUMBERED LIST template from the system prompt:
alternating full-bleed photography per service item with oversized
serif numbers (01, 02, 03...) and pull-quote-style descriptions. NEVER
generate 3-up icon-text card grids — that's the AI-template look.`
    : `**FEATURES/SERVICES LAYOUT: "${variety.sectionLayout.name}"**
${variety.sectionLayout.description}
IMPORTANT: Use this layout pattern for the main features/services section.`;

  const criticalLayoutLines = isEditorial
    ? `- The hero MUST use the editorial Pattern A (full-bleed photographic) or Pattern B (asymmetric 12-column grid) template from the system prompt — NOT a generic gradient hero, and NOT the variety system's hero variants
- The features/services section MUST use the EDITORIAL NUMBERED LIST layout described above (oversized numbers + full-bleed photography per item) — NOT a basic 3-column card grid`
    : `- The hero MUST use the "${variety.heroVariant.name}" style described above — NOT a generic gradient hero
- The features/services section MUST use the "${variety.sectionLayout.name}" layout — NOT a basic 3-column card grid`;

  return `
=== DESIGN VARIETY — UNIQUE VISUAL IDENTITY FOR THIS SITE ===

**Color Palette: "${variety.palette.name}"** (Mood: ${variety.palette.mood})
Primary: ${variety.palette.primary} | Secondary: ${variety.palette.secondary} | Accent: ${variety.palette.accent}

**Typography Pairing: "${variety.fonts.name}"** (Vibe: ${variety.fonts.vibe})
Headings: ${variety.fonts.heading} | Body: ${variety.fonts.body}

${heroBlock}

**NAVBAR STYLE: "${variety.navbarVariant.id}"**
${variety.navbarVariant.description}
IMPORTANT: Use this specific navbar style, not the default glassmorphism.

${sectionLayoutBlock}

**TESTIMONIALS LAYOUT: "${variety.testimonialLayout.name}"**
${variety.testimonialLayout.description}
IMPORTANT: Use this testimonial layout instead of the default card grid.

**VISUAL NOTES**: ${variety.industryProfile.visualNotes}

=== SIGNATURE DECORATIVE ACCENTS — apply each at least twice across the site, tastefully ===
These two accents are this site's decorative signature. Weave EACH one into at
least two different sections (the hero counts as one). Keep them subtle and
non-interactive (pointer-events-none where applicable), and always respect the
text-contrast rules — they should read as craft, not clutter.

**Accent 1 — "${accentOne.id}":** ${accentOne.instruction}
**Accent 2 — "${accentTwo.id}":** ${accentTwo.instruction}

=== PER-PAGE LAYOUT MAP — EACH PAGE HAS ITS OWN STRUCTURE ===
The homepage structure comes from the hero + section assignments above. Every INTERIOR page uses its assigned recipe below. Do NOT reuse the homepage section structure on interior pages — a page that clones another page's layout is rejected.

${pageRecipes.map(({ role, pick }) => `**/${role} — "${pick.id}":** ${pick.instruction}`).join('\n')}

=== COHERENCE CONTRACT — WHAT MAKES IT ONE SITE, NOT FRANKENSTEIN ===
Variety lives in STRUCTURE (layout, composition, section rhythm); identity lives in TOKENS. These stay IDENTICAL on every page:
- The palette and its usage pattern (primary for headings/CTAs, accent for eyebrows/pops)
- The font pairing and heading treatment (same serif/sans roles everywhere)
- Button shape, size and hover behavior; card radius family (pick rounded-2xl OR rounded-3xl, not both)
- The SAME two signature accents above — never introduce a third decorative device
- The divider family, navbar, and footer
Never invent a new color, font, or button style on an interior page. A visitor moving between pages should feel "same brand, new room."

=== INDUSTRY VISUAL DNA — MAKE THE INDUSTRY OBVIOUS ===
Matched industry: ${variety.matchedIndustry}

**Palette direction:** ${dna.paletteDirection}
**Imagery direction:** ${dna.imageryDirection}
**Layout direction:** ${dna.layoutDirection}
**Content direction:** ${dna.contentDirection}
**Avoid:** ${dna.avoid}

CRITICAL: The visitor should know the industry within 3 seconds without reading
the business description. Use the industry's colors, imagery, page sections,
proof points, CTAs, and copy patterns. Do not rely on generic icons or generic
"professional service" sections when the business needs landscaping, restaurant,
construction, real estate, healthcare, ecommerce, fitness, technology, or creative
signals.

=== INDUSTRY REFERENCE STYLES — CHANNEL THESE WORLD-CLASS BRANDS ===
This site must feel like it could sit alongside the following real-world references in its category. Do NOT copy them, but model their FEEL — typography confidence, photographic style, layout discipline, color restraint, microinteraction subtlety.

**Reference brands to channel:**
${variety.referenceStyle.references.map((r) => `- ${r}`).join('\n')}

**Specific design moves these references share — DO ALL OF THESE:**
${variety.referenceStyle.designMoves.map((m) => `- ${m}`).join('\n')}

**Anti-patterns specific to this industry — NEVER DO ANY OF THESE:**
${variety.referenceStyle.antiPatterns.map((a) => `- ${a}`).join('\n')}

CRITICAL — READ THIS CAREFULLY:
This website must look COMPLETELY DIFFERENT from every other website you have ever generated.
${criticalLayoutLines}
- The testimonials MUST use the "${variety.testimonialLayout.name}" pattern — NOT the same cards-in-a-row
- The navbar MUST follow the "${variety.navbarVariant.id}" style — NOT default glassmorphism
- SECTION BACKGROUNDS: Mostly white/light (bg-white, bg-gray-50, bg-primary-50). Use dark (bg-gray-900) on at most 1-2 sections per page (hero and/or CTA). Do NOT make every section dark.
- This site's color mood is "${variety.palette.mood}" — let this mood INFUSE the color accents and typography
- Typography pairing is "${variety.fonts.name}" (${variety.fonts.vibe}) — use this to create the right emotional tone

DESIGN QUALITY RULES:
- Think premium WordPress theme (Divi, Avada) — NOT a dark-themed tech demo
- Use real Unsplash photography as the primary visual element — photos make sites look expensive
- Clean white/light backgrounds with strategic color accents — NOT neon gradients everywhere
- NO floating decorative elements (stars, sparkles, emoji shapes) — these look AI-generated
- NO neon glow effects on borders or buttons — use clean, solid colors
- Subtle shadows (shadow-sm, shadow-md) — NOT shadow-2xl with colored glow
- Density: every major section carries at least one decorative layer AND one motion moment; flat text-on-plain-background sections are rejected.
- This must look like a custom \$50,000–\$100,000 bespoke build from a top-10 design studio — clean, confident, world-class. Aim higher than "premium WordPress." Aim for the design language of an Awwwards Site of the Day winner.

TEXT CONTRAST — MANDATORY CHECK BEFORE EVERY COMPONENT:
- On light backgrounds (bg-white, bg-gray-50, bg-*-50, bg-*-100): headings MUST be text-gray-900 or text-primary-900, body text MUST be text-gray-700 or text-gray-600. NEVER use light text colors.
- On dark backgrounds (bg-gray-900, bg-*-900, bg-*-800): ALL text MUST be text-white or text-gray-100. NEVER use dark text colors.
- Body text should NEVER be lighter than text-gray-600 on any light background. text-gray-400 and text-gray-500 are too faint.
- If you cannot guarantee readable contrast, default to text-gray-900 on light and text-white on dark.
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
