/**
 * Trade-specific generation hints for home pro / local service businesses.
 *
 * The local-service prompt is generic across all local businesses. When the
 * `business.industry` string matches a known home pro trade, we inject these
 * hints to make the generated site *actually feel* like a pressure washing /
 * HVAC / roofing / etc. site — the thing the /for/[vertical] landing pages
 * promise the customer.
 *
 * Adding a new trade: drop another entry in TRADE_HINTS. Add aliases for the
 * various ways users type the industry (e.g. "lawn", "mowing", "lawn care").
 */

export type TradeHint = {
  trade: string;                      // canonical name shown to the model
  primaryCTA: string;                 // verb-first action: "Get a Free Quote", "Call Now 24/7"
  ctaUrgency: 'standard' | 'emergency' | 'seasonal';
  mustHaveComponents: string[];       // components/sections that MUST appear
  mustHaveCopyPoints: string[];       // talking points buyers in this trade respond to
  trustSignals: string[];             // trust signals specific to this trade
  industryLanguage: string[];         // jargon the customer expects to see
  pricingPattern: string;             // how to talk about pricing
  seasonalNote?: string;              // call out if seasonal
};

export const TRADE_HINTS: Record<string, TradeHint> = {
  'pressure-washing': {
    trade: 'pressure washing',
    primaryCTA: 'Get a Free Quote',
    ctaUrgency: 'standard',
    mustHaveComponents: [
      'A photo-first BEFORE/AFTER section — IMPORT the prebuilt `BeforeAfterSlider` from `src/components/BeforeAfterSlider.tsx` (the platform injects this file at publish time — DO NOT re-implement it). Use it like: `<BeforeAfterSlider pairs={[{before:"/img/b1.jpg", after:"/img/a1.jpg", caption:"Driveway, ~2 hrs"}, ...]} />`',
      'Above-the-fold quote form (name, address, surface type, photo upload) — NOT just a "Contact" link',
      'Service-area map or ZIP list showing exact coverage area',
      'Floating click-to-call button visible on mobile at all times',
    ],
    mustHaveCopyPoints: [
      'Soft wash vs power wash — explain when each is used',
      'Surfaces covered: house siding, driveways, sidewalks, decks, fences, roofs (soft wash)',
      'Insured + bonded — homeowners ask about this constantly',
    ],
    trustSignals: ['Google Reviews block (5-star), insurance/bonding badge, before/after photo count'],
    industryLanguage: ['soft wash', 'power wash', 'surface cleaning', 'curb appeal', 'free estimate'],
    pricingPattern: 'Show ballpark per-square-foot or per-job ranges. Most customers expect "starts at $X" not exact pricing.',
    seasonalNote: 'Spring/summer is peak — homepage may mention "now booking spring cleanings".',
  },

  'lawn-care': {
    trade: 'lawn care + mowing',
    primaryCTA: 'Get a Free Quote',
    ctaUrgency: 'seasonal',
    mustHaveComponents: [
      'Quote form that asks lawn size + frequency (weekly/bi-weekly/monthly) FIRST',
      'Service-area ZIP map matching the actual mowing route',
      'Recurring service tier cards (Weekly / Bi-weekly / Monthly with price per visit)',
      'Floating click-to-call button on mobile',
    ],
    mustHaveCopyPoints: [
      'Recurring service is the upsell — frame one-off cuts as a try-before-you-commit',
      'Mention seasonal add-ons: aeration, leaf removal, mulch, fertilization, weed control',
      'Mention gate access / dogs / parking — eliminates back-and-forth before booking',
    ],
    trustSignals: ['"X yards mowed this season" counter, neighborhood-specific testimonials, before/after photos'],
    industryLanguage: ['weekly cuts', 'recurring service', 'route', 'edging', 'curb appeal'],
    pricingPattern: 'Show per-cut range based on lawn size. "Lawns under 5,000 sq ft from $35, 5-10k from $45, etc."',
    seasonalNote: 'March–November is peak in most regions. Winter copy should pivot to leaf removal / snow.',
  },

  'junk-removal': {
    trade: 'junk removal + hauling',
    primaryCTA: 'Get an Instant Estimate',
    ctaUrgency: 'standard',
    mustHaveComponents: [
      'Instant pricing calculator visualizing load size (¼ truck / ½ / ¾ / full)',
      'Photo upload as a primary CTA — "Send us photos, we send back a price"',
      'Same-day availability calendar showing today\'s open windows',
      'Floating click-to-call button on mobile',
    ],
    mustHaveCopyPoints: [
      'Same-day pickup is the differentiator — make it loud',
      'Eco angle: % of hauls donated/recycled vs landfill',
      'What you take vs don\'t take (hazardous, paint, etc.) — answers the top customer question',
    ],
    trustSignals: ['Eco/recycled percentage, "X tons donated", same-day promise badge'],
    industryLanguage: ['hauling', 'cleanout', 'pickup', 'load', 'truck size'],
    pricingPattern: 'Show truck-size pricing visually. "¼ truck $99 / ½ truck $199 / full truck $499". Final price after photos.',
  },

  'painting': {
    trade: 'residential painting',
    primaryCTA: 'Book a Free Color Consult',
    ctaUrgency: 'standard',
    mustHaveComponents: [
      'Quote form that branches: interior / exterior / cabinets / deck',
      'BEFORE/AFTER section using the prebuilt `BeforeAfterSlider` component from `src/components/BeforeAfterSlider.tsx` (platform-injected — do not re-implement)',
      'Color consult booking flow with a calendar picker',
      'Optional financing block (GreenSky / Hearth) for big exteriors',
    ],
    mustHaveCopyPoints: [
      'Color consultation is the upsell — frame it as included with quote',
      'Prep work matters: explain pressure washing, scraping, priming process',
      'Brand-name paints used (Sherwin-Williams, Benjamin Moore) — buyers care',
    ],
    trustSignals: ['Years in business, # rooms painted, brand affiliations, lead-safe certification'],
    industryLanguage: ['cut-in', 'two coats', 'low-VOC', 'finish (matte/eggshell/satin)', 'walkthrough'],
    pricingPattern: 'Per-room or per-square-foot ranges. "Interior bedrooms from $300, exterior siding from $X/sq ft."',
  },

  'hvac': {
    trade: 'HVAC + heating/cooling',
    primaryCTA: 'Schedule Service',
    ctaUrgency: 'emergency',
    mustHaveComponents: [
      'PROMINENT 24/7 emergency phone CTA at the very top — even above the logo on mobile',
      'Maintenance plan signup BLOCK on the homepage (the recurring revenue play — not buried)',
      'Repair-vs-replace decision helper with a few questions',
      'Service-area map matching dispatch radius',
      'Trust badges: licensed, insured, NATE-certified, BBB',
    ],
    mustHaveCopyPoints: [
      'Same-day service is the expectation — say it explicitly',
      'Brands serviced: Trane, Carrier, Lennox, Goodman, Rheem — buyers search by brand',
      'Maintenance plan = priority dispatch + discount on repairs',
    ],
    trustSignals: ['Licensed + insured, NATE certification, BBB rating, manufacturer dealer badges'],
    industryLanguage: ['tonnage', 'SEER rating', 'condenser', 'air handler', 'mini-split', 'tune-up'],
    pricingPattern: 'Show "diagnostic fee from $X, applied to repair if you book". Plans: "Maintenance plan $19/mo".',
    seasonalNote: 'Summer (AC) and winter (heat) are emergency seasons — homepage messaging can rotate.',
  },

  'roofing': {
    trade: 'residential roofing',
    primaryCTA: 'Book a Free Inspection',
    ctaUrgency: 'standard',
    mustHaveComponents: [
      'Free roof inspection booking with 24-hour turnaround promise',
      'Insurance claim guidance section — pre-answer the top customer fears',
      'Drone photo gallery + BEFORE/AFTER section using the prebuilt `BeforeAfterSlider` from `src/components/BeforeAfterSlider.tsx` for storm-damage repair shots (platform-injected — do not re-implement)',
      'A "storm mode" callout block that flips on after weather events',
      'Trust badges: GAF/Owens Corning preferred contractor, licensed, BBB',
    ],
    mustHaveCopyPoints: [
      'Insurance claims: yes we handle them, we work with adjusters',
      'Why hire us vs storm chasers: local, BBB, references, warranty',
      'Materials: asphalt shingle, metal, tile — what you actually install',
      'Warranty length on workmanship vs manufacturer',
    ],
    trustSignals: ['Manufacturer certifications (GAF Master Elite, Owens Corning Platinum), BBB A+, # roofs installed'],
    industryLanguage: ['shingle', 'underlayment', 'flashing', 'ridge vent', 'square (100 sq ft)', 'tear-off'],
    pricingPattern: 'Per-square ranges or total project ranges. "Asphalt re-roof starts at $X for typical home".',
    seasonalNote: 'Spring + after storms = peak demand. Storm-mode callout should be prominent.',
  },

  'plumbing': {
    trade: 'residential plumbing',
    primaryCTA: 'Call 24/7',
    ctaUrgency: 'emergency',
    mustHaveComponents: [
      'PROMINENT 24/7 phone CTA at top — biggest button on every page',
      'Service triage flow: leak → where? → severity → dispatch',
      'Separate service blocks: emergency, water heater, repipe, drain, gas line',
      'Service-area map matching dispatch radius',
      'Financing block for big jobs (repipes, sewer lines)',
    ],
    mustHaveCopyPoints: [
      'Same-day / emergency response is the table stakes — say it loud',
      'Diagnostic fee structure ("diagnostic $X, waived if you hire us")',
      'Licensed + insured + master plumber on staff',
    ],
    trustSignals: ['Master plumber license #, insurance, BBB, Google Local Services badge'],
    industryLanguage: ['rooter', 'snake', 'hydro jet', 'P-trap', 'PEX', 'tankless'],
    pricingPattern: 'Diagnostic fee + service ranges. "Clogs from $99, water heater install from $X".',
  },

  'electrical': {
    trade: 'residential electrical',
    primaryCTA: 'Schedule Service',
    ctaUrgency: 'emergency',
    mustHaveComponents: [
      'Click-to-call CTA always visible',
      'EV charger install block with Tesla / Ford / ChargePoint logos',
      'Panel upgrade quote form with photo upload of existing panel + service amperage',
      'Generator install block',
      'Built for Google Guaranteed verification (license #, insurance, address shown)',
    ],
    mustHaveCopyPoints: [
      'EV charger installs are a HUGE current revenue line — feature prominently',
      'Panel upgrades: when needed (older homes, new EV, big appliances)',
      'Permit handling — yes we pull them',
      'Whole-home generator: brands (Generac, Kohler), why backup matters',
    ],
    trustSignals: ['Master electrician license #, EV manufacturer certifications, BBB, Google Guaranteed'],
    industryLanguage: ['service panel', 'amperage', 'GFCI', 'AFCI', 'three-phase', 'transfer switch'],
    pricingPattern: 'Per-job ranges. "Outlet install from $X, panel upgrade from $X-$Y, EV charger from $X".',
  },

  'landscaping': {
    trade: 'landscaping + hardscaping',
    primaryCTA: 'Book a Design Consult',
    ctaUrgency: 'standard',
    mustHaveComponents: [
      'Branching quote form: maintenance vs design vs install — DIFFERENT questions each',
      'Design consult booking with a 30-min phone slot picker',
      'Project gallery sorted by category: patios, retaining walls, plantings, water features, lighting',
      'For hardscape/install work, include a BEFORE/AFTER section using the prebuilt `BeforeAfterSlider` from `src/components/BeforeAfterSlider.tsx` (platform-injected)',
      'Service-area map showing real coverage footprint',
    ],
    mustHaveCopyPoints: [
      'Design + install vs maintenance are separate buying journeys — say so clearly',
      'Hardscaping: patios, walls, walkways, outdoor kitchens, fire features',
      'Seasonal services: spring cleanup, mulch, leaf removal, snow removal contracts',
      'Permit handling for retaining walls / outdoor structures',
    ],
    trustSignals: ['Licensed + insured, ICPI/NCMA certification (if hardscape), Houzz/Angi badges'],
    industryLanguage: ['hardscape', 'softscape', 'paver', 'retaining wall', 'plantings', 'irrigation'],
    pricingPattern: 'Maintenance: monthly recurring. Design/install: project ranges. "Patios from $X/sq ft, retaining walls from $Y/linear ft".',
    seasonalNote: 'March–November is peak. Winter pivots to snow removal contracts.',
  },
};

