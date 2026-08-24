/**
 * The page set each template preview exposes. Shared by the preview route
 * (which renders the pages) and the preview modal (which renders the tabs),
 * so the two can never drift out of sync.
 */

export type PageKey = 'home' | 'services' | 'about' | 'contact';

export interface PageLink {
  key: PageKey;
  label: string;
}

const DEFAULT_PAGES: PageLink[] = [
  { key: 'home', label: 'Home' },
  { key: 'services', label: 'Services' },
  { key: 'about', label: 'About' },
  { key: 'contact', label: 'Contact' },
];

/** Labels follow each template's own navigation vocabulary. */
export const TEMPLATE_PAGES: Record<string, PageLink[]> = {
  'obsidian-saas': [
    { key: 'home', label: 'Home' },
    { key: 'services', label: 'Product' },
    { key: 'about', label: 'About' },
    { key: 'contact', label: 'Contact' },
  ],
  'ivory-realty': [
    { key: 'home', label: 'Home' },
    { key: 'services', label: 'Listings' },
    { key: 'about', label: 'About' },
    { key: 'contact', label: 'Contact' },
  ],
  'titan-fitness': [
    { key: 'home', label: 'Home' },
    { key: 'services', label: 'Classes' },
    { key: 'about', label: 'Trainers' },
    { key: 'contact', label: 'Contact' },
  ],
  'maison-restaurant': [
    { key: 'home', label: 'Home' },
    { key: 'services', label: 'Menu' },
    { key: 'about', label: 'Story' },
    { key: 'contact', label: 'Reservations' },
  ],
  'nova-agency': [
    { key: 'home', label: 'Home' },
    { key: 'services', label: 'Work' },
    { key: 'about', label: 'About' },
    { key: 'contact', label: 'Contact' },
  ],
  'meridian-health': [
    { key: 'home', label: 'Home' },
    { key: 'services', label: 'Services' },
    { key: 'about', label: 'About' },
    { key: 'contact', label: 'Contact' },
  ],
  'luxe-ecommerce': [
    { key: 'home', label: 'Home' },
    { key: 'services', label: 'Collections' },
    { key: 'about', label: 'About' },
    { key: 'contact', label: 'Contact' },
  ],
  'axiom-law': [
    { key: 'home', label: 'Home' },
    { key: 'services', label: 'Practice Areas' },
    { key: 'about', label: 'Attorneys' },
    { key: 'contact', label: 'Contact' },
  ],
};

export function getPreviewPages(templateId: string): PageLink[] {
  return TEMPLATE_PAGES[templateId] || DEFAULT_PAGES;
}

export function previewHref(templateId: string, page: PageKey): string {
  const base = `/api/templates/preview/${templateId}`;
  return page === 'home' ? base : `${base}?page=${page}`;
}
