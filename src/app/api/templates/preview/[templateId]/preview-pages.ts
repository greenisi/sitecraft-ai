/**
 * Interior pages for template previews.
 *
 * The homepage builders in route.ts each hand-write a single scrolling page
 * with dead `href="#"` links, which made every preview look like a one-page
 * mock of a product that sells multi-page sites. This module supplies the
 * missing pages, the real hrefs, and the shared chrome, composed from one
 * generic layer rather than 24 hand-written pages.
 */
import {
  getPreviewPages,
  previewHref,
  type PageKey,
  type PageLink,
} from '@/lib/templates/preview-nav';
import {
  ctaBand,
  divider,
  eyebrow,
  faqAccordion,
  galleryMosaic,
  heading,
  icon,
  iconGrid,
  marquee,
  offsetImage,
  outlineWord,
  palette,
  processTimeline,
  quoteBand,
  statBand,
  testimonialPair,
  type Palette,
} from './preview-sections';
import { bookingSection } from './preview-interactive';
import { getVariety, type SectionKey } from './preview-variety';

export type { PageKey, PageLink };

export interface PreviewTheme {
  name: string;
  isDark: boolean;
  primary: string;
  secondary: string;
  fHead: string;
  fBody: string;
  cta: string;
}

interface ServiceItem {
  title: string;
  blurb: string;
  meta: string;
}

interface TemplateContent {
  servicesIntro: string;
  services: ServiceItem[];
  story: string[];
  stats: Array<{ value: string; label: string }>;
  people: Array<{ name: string; role: string }>;
  contact: {
    intro: string;
    address: string[];
    phone: string;
    email: string;
    hours: string[];
  };
}

/** Theme constants mirrored from each homepage builder so pages match. */
export const THEMES: Record<string, PreviewTheme> = {
  'obsidian-saas': { name: 'Obsidian', isDark: true, primary: '#7c3aed', secondary: '#0ea5e9', fHead: 'Space Grotesk', fBody: 'Inter', cta: 'Start Free Trial' },
  'ivory-realty': { name: 'Ivory Realty', isDark: false, primary: '#1c1917', secondary: '#d4af37', fHead: 'Playfair Display', fBody: 'Inter', cta: 'Schedule Tour' },
  'titan-fitness': { name: 'Titan', isDark: true, primary: '#f97316', secondary: '#f97316', fHead: 'Outfit', fBody: 'Inter', cta: 'Join Now' },
  'maison-restaurant': { name: 'Maison', isDark: true, primary: '#1c1008', secondary: '#d4af37', fHead: 'Cormorant Garamond', fBody: 'Inter', cta: 'Reserve a Table' },
  'nova-agency': { name: 'Nova', isDark: false, primary: '#7c3aed', secondary: '#ec4899', fHead: 'Clash Display', fBody: 'Inter', cta: 'Start a Project' },
  'meridian-health': { name: 'Meridian Health', isDark: false, primary: '#0d9488', secondary: '#0ea5e9', fHead: 'DM Serif Display', fBody: 'Inter', cta: 'Book Appointment' },
  'luxe-ecommerce': { name: 'Luxe', isDark: false, primary: '#18181b', secondary: '#b45309', fHead: 'Cormorant Garamond', fBody: 'Inter', cta: 'Shop Collection' },
  'axiom-law': { name: 'Axiom & Associates', isDark: false, primary: '#1e3a5f', secondary: '#b8860b', fHead: 'Libre Baskerville', fBody: 'Inter', cta: 'Free Consultation' },
};

export const DEFAULT_THEME: PreviewTheme = THEMES['obsidian-saas'];