// Aliases — extra strings that should map to a canonical trade.
const ALIASES: Record<string, string> = {
  'pressure wash': 'pressure-washing',
  'pressure washing': 'pressure-washing',
  'power wash': 'pressure-washing',
  'power washing': 'pressure-washing',
  'soft wash': 'pressure-washing',
  'exterior cleaning': 'pressure-washing',

  'lawn': 'lawn-care',
  'lawn care': 'lawn-care',
  'lawncare': 'lawn-care',
  'mowing': 'lawn-care',
  'lawn maintenance': 'lawn-care',

  'junk': 'junk-removal',
  'junk removal': 'junk-removal',
  'hauling': 'junk-removal',
  'cleanout': 'junk-removal',
  'dumpster': 'junk-removal',

  'painter': 'painting',
  'painters': 'painting',
  'painting': 'painting',
  'house painting': 'painting',
  'residential painting': 'painting',

  'hvac': 'hvac',
  'heating and cooling': 'hvac',
  'heating': 'hvac',
  'air conditioning': 'hvac',
  'ac repair': 'hvac',
  'furnace': 'hvac',

  'roofer': 'roofing',
  'roofing': 'roofing',
  'roof': 'roofing',
  'roof repair': 'roofing',
  'roof replacement': 'roofing',

  'plumber': 'plumbing',
  'plumbing': 'plumbing',
  'drain': 'plumbing',
  'water heater': 'plumbing',

  'electrician': 'electrical',
  'electrical': 'electrical',
  'ev charger': 'electrical',
  'panel upgrade': 'electrical',

  'landscaper': 'landscaping',
  'landscaping': 'landscaping',
  'landscape design': 'landscaping',
  'hardscape': 'landscaping',
  'hardscaping': 'landscaping',
};

