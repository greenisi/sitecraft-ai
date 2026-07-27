/**
 * What to offer a business owner once their site exists.
 *
 * Every admin surface in this product already works -- orders, products,
 * bookings, leads, reviews, gallery, blog, properties all have dashboards. What
 * has never existed is the step that connects them: nothing looks at the
 * business, decides "a restaurant needs online ordering and a reservation
 * book", and puts that on the site. So owners get a brochure, the dashboards
 * stay empty, and the half of the product they are paying for is invisible.
 *
 * This is that step. It is deliberately NOT a generic "add a contact form"
 * upsell list: a restaurant is offered ordering and reservations, a shop is
 * offered a catalogue and checkout, a contractor is offered quote requests and
 * a job gallery. A suggestion that does not fit the trade is worse than no
 * suggestion, because it teaches the owner to ignore the panel.
 */
import type { GenerationConfig } from '@/types/project';

export interface Capability {
  id: string;
  /** Shown as the suggestion title. Plain language, owner's vocabulary. */
  label: string;
  /** One line: what the visitor can now do. */
  whatItDoes: string;
  /** Where the resulting data lands, so the owner knows it is not a dead end. */
  adminPath: string;
  adminLabel: string;
  /** True when accepting this builds new site UI rather than only enabling a page. */
  buildsUi: boolean;
  /**
   * Keyword groups scored against the business. Longer, more specific matches
   * outrank generic ones so "restaurant" beats "shop" for a pizzeria.
   */
  match: { strong: RegExp; weak?: RegExp };
  /** Site types this never suits, regardless of keywords. */
  excludeSiteTypes?: string[];
}

const CAPABILITIES: Capability[] = [
  {
    id: 'online-ordering',
    label: 'Online ordering',
    whatItDoes: 'Customers order and pay from the menu, and each order lands in your orders list to work through.',
    adminPath: 'admin/orders',
    adminLabel: 'Orders',
    buildsUi: true,
    match: {
      strong: /restaurant|takeaway|take-?out|pizzeria|cafe|café|deli|bakery|food truck|kitchen|catering|diner|bistro/i,
      weak: /food|menu|meal|coffee|dining/i,
    },
  },
  {
    id: 'table-reservations',
    label: 'Table reservations',
    whatItDoes: 'Diners book a table and pick a sitting; you confirm or decline from the bookings page.',
    adminPath: 'admin/bookings',
    adminLabel: 'Bookings',
    buildsUi: true,
    match: {
      strong: /restaurant|bistro|dining|steakhouse|brasserie|wine bar|supper/i,
      weak: /cafe|café|kitchen|tasting/i,
    },
  },
  {
    id: 'product-catalog',
    label: 'Product catalogue and checkout',
    whatItDoes: 'Shoppers browse products and check out; you fulfil and track every sale from the orders page.',
    adminPath: 'admin/products',
    adminLabel: 'Products',
    buildsUi: true,
    match: {
      strong: /e-?commerce|online store|\bshop\b|boutique|retail|apparel|clothing|jewel|merch|storefront/i,
      weak: /product|sell|collection|brand/i,
    },
  },
  {
    id: 'appointment-booking',
    label: 'Appointment booking',
    whatItDoes: 'Clients pick a date and time that is actually free; you confirm from the bookings page.',
    adminPath: 'admin/bookings',
    adminLabel: 'Bookings',
    buildsUi: true,
    match: {
      strong: /salon|spa|barber|clinic|dental|dentist|medical|therapy|therapist|chiropract|massage|wellness|aesthetic|tattoo|grooming|veterinar/i,
      weak: /appointment|consultation|treatment|session|practice/i,
    },
  },
  {
    id: 'class-booking',
    label: 'Class and session booking',
    whatItDoes: 'Members reserve a class slot; capacity and no-shows are visible on the bookings page.',
    adminPath: 'admin/bookings',
    adminLabel: 'Bookings',
    buildsUi: true,
    match: {
      strong: /\bgym\b|fitness|yoga|pilates|crossfit|personal train|martial arts|dance studio|spin studio/i,
      weak: /class|membership|reformer|bootcamp/i,
    },
  },
  {
    id: 'quote-requests',
    label: 'Quote requests',
    whatItDoes: 'Visitors describe the job and get a quote request in front of you, with photos if they have them.',
    adminPath: 'admin/leads',
    adminLabel: 'Leads',
    buildsUi: true,
    match: {
      strong: /contractor|roofing|roofer|plumb|hvac|electric|landscap|lawn|construction|remodel|renovat|paving|fencing|clean|pest|moving|junk|window|gutter|flooring|painting/i,
      weak: /service|repair|install|maintenance|estimate|quote/i,
    },
  },
  {
    id: 'property-listings',
    label: 'Property listings',
    whatItDoes: 'Buyers browse live listings and request viewings; enquiries arrive tied to the property.',
    adminPath: 'admin/properties',
    adminLabel: 'Properties',
    buildsUi: true,
    match: {
      strong: /real estate|realty|realtor|estate agent|property|lettings|brokerage/i,
      weak: /listing|home sales|rental/i,
    },
  },
  {
    id: 'review-collection',
    label: 'Review collection',
    whatItDoes: 'Finished customers get asked for a review automatically, and the good ones show on your site.',
    adminPath: 'admin/reviews',
    adminLabel: 'Reviews',
    buildsUi: true,
    match: {
      strong: /contractor|salon|clinic|restaurant|landscap|cleaning|repair|dental|spa|barber/i,
      weak: /local|service|customer/i,
    },
  },
  {
    id: 'work-gallery',
    label: 'Before-and-after gallery',
    whatItDoes: 'Your finished work is the proof; add photos from the dashboard and the site updates itself.',
    adminPath: 'admin/gallery',
    adminLabel: 'Gallery',
    buildsUi: true,
    match: {
      strong: /landscap|remodel|renovat|construction|detailing|tattoo|salon|photograph|interior design|paving|painting/i,
      weak: /project|portfolio|transformation/i,
    },
  },
  {
    id: 'consultation-requests',
    label: 'Consultation requests',
    whatItDoes: 'Prospects describe their matter and request a consultation; each one arrives in your leads list.',
    adminPath: 'admin/leads',
    adminLabel: 'Leads',
    buildsUi: true,
    match: {
      strong: /law|legal|attorney|solicitor|litigation|accountan|bookkeep|financial advis|wealth|insurance|consultan|advisory|architect|surveyor|agency|marketing firm/i,
      weak: /firm|practice|professional|client|advice/i,
    },
  },
  {
    id: 'newsletter',
    label: 'Email list signup',
    whatItDoes: 'Visitors who are not ready to buy join your list, so you can reach them later instead of losing them.',
    adminPath: 'admin/leads',
    adminLabel: 'Leads',
    buildsUi: true,
    // Suits almost anyone, so it scores low and only surfaces when the
    // trade-specific slots are already filled.
    match: { strong: /newsletter|mailing list|email list/i, weak: /shop|restaurant|studio|brand|blog|content/i },
  },
];