export const CONTENT: Record<string, TemplateContent> = {
  'obsidian-saas': {
    servicesIntro: 'Four capabilities that replace the tooling sprawl your team is paying for today.',
    services: [
      { title: 'Workflow automation', blurb: 'Describe the process once in plain language. Obsidian turns it into a running workflow with retries, audit history, and rollback.', meta: 'Included on every plan' },
      { title: 'Unified data layer', blurb: 'Connect the systems you already run. Records reconcile continuously, so reporting stops depending on whoever exported the spreadsheet last.', meta: '60+ connectors' },
      { title: 'Team analytics', blurb: 'Cycle time, review latency, and deploy frequency in one view — measured from your real data rather than self-reported status.', meta: 'Pro and above' },
      { title: 'Developer API', blurb: 'Everything in the product is available over a typed API and webhooks, so Obsidian fits your stack instead of replacing it.', meta: 'REST + webhooks' },
    ],
    story: [
      'Obsidian started because the four of us kept rebuilding the same internal tooling at every company we joined — the same integrations, the same approval flows, the same dashboards nobody trusted.',
      'We shipped the first version to eleven design partners in 2023. The product has been shaped by their edge cases ever since: real migrations, real compliance reviews, real 2am incidents.',
      'We are a remote team of nineteen across seven time zones. We publish our uptime, our roadmap, and our incident reports, because software that runs your operations should not be a black box.',
    ],
    stats: [{ value: '50,000+', label: 'Developers building' }, { value: '99.98%', label: 'Rolling 12-month uptime' }, { value: '7', label: 'Time zones covered' }],
    people: [{ name: 'Ada Okonjo', role: 'Co-founder, CEO' }, { name: 'Marcus Feld', role: 'Co-founder, CTO' }, { name: 'Priya Raman', role: 'Head of Platform' }],
    contact: {
      intro: 'Talk to an engineer, not a call centre. Most questions get answered the same working day.',
      address: ['548 Market Street', 'Suite 2210', 'San Francisco, CA 94104'],
      phone: '(415) 555-0142',
      email: 'hello@obsidian.example',
      hours: ['Support: 24/7 for Pro and Enterprise', 'Sales: Mon–Fri, 8am–6pm PT'],
    },
  },
  'ivory-realty': {
    servicesIntro: 'A small, deliberately short list. We represent fewer properties so each one gets a full campaign.',
    services: [
      { title: 'The Hillcrest Residence', blurb: 'Five bedrooms on three quarters of an acre, with a restored 1912 facade and a rebuilt interior. Walkable to the village.', meta: '$4,250,000 · 5 bed · 4.5 bath' },
      { title: 'Marina Penthouse', blurb: 'The top two floors of a 1998 tower, taken back to the slab and rebuilt with full-height glazing on the water side.', meta: '$6,800,000 · 3 bed · 3.5 bath' },
      { title: 'Old Orchard Farmhouse', blurb: 'Eleven acres, a working orchard, and a barn converted to a studio. Twenty minutes from town, an hour from the airport.', meta: '$2,950,000 · 4 bed · 3 bath' },
      { title: 'Cedar Point Estate', blurb: 'Private shoreline, a deep-water dock, and a guest cottage. Held by one family since 1974 and offered for the first time.', meta: '$8,400,000 · 6 bed · 6 bath' },
    ],
    story: [
      'Ivory Realty was founded on a narrow idea: represent fewer homes, and represent them properly. We cap each agent at six active listings.',
      'That constraint is the whole business. It buys the time to commission real photography, to stage with pieces that suit the house, and to answer a buyer within the hour rather than the week.',
      'We have closed just over $1.2 billion in residential sales since 2009, and roughly two thirds of it came from clients who had worked with us before.',
    ],
    stats: [{ value: '$1.2B', label: 'Closed since 2009' }, { value: '6', label: 'Active listings per agent' }, { value: '68%', label: 'Repeat and referred clients' }],
    people: [{ name: 'Eleanor Vance', role: 'Principal Broker' }, { name: 'Daniel Reyes', role: 'Listing Specialist' }, { name: 'Sofia Marchetti', role: 'Buyer Representation' }],
    contact: {
      intro: 'Every enquiry is answered by an agent. Private viewings can usually be arranged within forty-eight hours.',
      address: ['1200 Harbour Road', 'Ivory House, Second Floor', 'Newport, RI 02840'],
      phone: '(401) 555-0188',
      email: 'private@ivoryrealty.example',
      hours: ['Mon–Fri, 9am–7pm', 'Sat–Sun, viewings by appointment'],
    },
  },
  'titan-fitness': {
    servicesIntro: 'Four formats. Every one of them coached by a human who knows your name and your numbers.',
    services: [
      { title: 'Strength Foundations', blurb: 'Barbell mechanics from the ground up — squat, hinge, press, pull. Capped at eight people so every rep gets watched.', meta: '60 min · Mon/Wed/Fri · All levels' },
      { title: 'Conditioning', blurb: 'Intervals built off your tested numbers, not a whiteboard everyone shares. Hard, finite, and scaled to where you actually are.', meta: '45 min · Tue/Thu/Sat · Intermediate' },
      { title: 'Open Gym Coaching', blurb: 'Train your own programme with a coach on the floor for form checks, loading calls, and the occasional reality check.', meta: 'Unlimited · Daily 6am–9pm' },
      { title: 'Personal Training', blurb: 'One to one, twice a week, with a written twelve-week plan and a retest at the end. Includes nutrition check-ins.', meta: '2×/week · 12-week blocks' },
    ],
    story: [
      'Titan opened in a 4,000 square foot former print works in 2016 with six members and two coaches.',
      'We do not sell year-long contracts, and we do not run a sales floor. The business works because people stay, and people stay because the coaching is real.',
      'Every coach on the floor holds a recognised certification and does eight hours of continuing education a quarter. Half of them competed; all of them still train here.',
    ],
    stats: [{ value: '1,800+', label: 'Members trained since 2016' }, { value: '8', label: 'Athletes per strength class' }, { value: '0', label: 'Long-term contracts' }],
    people: [{ name: 'Marcus Bell', role: 'Head Coach, Strength' }, { name: 'Nina Alvarez', role: 'Conditioning Lead' }, { name: 'Tobi Adeyemi', role: 'Personal Training' }],
    contact: {
      intro: 'First week is free, no card required. Walk in, or book a slot and we will have a coach ready.',
      address: ['88 Foundry Lane', 'Unit 3', 'Austin, TX 78702'],
      phone: '(512) 555-0164',
      email: 'train@titan.example',
      hours: ['Mon–Fri, 5:30am–9pm', 'Sat–Sun, 7am–4pm'],
    },
  },
  'maison-restaurant': {
    servicesIntro: 'The menu changes with what the growers send. This is the current sitting.',
    services: [
      { title: 'Oysters, cucumber, elderflower', blurb: 'Six from the cold end of the bay, dressed with a mignonette we sweeten with elderflower cordial made in June.', meta: 'First course · 24' },
      { title: 'Hand-rolled cavatelli', blurb: 'Semolina pasta rolled each morning, brown butter, aged sheep\'s milk cheese, and whatever green is best that week.', meta: 'Pasta · 32' },
      { title: 'Dry-aged duck for two', blurb: 'Aged twenty-one days, roasted on the crown over coals, carved at the table with the leg confit and a plum reduction.', meta: 'Main · 96 for two' },
      { title: 'Tasting menu', blurb: 'Seven courses drawn from the same kitchen, paced across two and a half hours. Wine pairing optional.', meta: 'Whole table · 145 per guest' },
    ],
    story: [
      'Maison began as a twelve-seat supper club in the back of a bakery. We cooked one menu a week for whoever booked, and we did that for two years.',
      'The room we are in now was a hardware store from 1934 until 2019. We kept the floor, the tin ceiling, and the front counter, which is now the bar.',
      'We buy from eleven farms inside a ninety-mile radius and change the menu when they tell us to, not when the season is supposed to turn.',
    ],
    stats: [{ value: '11', label: 'Farms we buy from' }, { value: '90', label: 'Mile sourcing radius' }, { value: '1934', label: 'The room was built' }],
    people: [{ name: 'Camille Beaufort', role: 'Chef and Owner' }, { name: 'Henri Laurent', role: 'Head Sommelier' }],
    contact: {
      intro: 'Reservations open thirty days out at 10am. A small number of counter seats are held for walk-ins each evening.',
      address: ['214 Bakery Row', 'Charleston, SC 29401'],
      phone: '(843) 555-0117',
      email: 'reservations@maison.example',
      hours: ['Tue–Thu, 5:30pm–10pm', 'Fri–Sat, 5pm–11pm', 'Closed Sunday and Monday'],
    },
  },
  'nova-agency': {
    servicesIntro: 'Four engagements from the last eighteen months, with what actually changed.',
    services: [
      { title: 'Helio — brand and product launch', blurb: 'Naming, identity, and the launch site for a climate hardware company going from pilot to first commercial orders.', meta: 'Brand · Web · 14 weeks' },
      { title: 'Fieldnote — design system', blurb: 'Rebuilt a six-year-old interface into a documented system their four product teams now ship against without us.', meta: 'Product design · 20 weeks' },
      { title: 'Corso — campaign', blurb: 'Art direction, motion, and media for a national campaign that ran across broadcast, out-of-home, and social.', meta: 'Campaign · 9 weeks' },
      { title: 'Atlas — repositioning', blurb: 'Took a nineteen-year-old industrial brand from catalogue-led to category-led, including the sales collateral that follows it.', meta: 'Strategy · Brand · 16 weeks' },
    ],
    story: [
      'Nova is fourteen people in one studio. We do not have offices in other cities and we are not trying to have them.',
      'We take on roughly eight engagements a year. That number is deliberate: it is what the studio can do without handing your project to someone you have not met.',
      'Most of our work arrives by referral from people we have already worked with, which is the only new-business strategy we have ever had.',
    ],
    stats: [{ value: '14', label: 'People, one studio' }, { value: '~8', label: 'Engagements a year' }, { value: '2011', label: 'Studio founded' }],
    people: [{ name: 'Iris Kwan', role: 'Founder, Creative Director' }, { name: 'Theo Marsh', role: 'Design Director' }, { name: 'Lena Okoro', role: 'Strategy Director' }, { name: 'Sam Petrov', role: 'Motion Lead' }],
    contact: {
      intro: 'Tell us what you are working on and what is in the way. We reply to every enquiry within two working days.',
      address: ['3 Warehouse Court', 'Studio 12', 'Brooklyn, NY 11222'],
      phone: '(718) 555-0173',
      email: 'studio@nova.example',
      hours: ['Mon–Fri, 9am–6pm ET'],
    },
  },
  'meridian-health': {
    servicesIntro: 'Primary care and the specialities most often needed alongside it, under one roof and one record.',
    services: [
      { title: 'Primary care', blurb: 'A named physician who keeps your record, coordinates specialists, and has thirty-minute appointments as standard.', meta: 'Same-week appointments' },
      { title: 'Preventive screening', blurb: 'Age-appropriate screening scheduled proactively rather than left to you to remember, with results explained in person.', meta: 'Annual programme' },
      { title: 'Chronic care management', blurb: 'Structured follow-up for diabetes, hypertension, and cardiac risk, with a nurse coordinator between appointments.', meta: 'Ongoing' },
      { title: 'Diagnostic imaging', blurb: 'On-site ultrasound and X-ray, so most imaging happens during the same visit instead of another appointment across town.', meta: 'Same-visit results' },
    ],
    story: [
      'Meridian was founded by four physicians who wanted to practise with thirty-minute appointments instead of twelve.',
      'We cap each physician\'s panel so that same-week appointments remain genuinely available, rather than a promise that degrades as the practice fills.',
      'The practice is independent and physician-owned. Care decisions are made in the room, not by a corporate utilisation policy.',
    ],
    stats: [{ value: '30 min', label: 'Standard appointment' }, { value: '4', label: 'Founding physicians' }, { value: '12,000', label: 'Patients served' }],
    people: [{ name: 'Dr. Amara Ellis', role: 'Internal Medicine' }, { name: 'Dr. Jonah Pike', role: 'Family Medicine' }, { name: 'Dr. Rosa Iglesias', role: 'Cardiology' }],
    contact: {
      intro: 'New patients are welcome. Bring your insurance card and a list of current medications to your first visit.',
      address: ['4400 Meridian Parkway', 'Suite 300', 'Portland, OR 97205'],
      phone: '(503) 555-0129',
      email: 'care@meridianhealth.example',
      hours: ['Mon–Fri, 7:30am–6pm', 'Sat, 9am–1pm (urgent only)'],
    },
  },
  'luxe-ecommerce': {
    servicesIntro: 'Four collections, produced in small runs and restocked only when the mill can supply the same cloth.',
    services: [
      { title: 'The Overcoat', blurb: 'Double-faced wool from a mill in Biella, cut long with a half-belt back. Made in runs of two hundred.', meta: 'Outerwear · from $890' },
      { title: 'Knitwear', blurb: 'Undyed Geelong lambswool in six weights, knitted in Scotland on machines older than the brand.', meta: 'Knitwear · from $245' },
      { title: 'The Trouser', blurb: 'A single pattern, refined over four seasons, offered in three cloths and finished with a hand-set waistband.', meta: 'Tailoring · from $320' },
      { title: 'Leather goods', blurb: 'Vegetable-tanned hide that darkens with use, stitched by one workshop we have used since the first season.', meta: 'Accessories · from $180' },
    ],
    story: [
      'Luxe was started to answer a narrow question: what does a wardrobe look like if nothing in it is designed to be replaced next year?',
      'We work with six mills and four workshops. Every one of them is named on the product page, because a supply chain you cannot describe is one you do not control.',
      'We produce twice a year in small runs. When a cloth is gone, the piece goes with it rather than being remade in something cheaper.',
    ],
    stats: [{ value: '6', label: 'Mills we work with' }, { value: '2', label: 'Productions a year' }, { value: '100%', label: 'Named suppliers' }],
    people: [{ name: 'Clara Bennett', role: 'Founder, Design' }, { name: 'Yusuf Demir', role: 'Production' }],
    contact: {
      intro: 'Our team answers sizing, cloth, and alteration questions directly. Returns are free within thirty days.',
      address: ['17 Wardour Mews', 'London W1F 0TQ'],
      phone: '+44 20 7946 0221',
      email: 'clientcare@luxe.example',
      hours: ['Mon–Fri, 9am–6pm GMT', 'Showroom by appointment'],
    },
  },
  'axiom-law': {
    servicesIntro: 'Four practice areas. We decline matters outside them rather than learn on your file.',
    services: [
      { title: 'Business and corporate', blurb: 'Formation, shareholder agreements, financings, and the sale of owner-managed businesses from letter of intent to closing.', meta: 'Transactional' },
      { title: 'Commercial litigation', blurb: 'Contract, partnership, and trade-secret disputes. We give a written assessment of the likely outcome before you commit to filing.', meta: 'Disputes' },
      { title: 'Real estate', blurb: 'Acquisitions, leasing, and land-use approvals for commercial owners and developers, including the entitlement process.', meta: 'Property' },
      { title: 'Estate planning', blurb: 'Wills, trusts, and succession planning for families with operating businesses or property in more than one state.', meta: 'Private client' },
    ],
    story: [
      'Axiom was formed in 2004 by three attorneys who left large firms to practise without billable-hour targets driving the advice.',
      'We staff matters leanly. The attorney you meet at the consultation is the attorney who handles the file, and there is no team of associates billing behind them.',
      'We publish our rates and give a written estimate before work begins. If a matter is better resolved without us, we will say so at the first meeting.',
    ],
    stats: [{ value: '2004', label: 'Firm founded' }, { value: '4', label: 'Practice areas, deliberately' }, { value: '0', label: 'Billable-hour targets' }],
    people: [{ name: 'Nathaniel Cho', role: 'Managing Partner' }, { name: 'Ruth Delacroix', role: 'Litigation Partner' }, { name: 'Owen Ashby', role: 'Real Estate Partner' }, { name: 'Mira Haddad', role: 'Private Client' }],
    contact: {
      intro: 'Initial consultations are free and confidential. We will tell you at that meeting whether you need a lawyer at all.',
      address: ['900 Commerce Street', 'Twelfth Floor', 'Nashville, TN 37203'],
      phone: '(615) 555-0198',
      email: 'inquiries@axiomlaw.example',
      hours: ['Mon–Fri, 8:30am–6pm', 'Evening consultations by arrangement'],
    },
  },
};

