import type { BusinessCard, CardDesign } from '@/types/business-card';

export const CARD_TEMPLATES: Array<{
  id: string;
  name: string;
  description: string;
  design: Partial<CardDesign>;
}> = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Polished and bold',
    design: {
      layout: 'editorial',
      background: 'mesh',
      primaryColor: '#10121a',
      accentColor: '#a78bfa',
      textColor: '#ffffff',
    },
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Warm and editorial',
    design: {
      layout: 'split',
      background: 'solid',
      primaryColor: '#f2eee7',
      accentColor: '#ea5b3e',
      textColor: '#211b18',
    },
  },
  {
    id: 'signal',
    name: 'Signal',
    description: 'Bright and energetic',
    design: {
      layout: 'minimal',
      background: 'gradient',
      primaryColor: '#164e63',
      accentColor: '#22d3ee',
      textColor: '#ecfeff',
    },
  },
  {
    id: 'ledger',
    name: 'Ledger',
    description: 'Classic and refined',
    design: {
      layout: 'editorial',
      background: 'solid',
      font: 'classic',
      primaryColor: '#12372a',
      accentColor: '#d7b56d',
      textColor: '#fffdf5',
    },
  },
];

export const DEFAULT_CARD_DESIGN: CardDesign = {
  template: 'midnight',
  orientation: 'landscape',
  layout: 'editorial',
  background: 'mesh',
  font: 'modern',
  primaryColor: '#10121a',
  accentColor: '#a78bfa',
  textColor: '#ffffff',
  photoUrl: null,
  logoUrl: null,
  showPhoto: true,
  showLogo: true,
  showQr: true,
  cornerRadius: 24,
};

export const EMPTY_BUSINESS_CARD: BusinessCard = {
  name: 'My business card',
  slug: '',
  status: 'draft',
  full_name: 'Your Name',
  job_title: 'Founder & Creative Director',
  company: 'Your Company',
  bio: 'I help ambitious businesses turn good ideas into memorable brands.',
  email: 'hello@yourcompany.com',
  phone: '(555) 012-8484',
  website: 'yourcompany.com',
  location: 'Atlanta, Georgia',
  booking_url: '',
  social_links: [],
  design: DEFAULT_CARD_DESIGN,
};

export function normalizeCard(card: Partial<BusinessCard>): BusinessCard {
  return {
    ...EMPTY_BUSINESS_CARD,
    ...card,
    social_links: Array.isArray(card.social_links) ? card.social_links : [],
    design: { ...DEFAULT_CARD_DESIGN, ...(card.design || {}) },
  };
}

export function cardPublicUrl(slug: string) {
  if (typeof window === 'undefined') return `/card/${slug}`;
  return `${window.location.origin}/card/${slug}`;
}

