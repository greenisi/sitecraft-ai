export type CardOrientation = 'landscape' | 'portrait';
export type CardLayout = 'editorial' | 'split' | 'minimal';
export type CardBackground = 'solid' | 'gradient' | 'mesh';
export type CardFont = 'modern' | 'classic' | 'rounded';

export interface CardSocialLink {
  label: string;
  url: string;
}

export interface CardDesign {
  template: string;
  orientation: CardOrientation;
  layout: CardLayout;
  background: CardBackground;
  font: CardFont;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  photoUrl: string | null;
  logoUrl: string | null;
  showPhoto: boolean;
  showLogo: boolean;
  showQr: boolean;
  cornerRadius: number;
}

export interface BusinessCard {
  id?: string;
  user_id?: string;
  project_id?: string | null;
  name: string;
  slug: string;
  status: 'draft' | 'published';
  full_name: string;
  job_title: string;
  company: string;
  bio: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  booking_url: string;
  social_links: CardSocialLink[];
  design: CardDesign;
  view_count?: number;
  save_count?: number;
  created_at?: string;
  updated_at?: string;
}