export interface TemplateExtras {
  whyUs: Array<{ title: string; blurb: string }>;
  process: Array<{ title: string; blurb: string }>;
  testimonials: Array<{ text: string; name: string; role: string }>;
  faqs: Array<{ q: string; a: string }>;
  marqueeWords: string[];
}

/**
 * Content for the richer section types. Kept separate from CONTENT so the two
 * can be extended independently without resurgery on every template entry.
 */
export const EXTRAS: Record<string, TemplateExtras> = {
  'obsidian-saas': {
    whyUs: [
      { title: 'Migrations included', blurb: 'A solutions engineer maps your existing workflows and runs the cutover with you. It is not a self-serve import you are left to debug.' },
      { title: 'Audited and portable', blurb: 'SOC 2 Type II, and a one-click export of every record and workflow definition. Leaving is as easy as arriving.' },
      { title: 'Priced per workspace', blurb: 'Not per seat. Adding the rest of the team does not change what you pay, so the tool spreads instead of being rationed.' },
    ],
    process: [
      { title: 'Map', blurb: 'We sit with the team that owns the process and write down what actually happens, including the exceptions nobody documented.' },
      { title: 'Build', blurb: 'The first workflow is live in your account within two weeks, running alongside the old process until you trust it.' },
      { title: 'Hand over', blurb: 'Your team learns to build the next ones. Most customers are self-sufficient inside a quarter.' },
    ],
    testimonials: [
      { text: 'We replaced four internal tools and a spreadsheet nobody would admit to owning. The migration took eleven days, which was nine days less than we had budgeted.', name: 'Dana Whitfield', role: 'VP Operations, Northlake' },
      { text: 'The honest part is the export. We tested leaving before we committed, got everything back as clean JSON, and signed the same week.', name: 'Ravi Menon', role: 'CTO, Bellwether' },
    ],
    faqs: [
      { q: 'How long does implementation take?', a: 'Two weeks to the first live workflow for most teams. Complex migrations with regulatory review run four to six.' },
      { q: 'What happens to our data if we leave?', a: 'You can export every record and workflow definition at any time, without contacting support. No exit fee and no retention hold.' },
      { q: 'Do you charge per seat?', a: 'No. Pricing is per workspace, so inviting the rest of your team costs nothing extra.' },
    ],
    marqueeWords: ['Automation', 'Integrations', 'Analytics', 'Audit trails', 'Webhooks', 'SSO'],
  },
  'ivory-realty': {
    whyUs: [
      { title: 'Six listings per agent', blurb: 'A hard cap, not a guideline. It is the reason your calls get answered the same hour and your photography gets commissioned properly.' },
      { title: 'Photography, not snapshots', blurb: 'Every property is shot by an architectural photographer, at the hour of day the house actually looks its best.' },
      { title: 'Private-market reach', blurb: 'A quiet list of buyers who told us what they are waiting for. Some homes sell before they are ever advertised.' },
    ],
    process: [
      { title: 'Walk the house', blurb: 'We spend two hours in the property before we say a number, because the number depends on things a portal cannot see.' },
      { title: 'Prepare and stage', blurb: 'Repairs worth doing, staging that suits the architecture, and a shoot scheduled around the light.' },
      { title: 'Bring the buyers', blurb: 'Private viewings first, open market second, and a written report after every showing.' },
    ],
    testimonials: [
      { text: 'They told us not to list until March and explained exactly why. We waited, and the house went eleven percent over what the previous agent had promised in November.', name: 'Margaret Hale', role: 'Seller, Hillcrest' },
      { text: 'I saw the property two days before it was advertised. That is the whole service, really — they knew what I had been waiting for.', name: 'Thomas Reyes', role: 'Buyer, Marina District' },
    ],
    faqs: [
      { q: 'What is your commission?', a: 'A flat rate agreed in writing before we list, including the photography, staging consultation, and print. There are no marketing invoices afterwards.' },
      { q: 'Will my own agent handle the sale?', a: 'Yes. The agent you meet is the agent who runs the campaign and attends the viewings. Nothing is handed to a junior.' },
      { q: 'How long until a decision?', a: 'We give a written valuation within three working days of walking the property, with the comparable sales it is based on.' },
    ],
    marqueeWords: ['Waterfront', 'Estates', 'Historic', 'Penthouses', 'Land', 'Private sales'],
  },
  'titan-fitness': {
    whyUs: [
      { title: 'Eight athletes a class', blurb: 'Small enough that a coach corrects your third rep, not your thirtieth. This is the whole reason people get stronger here.' },
      { title: 'Tested, not guessed', blurb: 'You test on week one and retest on week twelve. The programme is built off your numbers rather than a whiteboard everyone shares.' },
      { title: 'No contracts', blurb: 'Month to month, cancel in the app. We would rather earn the next month than trap you in the last eleven.' },
    ],
    process: [
      { title: 'Assessment', blurb: 'Forty-five minutes with a coach: movement screen, baseline lifts, and an honest conversation about what you have time for.' },
      { title: 'Twelve-week block', blurb: 'A written plan with the sessions you will actually attend, scaled to your schedule rather than an ideal one.' },
      { title: 'Retest', blurb: 'Same tests, same conditions. If the numbers did not move, the next block is on us.' },
    ],
    testimonials: [
      { text: 'I had trained for six years and never squatted properly. Took one class for someone to notice and three weeks to fix. My back stopped hurting.', name: 'Priya Nandakumar', role: 'Member since 2022' },
      { text: 'No contract is why I walked in. The coaching is why I am still here two years later.', name: 'Devon Clarke', role: 'Member since 2023' },
    ],
    faqs: [
      { q: 'I have never lifted before. Is this for me?', a: 'Strength Foundations exists for exactly that. Most people in it have never touched a barbell, and the class is capped at eight so nobody gets lost.' },
      { q: 'Is the first week really free?', a: 'Yes, and we do not take a card. Come to as many classes as you like and decide afterwards.' },
      { q: 'What if I travel for work?', a: 'Memberships pause for up to eight weeks a year at no cost. Tell the front desk or do it in the app.' },
    ],
    marqueeWords: ['Strength', 'Conditioning', 'Barbell', 'Mobility', 'Coaching', 'Retest'],
  },
  'maison-restaurant': {
    whyUs: [
      { title: 'Eleven farms', blurb: 'All inside ninety miles. The menu changes when they tell us to, which is why it changes more often than the seasons do.' },
      { title: 'One kitchen, one menu', blurb: 'No separate banquet menu, no shortcuts for large tables. Everyone in the room eats the same cooking.' },
      { title: 'A room worth sitting in', blurb: 'A 1934 hardware store with its floor, tin ceiling, and counter intact. It sounds like a room, not a restaurant.' },
    ],
    process: [
      { title: 'Book', blurb: 'Reservations open thirty days ahead at 10am. Counter seats are held back each evening for walk-ins.' },
      { title: 'Tell us', blurb: 'Allergies, anniversaries, and anything you would rather not be served. The kitchen sees it before you sit down.' },
      { title: 'Stay a while', blurb: 'Tables are yours for the evening. We do not turn them, and we will not rush your last course.' },
    ],
    testimonials: [
      { text: 'They cooked around a shellfish allergy without once making it feel like an accommodation. Four courses, none of them the obvious substitution.', name: 'Helena Novak', role: 'Guest' },
      { text: 'The duck is the reason I book a month out, and the room is the reason I stay until they turn the lights up.', name: 'Andrew Bissette', role: 'Guest' },
    ],
    faqs: [
      { q: 'Do you take walk-ins?', a: 'Six counter seats are held every evening and released at opening. They tend to go in the first half hour on weekends.' },
      { q: 'Can you cook around dietary requirements?', a: 'Yes, with notice at booking. Tell us what you cannot eat and the kitchen will build around it rather than remove things from a plate.' },
      { q: 'Is there a dress code?', a: 'No. Come as you are — some of our best regulars arrive in work boots.' },
    ],
    marqueeWords: ['Seasonal', 'Wood fire', 'Hand-rolled', 'Local farms', 'Natural wine', 'Counter seats'],
  },
  'nova-agency': {
    whyUs: [
      { title: 'Fourteen people, one studio', blurb: 'The people in the pitch are the people on the work. There is no second team you meet after signing.' },
      { title: 'Eight projects a year', blurb: 'A deliberate ceiling. It is what the studio can do without thinning the attention each engagement gets.' },
      { title: 'Built to be handed over', blurb: 'Everything ships with documentation and working files, so your team can run it without a retainer.' },
    ],
    process: [
      { title: 'Interrogate', blurb: 'Two weeks with your team and your customers, ending in a written point of view you are free to disagree with.' },
      { title: 'Make', blurb: 'Weekly working sessions with real artefacts, not status decks. You see the work while it is still changeable.' },
      { title: 'Hand over', blurb: 'Files, documentation, and a working session with whoever picks it up. Then we get out of the way.' },
    ],
    testimonials: [
      { text: 'They spent the first fortnight telling us our brief was wrong, and they were right. The project we ended up doing was not the one we asked for.', name: 'Kirsten Ambrose', role: 'CMO, Helio' },
      { text: 'Every file, documented, in our hands at the end. We have shipped four things off that system without calling them once.', name: 'Marcus Oyelaran', role: 'Head of Product, Fieldnote' },
    ],
    faqs: [
      { q: 'How much does an engagement cost?', a: 'Most sit between $60k and $220k depending on scope. We give a fixed price after a paid discovery week, not a range that moves later.' },
      { q: 'Do you work with in-house teams?', a: 'Usually. The best outcomes happen when your team is in the working sessions rather than receiving a handover at the end.' },
      { q: 'Do you do retainers?', a: 'Rarely, and only where there is real ongoing work. We would rather hand it over properly than bill you to keep the lights on.' },
    ],
    marqueeWords: ['Brand', 'Product', 'Motion', 'Strategy', 'Campaign', 'Design systems'],
  },
  'meridian-health': {
    whyUs: [
      { title: 'Thirty-minute appointments', blurb: 'Standard, not an upgrade. It is the difference between being examined and being processed.' },
      { title: 'One named physician', blurb: 'The same doctor holds your record, coordinates your specialists, and reads your results back to you in person.' },
      { title: 'Physician-owned', blurb: 'Independent, so care decisions are made in the room instead of by a corporate utilisation policy.' },
    ],
    process: [
      { title: 'First visit', blurb: 'A full hour: history, examination, and a plan you leave with in writing rather than a portal message later.' },
      { title: 'Coordinate', blurb: 'Referrals, imaging, and results are chased by our team, not by you. On-site imaging means most of it happens the same visit.' },
      { title: 'Follow up', blurb: 'A nurse coordinator checks in between appointments for anything ongoing, so nothing waits for the next annual.' },
    ],
    testimonials: [
      { text: 'The first appointment ran an hour and she read my old records before I arrived. I had not experienced that in twenty years of care.', name: 'Robert Nkemelu', role: 'Patient since 2021' },
      { text: 'Ultrasound, results, and a plan in a single visit. I did not have to book anything across town or wait a week to be told it was fine.', name: 'Sandra Lin', role: 'Patient since 2023' },
    ],
    faqs: [
      { q: 'Are you taking new patients?', a: 'Yes, though panels are capped to protect appointment availability. If your preferred physician is full we will tell you rather than book you anyway.' },
      { q: 'Which insurance do you accept?', a: 'Most major plans. Call with your member ID and we will confirm coverage and your likely out-of-pocket before your first visit.' },
      { q: 'How quickly can I be seen?', a: 'Same-week for established patients, and same-day for urgent concerns during Saturday hours.' },
    ],
    marqueeWords: ['Primary care', 'Screening', 'Imaging', 'Cardiology', 'Chronic care', 'Same-week'],
  },
  'luxe-ecommerce': {
    whyUs: [
      { title: 'Named suppliers', blurb: 'Every mill and workshop is listed on the product page. A supply chain you cannot describe is one you do not control.' },
      { title: 'Two productions a year', blurb: 'Small runs, restocked only when the same cloth is available. When it is gone the piece goes with it.' },
      { title: 'Repaired, not replaced', blurb: 'Free repairs for the life of the garment. We would rather mend a coat than sell you a second one.' },
    ],
    process: [
      { title: 'Choose the cloth', blurb: 'Order swatches free and keep them. Cloth reads differently in your own light than on any screen.' },
      { title: 'Fit at home', blurb: 'Two sizes on approval, thirty days, free returns both ways. Keep the one that fits.' },
      { title: 'Alter and keep', blurb: 'A contribution to local alterations on every full-price piece, and free repairs for as long as you own it.' },
    ],
    testimonials: [
      { text: 'Four winters in the overcoat and it looks better than it did new. They re-set a button last year and would not take money for it.', name: 'Julia Fenwick', role: 'Customer since 2020' },
      { text: 'I ordered two sizes, kept one, and the return was collected the next morning. No argument, no restocking fee.', name: 'Peter Almeida', role: 'Customer since 2023' },
    ],
    faqs: [
      { q: 'How do returns work?', a: 'Thirty days, free both ways, and we collect. Try two sizes at home if you are between — you are only charged for what you keep.' },
      { q: 'Will a sold-out piece come back?', a: 'Only if the mill can supply the same cloth. We will not remake it in something cheaper to keep it in stock.' },
      { q: 'Do you ship internationally?', a: 'Yes, to thirty-two countries, with duties calculated at checkout so nothing is owed on delivery.' },
    ],
    marqueeWords: ['Wool', 'Cashmere', 'Vegetable-tanned', 'Made in Britain', 'Small runs', 'Repaired free'],
  },
  'axiom-law': {
    whyUs: [
      { title: 'No billable-hour targets', blurb: 'Nobody here is incentivised to spend longer on your file than it needs. It changes the advice you get.' },
      { title: 'The partner does the work', blurb: 'Lean staffing means the attorney at your consultation is the attorney on your matter, not a team of associates behind them.' },
      { title: 'Written estimates', blurb: 'Rates published, scope agreed in writing before work starts, and a call before anything exceeds it.' },
    ],
    process: [
      { title: 'Consultation', blurb: 'Free and confidential. We will tell you at that meeting whether you need a lawyer at all — sometimes the answer is no.' },
      { title: 'Written assessment', blurb: 'A candid view of the likely outcome, the realistic cost, and the alternatives to filing, before you commit.' },
      { title: 'Resolve', blurb: 'We push for the resolution that serves you, which is frequently the one that avoids a courtroom.' },
    ],
    testimonials: [
      { text: 'The first thing they told me was that litigating would cost more than the dispute was worth. They helped me settle it in a fortnight instead.', name: 'Gregory Sandoval', role: 'Business client' },
      { text: 'Sold a company I had built for nineteen years. The same partner handled every call from the letter of intent to closing.', name: 'Yvette Broussard', role: 'Founder' },
    ],
    faqs: [
      { q: 'Is the first consultation really free?', a: 'Yes, and it is confidential whether or not you retain us. We will say plainly if you do not need a lawyer.' },
      { q: 'How are fees structured?', a: 'Hourly at published rates, or fixed fee for defined transactional work. You get a written estimate before any work begins.' },
      { q: 'Do you handle matters outside these areas?', a: 'No. We refer them on rather than learn on your file, and we will point you to someone who does it properly.' },
    ],
    marqueeWords: ['Corporate', 'Litigation', 'Real estate', 'Succession', 'Transactions', 'Disputes'],
  },
};