export interface Suggestion {
  capability: Capability;
  /** Why this business specifically -- shown to the owner. */
  reason: string;
  score: number;
}

/**
 * Ranks capabilities for one business. `alreadyPresent` are ids the site
 * already has, so accepted suggestions stop being re-offered.
 */
export function suggestCapabilities(
  config: GenerationConfig,
  alreadyPresent: string[] = [],
  limit = 3
): Suggestion[] {
  const haystack = [
    config.business?.name,
    config.business?.industry,
    config.business?.description,
    config.business?.targetAudience,
    config.aiPrompt,
  ]
    .filter(Boolean)
    .join(' ');

  const present = new Set(alreadyPresent);

  const scored = CAPABILITIES.filter((capability) => !present.has(capability.id))
    .filter((capability) => !capability.excludeSiteTypes?.includes(config.siteType))
    .map((capability) => {
      let score = 0;
      if (capability.match.strong.test(haystack)) score += 10;
      if (capability.match.weak?.test(haystack)) score += 3;
      return { capability, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  // Two suggestions pointing at the same dashboard is noise; keep the stronger.
  const seenAdmin = new Set<string>();
  const deduped = scored.filter((entry) => {
    if (seenAdmin.has(entry.capability.adminPath) && entry.score < 10) return false;
    seenAdmin.add(entry.capability.adminPath);
    return true;
  });

  const trade = (config.business?.industry || 'your business').trim();

  return deduped.slice(0, limit).map((entry) => ({
    ...entry,
    reason:
      entry.score >= 10
        ? `Most ${trade.toLowerCase()} customers expect this, and nothing on the site offers it yet.`
        : `Worth adding once the essentials are in place — it captures visitors who are not ready to commit.`,
  }));
}

export function getCapability(id: string): Capability | undefined {
  return CAPABILITIES.find((capability) => capability.id === id);
}

export const ALL_CAPABILITIES = CAPABILITIES;
