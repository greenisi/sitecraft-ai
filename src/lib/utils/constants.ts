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

export const PROJECT_STATUSES = ['draft', 'generating', 'generated', 'deployed', 'error'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STYLE_OPTIONS = ['minimal', 'bold', 'elegant', 'playful', 'corporate'] as const;
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