export function getExtras(templateId: string): TemplateExtras | null {
  return EXTRAS[templateId] || null;
}

export function getTheme(templateId: string): PreviewTheme {
  return THEMES[templateId] || DEFAULT_THEME;
}

export function getContent(templateId: string): TemplateContent | null {
  return CONTENT[templateId] || null;
}

export const getPages = getPreviewPages;
export const hrefFor = previewHref;

// --------------------------------------------------------------------------
// Link rewriting
// --------------------------------------------------------------------------

/**
 * Maps the anchor labels the homepage builders emit onto real pages. Keys are
 * lowercase; the longest matching key wins so "private events" beats "events".
 */
const LABEL_TO_PAGE: Array<[string, PageKey]> = [
  ['view all products', 'services'],
  ['submit request', 'contact'],
  ['new arrivals', 'services'],
  ['accessories', 'services'],
  ['book with dr', 'contact'],
  ['book online', 'contact'],
  ['watch demo', 'services'],
  ['start free', 'contact'],
  ['let’s talk', 'contact'],
  ['let\'s talk', 'contact'],
  ['clothing', 'services'],
  ['footwear', 'services'],
  ['features', 'services'],
  ['results', 'about'],
  ['call us', 'contact'],
  ['call (', 'contact'],
  ['docs', 'services'],
  ['practice areas', 'services'],
  ['private events', 'contact'],
  ['schedule consultation', 'contact'],
  ['book a consultation', 'contact'],
  ['free consultation', 'contact'],
  ['start a project', 'contact'],
  ['reserve your table', 'contact'],
  ['reserve a table', 'contact'],
  ['schedule a tour', 'contact'],
  ['schedule tour', 'contact'],
  ['book a table', 'contact'],
  ['get in touch', 'contact'],
  ['our process', 'about'],
  ['case studies', 'services'],
  ['portfolio', 'services'],
  ['treatments', 'services'],
  ['providers', 'about'],
  ['doctors', 'about'],
  ['agents', 'about'],
  ['book appointment', 'contact'],
  ['claim free week', 'contact'],
  ['start free trial', 'contact'],
  ['get started free', 'contact'],
  ['view schedule', 'services'],
  ['view listings', 'services'],
  ['shop collection', 'services'],
  ['get started', 'contact'],
  ['reserve now', 'contact'],
  ['join now', 'contact'],
  ['collections', 'services'],
  ['attorneys', 'about'],
  ['listings', 'services'],
  ['trainers', 'about'],
  ['services', 'services'],
  ['classes', 'services'],
  ['contact', 'contact'],
  ['pricing', 'services'],
  ['gallery', 'services'],
  ['about', 'about'],
  ['story', 'about'],
  ['menu', 'services'],
  ['work', 'services'],
  ['team', 'about'],
  ['shop', 'services'],
  ['home', 'home'],
];