/**
 * Match a freeform industry string to a known trade hint, if any.
 * Returns null when the industry isn't a home pro trade — the prompt
 * falls back to its generic local-service guidance.
 */
export function matchTradeHint(industry: string | undefined | null): TradeHint | null {
  if (!industry) return null;
  const norm = industry.toLowerCase().trim();
  // exact alias match first
  if (ALIASES[norm]) return TRADE_HINTS[ALIASES[norm]] ?? null;
  // substring fallback — "pressure washing services" still matches
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (norm.includes(alias)) return TRADE_HINTS[canonical] ?? null;
  }
  return null;
}

/**
 * Render the trade hint as a prompt block to inject into the local-service prompt.
 * Returns empty string when no match — safe to template in unconditionally.
 */
export function renderTradeHintBlock(industry: string | undefined | null): string {
  const hint = matchTradeHint(industry);
  if (!hint) return '';
  return `
=== HOME PRO TRADE HINTS — "${hint.trade}" ===
This business is in the ${hint.trade} trade. Tune the generated site for the
specific patterns home pro buyers in this trade respond to. The DESIGN VARIETY
and BLUEPRINT sections still apply, but these hints OVERRIDE generic local-
service defaults wherever they conflict.

Primary CTA verb: "${hint.primaryCTA}"  (urgency level: ${hint.ctaUrgency})${
    hint.ctaUrgency === 'emergency'
      ? '\nThis trade has emergency demand — the phone/call CTA must be the most prominent\nelement on every page, especially mobile. Sticky on scroll. After-hours messaging\nmatters.'
      : ''
  }

MUST-HAVE components/sections (in addition to anything in BLUEPRINT):
${hint.mustHaveComponents.map((c) => `  • ${c}`).join('\n')}

Talking points buyers in this trade actually respond to (use across hero, services,
about, and FAQ — don't be generic):
${hint.mustHaveCopyPoints.map((c) => `  • ${c}`).join('\n')}

Trust signals to surface prominently (in hero, footer, or a dedicated trust strip):
  • ${hint.trustSignals.join('\n  • ')}

Industry language to use naturally in copy (so the buyer feels you actually do
this work, not a generic "service business"):
${hint.industryLanguage.map((l) => `  • "${l}"`).join('\n')}

How to talk about pricing:
${hint.pricingPattern}
${hint.seasonalNote ? `\nSeasonal note: ${hint.seasonalNote}` : ''}

CRITICAL: A home pro buyer in this trade should look at the generated site and feel
"this was made for ${hint.trade} specifically" — not "this is a generic small
business website with my industry pasted in".
`;
}
