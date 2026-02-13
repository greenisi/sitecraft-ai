export const SITE_TYPES = ['landing-page', 'business', 'ecommerce', 'saas', 'local-service'] as const;
export type SiteType = (typeof SITE_TYPES)[number];

export const SITE_TYPE_LABELS: Record<SiteType, string> = {
  'landing-page': 'Landing Page',
  business: 'Business / Portfolio',
  ecommerce: 'E-Commerce',
  saas: 'SaaS',
  'local-service': 'Local Service Business',
};

export const SITE_TYPE_DESCRIPTIONS: Record<SiteType, string> = {
  'landing-page': 'Single-page sites that convert. Hero, features, testimonials, CTA.',
  business: 'Multi-page professional presence. About, services, contact, blog.',
  ecommerce: 'Product catalog with cart and checkout. Built for selling.',
  saas: 'Full-stack application with marketing site, auth, and dashboard.',
  'local-service': 'Website for plumbers, electricians, landscapers, cleaners, and other local service businesses with service areas, booking, and reviews',
};

export const PROJECT_STATUSES = ['draft', 'generating', 'generated', 'deployed', 'published', 'error'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STYLE_OPTIONS = ['minimal', 'bold', 'elegant', 'playful', 'corporate', 'dark', 'vibrant'] as const;
export type StyleOption = (typeof STYLE_OPTIONS)[number];

export const SECTION_TYPES = [
  'hero',
  'features',
  'pricing',
  'testimonials',
  'cta',
  'contact',
  'about',
  'gallery',
  'faq',
  'stats',
  'team',
  'blog-preview',
  'product-grid',
  'custom',
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero',
  features: 'Features',
  pricing: 'Pricing',
  testimonials: 'Testimonials',
  cta: 'Call to Action',
  contact: 'Contact',
  about: 'About',
  gallery: 'Gallery',
  faq: 'FAQ',
  stats: 'Stats',
  team: 'Team',
  'blog-preview': 'Blog Preview',
  'product-grid': 'Product Grid',
  custom: 'Custom Section',
};

export const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Space Grotesk', value: 'Space Grotesk' },
  { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans' },
  { label: 'Outfit', value: 'Outfit' },
  { label: 'Sora', value: 'Sora' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Manrope', value: 'Manrope' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Lora', value: 'Lora' },
] as const;

export const DEFAULT_GENERATION_CREDITS = 5;
export const MAX_SECTIONS = 12;
export const MAX_PRODUCTS = 50;

// ── Enhancement 1: Section Layout Variants ─────────────────────────────

export const SECTION_VARIANTS: Partial<Record<SectionType, { value: string; label: string }[]>> = {
  hero: [
    { value: 'centered', label: 'Centered' },
    { value: 'split-image', label: 'Split Image' },
    { value: 'video-background', label: 'Video Background' },
    { value: 'minimal-clean', label: 'Minimal' },
    { value: 'gradient-bold', label: 'Gradient Bold' },
    { value: 'dark-hero', label: 'Dark Cinematic' },
    { value: 'asymmetric', label: 'Asymmetric' },
  ],
  features: [
    { value: 'grid-3col', label: '3-Column Grid' },
    { value: 'grid-2col', label: '2-Column Grid' },
    { value: 'alternating', label: 'Alternating Rows' },
    { value: 'icon-cards', label: 'Icon Cards' },
    { value: 'bento', label: 'Bento Grid' },
  ],
  testimonials: [
    { value: 'carousel', label: 'Carousel' },
    { value: 'grid', label: 'Card Grid' },
    { value: 'single-spotlight', label: 'Single Spotlight' },
    { value: 'marquee', label: 'Marquee Scroll' },
  ],
  pricing: [
    { value: '3-tier', label: '3-Tier Standard' },
    { value: '2-tier-highlighted', label: '2-Tier Highlighted' },
    { value: 'comparison-table', label: 'Comparison Table' },
  ],
  cta: [
    { value: 'centered-simple', label: 'Centered Simple' },
    { value: 'split-with-image', label: 'Split with Image' },
    { value: 'banner-full-width', label: 'Full-Width Banner' },
  ],
  gallery: [
    { value: 'masonry', label: 'Masonry' },
    { value: 'grid', label: 'Grid' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'lightbox', label: 'Lightbox Grid' },
  ],
  team: [
    { value: 'grid-cards', label: 'Grid Cards' },
    { value: 'horizontal-scroll', label: 'Horizontal Scroll' },
    { value: 'alternating-bio', label: 'Alternating Bio' },
  ],
};

// ── Enhancement 2: Color Palette Presets ────────────────────────────────

export const COLOR_PALETTE_PRESETS = [
  { name: 'Ocean', primary: '#0f4c81', secondary: '#2c7da0', accent: '#bee3db', surface: '#f0f9ff' },
  { name: 'Sunset', primary: '#e63946', secondary: '#f4a261', accent: '#264653', surface: '#fefce8' },
  { name: 'Forest', primary: '#2d6a4f', secondary: '#74c69d', accent: '#d8f3dc', surface: '#f0fdf4' },
  { name: 'Midnight', primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560', surface: '#0f0f23' },
  { name: 'Lavender', primary: '#7c3aed', secondary: '#a78bfa', accent: '#c4b5fd', surface: '#faf5ff' },
  { name: 'Coral', primary: '#e11d48', secondary: '#fb7185', accent: '#fecdd3', surface: '#fff1f2' },
  { name: 'Slate', primary: '#334155', secondary: '#64748b', accent: '#3b82f6', surface: '#f8fafc' },
  { name: 'Amber', primary: '#d97706', secondary: '#f59e0b', accent: '#fbbf24', surface: '#fffbeb' },
  { name: 'Emerald', primary: '#059669', secondary: '#10b981', accent: '#34d399', surface: '#ecfdf5' },
  { name: 'Rose Gold', primary: '#9f1239', secondary: '#d4a574', accent: '#fdf2f8', surface: '#fef7f0' },
] as const;

// ── Enhancement 3: Section Content Items ────────────────────────────────

export const SECTION_MAX_ITEMS: Partial<Record<SectionType, number>> = {
  faq: 6,
  testimonials: 4,
  features: 6,
  team: 6,
  pricing: 3,
  stats: 6,
};

export const SECTION_ITEM_TYPE: Partial<Record<SectionType, string>> = {
  faq: 'faq',
  testimonials: 'testimonial',
  features: 'feature',
  team: 'team',
  pricing: 'pricing',
  stats: 'stat',
};

// ── Enhancement 5: Navbar & Footer ──────────────────────────────────────

export const NAVBAR_STYLES = ['transparent', 'solid', 'glassmorphism', 'dark', 'colored'] as const;
export type NavbarStyle = (typeof NAVBAR_STYLES)[number];

export const NAVBAR_STYLE_LABELS: Record<NavbarStyle, string> = {
  transparent: 'Transparent (over hero)',
  solid: 'Solid White',
  glassmorphism: 'Glassmorphism (blur)',
  dark: 'Dark',
  colored: 'Brand Colored',
};

export const NAVBAR_POSITIONS = ['fixed', 'sticky', 'static'] as const;
export type NavbarPosition = (typeof NAVBAR_POSITIONS)[number];

export const FOOTER_STYLES = ['multi-column', 'simple', 'centered', 'minimal'] as const;
export type FooterStyle = (typeof FOOTER_STYLES)[number];

export const FOOTER_STYLE_LABELS: Record<FooterStyle, string> = {
  'multi-column': '4-Column with Newsletter',
  simple: 'Simple 2-Column',
  centered: 'Centered Stack',
  minimal: 'Minimal Bar',
};

export const SOCIAL_PLATFORMS = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'github'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