function pageForLabel(label: string): PageKey | null {
  const normalized = label
    .replace(/<[^>]*>/g, ' ')
    .replace(/[→▶‹›]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  for (const [needle, page] of LABEL_TO_PAGE) {
    if (normalized === needle || normalized.includes(needle)) return page;
  }
  return null;
}

/**
 * Rewrites the dead `href="#"` anchors the builders emit into real page links
 * wherever the anchor's own text identifies a destination. Anchors that name
 * nothing navigable (Privacy, Terms, Careers) are left inert rather than
 * pointed at a page whose content would not match the label.
 */
export function linkify(html: string, templateId: string): string {
  return html.replace(
    /<a\s+href="#"([^>]*)>([\s\S]*?)<\/a>/g,
    (match, attrs: string, label: string) => {
      const page = pageForLabel(label);
      if (!page) return match;
      return `<a href="${hrefFor(templateId, page)}"${attrs}>${label}</a>`;
    }
  );
}

// --------------------------------------------------------------------------
// Shared chrome for interior pages
// --------------------------------------------------------------------------

export function chromeNav(templateId: string, theme: PreviewTheme, active: PageKey): string {
  const bg = theme.isDark ? 'rgba(9,9,11,.88)' : 'rgba(255,255,255,.92)';
  const brd = theme.isDark ? '#27272a' : '#e4e4e7';
  const txt = theme.isDark ? '#fafaf9' : '#09090b';
  const muted = theme.isDark ? '#a1a1aa' : '#71717a';
  const links = getPages(templateId)
    .map((page) => {
      const isActive = page.key === active;
      return `<a href="${hrefFor(templateId, page.key)}" style="font-size:14px;color:${isActive ? txt : muted};font-weight:${isActive ? 600 : 400}">${page.label}</a>`;
    })
    .join('');
  return `<nav style="position:fixed;top:0;left:0;right:0;z-index:50;padding:14px 20px;background:${bg};backdrop-filter:blur(12px);border-bottom:1px solid ${brd};display:flex;align-items:center;justify-content:space-between">
<a href="${hrefFor(templateId, 'home')}" style="font-family:'${theme.fHead}',serif;font-size:18px;font-weight:700;color:${txt};white-space:nowrap">${theme.name}</a>
<div class="hide-m" style="display:flex;gap:24px;align-items:center">${links}</div>
</nav>`;
}


// --------------------------------------------------------------------------
// Interior pages — composed to theme-demo density (9-11 sections each)
// --------------------------------------------------------------------------

type Images = { hero: string; gallery: string[]; team: string[]; products: string[] };

/** Editorial page header: photograph, scrim, oversized title, and a shape cut. */
function pageHeader(
  theme: PreviewTheme,
  kicker: string,
  title: string,
  sub: string,
  image: string,
  nextFill: string,
  shape: 'wave' | 'curve' | 'skew' | 'notch' = 'wave'
): string {
  return `<section style="position:relative;padding:170px 20px 120px;overflow:hidden">
<img src="${image}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:kb 22s ease-out forwards"/>
<div style="position:absolute;inset:0;background:linear-gradient(105deg,rgba(9,9,11,.9),rgba(9,9,11,.55) 60%,rgba(9,9,11,.35))"></div>
<div class="ctn" style="position:relative;z-index:1">
<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
<div style="width:34px;height:2px;background:${theme.secondary}"></div>
<p style="font-size:12px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:${theme.secondary};margin:0">${kicker}</p>
</div>
<h1 style="font-family:'${theme.fHead}',serif;font-size:clamp(38px,7vw,76px);font-weight:800;color:#fff;line-height:1.02;letter-spacing:-.02em;max-width:15ch">${title}</h1>
<p style="margin-top:20px;font-size:17.5px;line-height:1.75;color:rgba(255,255,255,.84);max-width:58ch">${sub}</p>
</div>
<div style="position:absolute;left:0;right:0;bottom:-1px;z-index:2">${divider(shape, nextFill)}</div>
</section>`;
}


// --------------------------------------------------------------------------
// Interior pages — assembled from each template's own section recipe
// --------------------------------------------------------------------------

/**
 * Renders the sections a page's recipe asks for, in the order it asks for them.
 * Anything the template has no content for is skipped rather than faked.
 */
function assemble(order: SectionKey[], parts: Partial<Record<SectionKey, string>>): string {
  return order.map((key) => parts[key] || '').join('');
}

function serviceRows(
  templateId: string,
  theme: PreviewTheme,
  p: Palette,
  content: TemplateContent,
  images: Images
): string {
  const pool = images.products.length > 0 ? images.products : images.gallery;
  const rows = content.services
    .map((service, index) => {
      const image = pool[index % Math.max(pool.length, 1)] || images.hero;
      const reversed = index % 2 === 1;
      return `<div class="g2" style="display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:center;margin-bottom:${index === content.services.length - 1 ? 0 : 78}px">
<div style="order:${reversed ? 2 : 1}">${offsetImage(theme, image, service.title, 380)}</div>
<div style="order:${reversed ? 1 : 2};position:relative">
<div aria-hidden="true" style="font-family:'${theme.fHead}',serif;font-size:clamp(54px,8vw,88px);font-weight:800;line-height:.85;color:transparent;-webkit-text-stroke:1.4px ${theme.secondary}55;margin-bottom:6px">0${index + 1}</div>
<p style="font-size:12px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${theme.secondary};margin-bottom:12px">${service.meta}</p>
<h3 style="font-family:'${theme.fHead}',serif;font-size:clamp(24px,3.2vw,36px);font-weight:700;color:${p.txt};margin-bottom:14px;line-height:1.15">${service.title}</h3>
<p style="font-size:16px;line-height:1.8;color:${p.muted};max-width:52ch">${service.blurb}</p>
<a href="${hrefFor(templateId, 'contact')}" style="display:inline-flex;align-items:center;gap:9px;margin-top:24px;padding:12px 26px;border:1.5px solid ${theme.secondary};color:${theme.secondary};border-radius:8px;font-size:14px;font-weight:700">Enquire about this <span>&rarr;</span></a>
</div></div>`;
    })
    .join('');
  return `<section class="sp" style="padding:88px 20px 96px;background:${p.surface}"><div class="ctn">${rows}</div></section>`;
}

export function buildServicesPage(
  templateId: string,
  theme: PreviewTheme,
  content: TemplateContent,
  images: Images
): string {
  const p = palette(theme);
  const extras = getExtras(templateId);
  const variety = getVariety(templateId);
  const align = variety.motion.headingAlign;
  const label = getPages(templateId).find((x) => x.key === 'services')?.label || 'Services';

  return (
    pageHeader(theme, label, label, content.servicesIntro, images.hero, p.surface, variety.motion.dividers[0]) +
    assemble(variety.services, {
      rows: serviceRows(templateId, theme, p, content, images),
      marquee: extras ? marquee(theme, extras.marqueeWords) : '',
      iconGrid: extras ? iconGrid(theme, p, 'What you get either way', extras.whyUs, align) : '',
      quote: extras ? quoteBand(theme, images.gallery[2] || images.hero, extras.testimonials[0]) : '',
      timeline: extras ? processTimeline(theme, p, 'From first call to finished', extras.process, align) : '',
      stats: statBand(theme, p, content.stats),
      faq: extras ? faqAccordion(theme, p, extras.faqs) : '',
      testimonials: extras ? testimonialPair(theme, p, extras.testimonials, align) : '',
      gallery: galleryMosaic(theme, p, images.gallery, 'Recent work', align),
    }) +
    ctaBand(theme, hrefFor(templateId, 'contact'), 'Ready to talk specifics?', content.contact.intro)
  );
}

export function buildAboutPage(
  templateId: string,
  theme: PreviewTheme,
  content: TemplateContent,
  images: Images
): string {
  const p = palette(theme);
  const extras = getExtras(templateId);
  const variety = getVariety(templateId);
  const align = variety.motion.headingAlign;
  const label = getPages(templateId).find((x) => x.key === 'about')?.label || 'About';

  // story[0] is already the header standfirst, so the body starts at the second
  // paragraph rather than repeating the same sentence twice.
  const body = content.story.length > 1 ? content.story.slice(1) : content.story;
  const story = body
    .map(
      (paragraph, index) =>
        `<p style="font-size:${index === 0 ? '20.5px' : '16px'};line-height:1.85;color:${index === 0 ? p.txt : p.muted};margin-bottom:24px">${paragraph}</p>`
    )
    .join('');

  const people = content.people
    .map((person, index) => {
      const portrait = images.team[index % Math.max(images.team.length, 1)];
      const avatar = portrait
        ? `<img src="${portrait}" alt="${person.name}" style="width:100%;height:230px;object-fit:cover;display:block;filter:grayscale(.35);transition:filter .4s"/>`
        : `<div style="width:100%;height:230px;background:${theme.secondary}1f"></div>`;
      return `<div class="card" style="overflow:hidden;border-radius:16px;border:1px solid ${p.brd};background:${p.card}">
${avatar}
<div style="padding:18px 20px 22px">
<div style="font-family:'${theme.fHead}',serif;font-size:17.5px;font-weight:700;color:${p.txt}">${person.name}</div>
<div style="margin-top:5px;font-size:12.5px;letter-spacing:1.2px;text-transform:uppercase;color:${theme.secondary}">${person.role}</div>
</div></div>`;
    })
    .join('');

  return (
    pageHeader(theme, label, label, content.story[0], images.gallery[1] || images.hero, p.surface, variety.motion.dividers[0]) +
    assemble(variety.about, {
      story: `<section class="sp" style="position:relative;padding:96px 20px;background:${p.surface};overflow:hidden"><div class="ctn g2" style="display:grid;grid-template-columns:1.15fr .85fr;gap:64px;align-items:start">
<div style="position:relative">${outlineWord('Story', theme)}<div style="position:relative;padding-top:34px">${story}</div></div>
<div>${offsetImage(theme, images.gallery[2] || images.hero, theme.name, 460)}</div>
</div></section>`,
      stats: statBand(theme, p, content.stats),
      iconGrid: extras ? iconGrid(theme, p, 'What we hold ourselves to', extras.whyUs, align) : '',
      quote: extras ? quoteBand(theme, images.gallery[3] || images.gallery[0] || images.hero, extras.testimonials[1] || extras.testimonials[0]) : '',
      team: `<section class="sp" style="padding:96px 20px;background:${p.surface}"><div class="ctn">
<div style="margin-bottom:46px;${align === 'center' ? 'text-align:center' : ''}">${eyebrow('The team', theme)}${heading('The people you will actually deal with', theme, p, align)}</div>
<div class="g4" style="display:grid;grid-template-columns:repeat(${Math.min(content.people.length, 4)},1fr);gap:24px">${people}</div>
</div></section>`,
      gallery: galleryMosaic(theme, p, images.gallery, 'A look around', align),
      timeline: extras ? processTimeline(theme, p, 'How working together goes', extras.process, align) : '',
      marquee: extras ? marquee(theme, extras.marqueeWords) : '',
      faq: extras ? faqAccordion(theme, p, extras.faqs) : '',
      testimonials: extras ? testimonialPair(theme, p, extras.testimonials, align) : '',
    }) +
    ctaBand(theme, hrefFor(templateId, 'contact'), 'Come and see for yourself', content.contact.intro)
  );
}

export function buildContactPage(
  templateId: string,
  theme: PreviewTheme,
  content: TemplateContent,
  images: Images
): string {
  const p = palette(theme);
  const extras = getExtras(templateId);
  const variety = getVariety(templateId);
  const align = variety.motion.headingAlign;
  const label = getPages(templateId).find((x) => x.key === 'contact')?.label || 'Contact';

  const detailCard = (title: string, lines: string[], index: number) =>
    `<div class="card" style="padding:26px 24px;background:${p.card};border:1px solid ${p.brd};border-radius:16px">
<div style="width:44px;height:44px;border-radius:12px;background:${theme.secondary}1a;display:flex;align-items:center;justify-content:center;margin-bottom:16px">${icon(index, theme.secondary)}</div>
<div style="font-size:11.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${theme.secondary};margin-bottom:10px">${title}</div>
${lines.map((line) => `<div style="font-size:15px;line-height:1.7;color:${p.txt}">${line}</div>`).join('')}
</div>`;

  // There is deliberately no separate "send a message" form: the name/email
  // fields live inside the booking form so details and slot submit together.
  return (
    pageHeader(theme, label, label, content.contact.intro, images.gallery[0] || images.hero, p.alt, variety.motion.dividers[0]) +
    assemble(variety.contact, {
      details: `<section class="sp" style="padding:88px 20px;background:${p.alt}"><div class="ctn g3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
${detailCard('Visit', content.contact.address, 0)}
${detailCard('Reach us', [content.contact.phone, content.contact.email], 5)}
${detailCard('Hours', content.contact.hours, 1)}
</div></div></section>`,
      booking: bookingSection(templateId, theme, p, bookingOptions(templateId, content)),
      marquee: extras ? marquee(theme, extras.marqueeWords) : '',
      faq: extras ? faqAccordion(theme, p, extras.faqs) : '',
      testimonials: extras ? testimonialPair(theme, p, extras.testimonials, align) : '',
      iconGrid: extras ? iconGrid(theme, p, 'What to expect', extras.whyUs, align) : '',
      quote: extras ? quoteBand(theme, images.gallery[2] || images.hero, extras.testimonials[0]) : '',
      gallery: galleryMosaic(theme, p, images.gallery, 'A look around', align),
      timeline: extras ? processTimeline(theme, p, 'What happens next', extras.process, align) : '',
    }) +
    ctaBand(theme, hrefFor(templateId, 'contact'), 'We answer every enquiry', content.contact.intro)
  );
}

/** What the booking form is actually booking differs by trade. */
function bookingOptions(templateId: string, content: TemplateContent) {
  if (templateId === 'maison-restaurant') {
    return {
      title: 'Reserve a table',
      intro: 'Reservations open thirty days ahead. Pick an evening and a sitting, and we will hold the table for fifteen minutes past your time.',
      choiceLabel: 'Party size',
      choices: ['2 guests', '3 guests', '4 guests', '5 guests', '6 guests', '7+ (call us)'],
    };
  }
  if (templateId === 'meridian-health') {
    return {
      title: 'Book an appointment',
      intro: 'Same-week appointments for established patients, and same-day for urgent concerns. Choose a time that suits you.',
      choiceLabel: 'Reason for visit',
      choices: content.services.map((service) => service.title),
    };
  }
  if (templateId === 'titan-fitness') {
    return {
      title: 'Book your first session',
      intro: 'The first week is free and we do not take a card. Pick a slot and a coach will be expecting you.',
      choiceLabel: 'Class',
      choices: content.services.map((service) => service.title),
    };
  }
  return {
    title: 'Book a time to talk',
    intro: 'Pick a slot that works and we will confirm by email. Every enquiry is answered by a person, usually the same working day.',
    choiceLabel: 'What is this about?',
    choices: content.services.map((service) => service.title).concat(['Something else']),
  };
}
