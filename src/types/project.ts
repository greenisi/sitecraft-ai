import type { SiteType, ProjectStatus, StyleOption, SectionType, NavbarStyle, NavbarPosition, FooterStyle, SocialPlatform } from '@/lib/utils/constants';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  site_type: SiteType;
  status: ProjectStatus;
  generation_config: GenerationConfig;
  design_system: DesignSystem | null;
  blueprint: PageBlueprint | null;
  vercel_project_id: string | null;
  vercel_deployment_url: string | null;
  vercel_project_name: string | null;
  custom_domain: string | null;
  published_url: string | null;
  published_at: string | null;
  thumbnail_url: string | null;
  last_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type DomainType = 'temporary' | 'purchased' | 'external';
export type DomainStatus = 'pending' | 'active' | 'failed' | 'expired';

export interface Domain {
  id: string;
  project_id: string;
  user_id: string;
  domain: string;
  domain_type: DomainType;
  status: DomainStatus;
  dns_configured: boolean;
  verification_token: string | null;
  namecom_order_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationConfig {
  siteType: SiteType;
  business: {
    name: string;
    tagline?: string;
    description: string;
    industry: string;
    targetAudience: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    surfaceColor?: string;
    fontHeading: string;
    fontBody: string;
    logoUrl?: string;
    style: StyleOption;
  };
  sections: SectionConfig[];
  ecommerce?: {
    products: ProductConfig[];
    currency: string;
    cartEnabled: boolean;
    checkoutType: 'simple' | 'multi-step';
  };
  saas?: {
    features: FeatureConfig[];
    pricingTiers: PricingTier[];
    hasAuth: boolean;
    hasDashboard: boolean;
  };
  aiPrompt: string;
  referenceUrls?: string[];
  navigation?: {
    navbarStyle?: NavbarStyle;
    navbarPosition?: NavbarPosition;
    footerStyle?: FooterStyle;
    socialLinks?: { platform: SocialPlatform; url: string }[];
  };
}

export interface SectionConfig {
  id: string;
  type: SectionType;
  content?: Record<string, string>;
  items?: SectionItemConfig[];
  variant?: string;
  order: number;
}

export type SectionItemConfig =
  | FaqItemConfig
  | TestimonialItemConfig
  | FeatureItemConfig
  | TeamMemberConfig
  | PricingTierItemConfig
  | StatItemConfig;

export interface FaqItemConfig {
  _type: 'faq';
  question: string;
  answer: string;
}

export interface TestimonialItemConfig {
  _type: 'testimonial';
  name: string;
  role: string;
  quote: string;
}

export interface FeatureItemConfig {
  _type: 'feature';
  title: string;
  description: string;
}

export interface TeamMemberConfig {
  _type: 'team';
  name: string;
  role: string;
  bio?: string;
}

export interface PricingTierItemConfig {
  _type: 'pricing';
  name: string;
  price: string;
  features: string;
}

export interface StatItemConfig {
  _type: 'stat';
  number: string;
  label: string;
}

export interface ProductConfig {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category?: string;
}

export interface FeatureConfig {
  title: string;
  description: string;
  icon?: string;
}

export interface PricingTier {
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  highlighted?: boolean;
}

export interface DesignSystem {
  colors: {
    primary: Record<string, string>;
    secondary: Record<string, string>;
    accent: Record<string, string>;
    neutral: Record<string, string>;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: Record<string, { size: string; lineHeight: string; weight: string }>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

export interface PageBlueprint {
  pages: {
    path: string;
    title: string;
    sections: {
      componentName: string;
      props: Record<string, unknown>;
      order: number;
    }[];
    metadata: { title: string; description: string };
  }[];
  sharedComponents: string[];
  dataRequirements: Record<string, unknown>;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'team';
  generation_credits: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: {
    stage?: 'parsing' | 'generating' | 'complete' | 'error';
    generationVersionId?: string;
  };
  created_at: string;
}

