export interface SeoMetadata {
  id: string;
  project_id: string;
  page_path: string;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_type: string;
  twitter_card: string;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
  canonical_url: string | null;
  robots: string;
  schema_markup: Record<string, unknown>;
  seo_score: number;
  seo_issues: SeoIssue[];
  created_at: string;
  updated_at: string;
}

export interface SeoIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  page_path?: string;
}

export interface SeoChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  points: number;
  maxPoints: number;
  category: 'meta_tags' | 'content_quality' | 'business_presence' | 'technical';
}

export interface SeoScore {
  score: number;
  maxScore: number;
  checklist: SeoChecklistItem[];
  categories: {
    meta_tags: { score: number; max: number };
    content_quality: { score: number; max: number };
    business_presence: { score: number; max: number };
    technical: { score: number; max: number };
  };
}

export interface MarketingAsset {
  id: string;
  project_id: string;
  asset_type: 'social_post' | 'ad_copy' | 'email_template' | 'google_business_guide';
  platform: 'instagram' | 'facebook' | 'x' | 'google_ads' | 'meta_ads' | null;
  title: string | null;
  content: string;
  metadata: MarketingAssetMetadata;
  status: 'draft' | 'approved' | 'published' | 'archived';
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingAssetMetadata {
  hashtags?: string[];
  image_suggestion?: string;
  post_type?: string;
  best_time?: string;
  headlines?: string[];
  descriptions?: string[];
  targeting?: Record<string, unknown>;
  steps?: Array<{ number: number; title: string; description: string; tip?: string }>;
  [key: string]: unknown;
}

export type MarketingAction =
  | 'generate_seo'
  | 'seo_score'
  | 'google_business_guide'
  | 'social_posts'
  | 'ad_copy';

export interface MarketingGenerateRequest {
  type: MarketingAction;
  options?: {
    platforms?: string[];
    count?: number;
    timeframe?: string;
    pages?: string[];
  };
}

export interface MarketingGenerateResponse {
  success: boolean;
  summary: string;
  assets?: MarketingAsset[];
  seoData?: SeoMetadata[];
  score?: SeoScore;
}
