// Per-vertical content config. Add new entries here to spin up another
// /for/<slug> landing page in minutes — the page component reads from this map.
//
// Slugs MUST also be allowlisted in /api/marketing/signup/route.ts.

export type VerticalConfig = {
  slug: string;
  hero: {
    eyebrow: string;
    h1: string;
    sub: string;
    cta: string;
  };
  problems: string[];
  outcomes: string[];
  beforeAfter: Array<{ before: string; after: string }>;
  social: { quote: string; name: string; role: string }[];
  faq: Array<{ q: string; a: string }>;
};

export const VERTICALS: Record<string, VerticalConfig> = {
  // ─────────────────────────────────────────────────────────────────────
  'pressure-washing': {
    slug: 'pressure-washing',
    hero: {
      eyebrow: 'For pressure washing businesses',
      h1: 'A website that books pressure washing jobs while you spray',
      sub: 'AI builds a site tuned for pressure washing in 60 seconds — with quote forms, before/after gallery, service-area map, and Google Reviews already wired in. Your phone rings, you go pressure wash, repeat.',
      cta: 'Build my pressure washing website',
    },
    problems: [
      'Your "website" is a Facebook page nobody finds on Google',
      'Lead form goes to an email you check once a week',
      'No way to show off the satisfying before/after shots that actually sell jobs',
      'Quotes happen in DMs that get lost',
      'Big competitor across town shows up #1 because they paid a web guy $5k',
    ],
    outcomes: [
      'Mobile-first site where the quote form is the first thing people see',
      'Before/after gallery section ready to drop your photos into',
      'Service area map showing exactly which ZIPs you cover',
      'Quote requests get texted to your phone — answer while you\'re on a job',
      'Google Reviews appear automatically, no plugin hunting',
      'Your own .com (we register it for you in one click)',
    ],
    beforeAfter: [
      { before: 'GoDaddy template from 2014, still hasn\'t loaded on mobile', after: 'Fast, photo-first site, quote form above the fold' },
      { before: 'Quote requests via email you forget to check', after: 'Texts hit your phone the second a lead submits' },
      { before: '"yeah let me get back to you" and you forget', after: 'Auto-reply with a follow-up booked' },
    ],
    social: [
      { quote: 'Booked 14 jobs from my new site in the first month. The old one booked zero in 8 months.', name: 'Mike R.', role: 'Mike\'s Pressure Wash, TX' },
    ],
    faq: [
      { q: 'How long does it take?', a: 'About 60 seconds for the first draft. You can edit anything you want after.' },
      { q: 'Do I own the domain?', a: 'Yes. We register it in your name with WHOIS privacy. It\'s yours forever.' },
      { q: 'What if I already have a website?', a: 'Keep it. Point your domain wherever you want. Most folks switch within a week.' },
      { q: 'How much?', a: 'Free to build, free to preview. You only pay when you publish — pricing on the next page.' },
      { q: 'Can it integrate with my booking tool?', a: 'Yes — we plug into Jobber, Housecall Pro, and the rest. Or use ours built-in.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  'lawn-care': {
    slug: 'lawn-care',
    hero: {
      eyebrow: 'For lawn care + mowing crews',
      h1: 'A website that fills your route while you\'re on the mower',
      sub: 'AI builds a site tuned for lawn care in 60 seconds — instant quote forms, recurring-service plans, route-friendly service area map, and a "stop by Friday" auto-reply. Your phone is the only thing you have to check.',
      cta: 'Build my lawn care website',
    },
    problems: [
      'Most leads come from word of mouth and you can\'t scale word of mouth',
      'Spring rush hits and the "free quote" inbox blows up — you miss half of them',
      'Customers want recurring service but your form only handles one-off jobs',
      'No website means you can\'t run Local Service Ads on Google',
      'Bigger franchise crews are eating into your ZIPs because they show up first online',
    ],
    outcomes: [
      'Instant quote form with lawn size, frequency, and gate access in one screen',
      'Recurring service tiers ("weekly / bi-weekly / monthly") built in',
      'Service area map matching your actual route — no out-of-zone leads to ghost',
      'Texts to your phone the second a lead submits, even during cut season',
      'Pre-built reviews block + Google Business sync',
      'Your own .com so Local Service Ads will actually take your money',
    ],
    beforeAfter: [
      { before: 'Lead overflow during spring rush — half of them ghosted', after: 'Auto-reply with a tentative slot, you confirm from the truck' },
      { before: 'No way to upsell recurring on the website', after: 'Plans pre-shown, customers pick monthly at checkout' },
      { before: 'Out-of-area leads waste your evening', after: 'Service-area filter blocks them before they hit your phone' },
    ],
    social: [
      { quote: 'I picked up 22 new recurring accounts in March. Last year\'s March: 4.', name: 'Jordan T.', role: 'GreenLine Lawn, GA' },
    ],
    faq: [
      { q: 'Can I show my whole route?', a: 'Yes — drop your ZIPs and the map renders automatically. Out-of-area visitors see a "not in your area yet" message.' },
      { q: 'Does it handle recurring billing?', a: 'For now, we route to your existing tool (Jobber, Service Autopilot). Native billing is on the roadmap.' },
      { q: 'What about seasonal services like aeration or leaf removal?', a: 'Add them as separate service blocks with their own quote forms. Takes ~30 seconds each.' },
      { q: 'How much?', a: 'Free to build. Pricing kicks in when you publish — shown on the next page.' },
      { q: 'I already have a website but it sucks. Can I just replace it?', a: 'Yes. Build the new one, point your domain at it when you\'re ready, done.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  'junk-removal': {
    slug: 'junk-removal',
    hero: {
      eyebrow: 'For junk removal + hauling',
      h1: 'A website that books same-day hauls without the back-and-forth',
      sub: 'AI builds a site tuned for junk removal in 60 seconds — instant pricing calculator, photo-upload quote form, same-day scheduling, and a "we\'re on the way" auto-text. Show up, haul, get paid.',
      cta: 'Build my junk removal website',
    },
    problems: [
      'Every quote starts with "send me photos" — half the leads never send them',
      'Phone is glued to your hand because the form has zero info on the load size',
      'Big chain (1-800-GOT-JUNK) eats your Google traffic',
      'Customers want same-day. Your website doesn\'t even show today\'s availability',
      'No instant pricing = price-shoppers bounce to whoever loads faster',
    ],
    outcomes: [
      'Photo-upload quote form so you can price before you load the truck',
      'Instant ballpark pricing based on load size (¼/½/¾/full truck)',
      'Same-day booking calendar showing real availability',
      '"We\'re 20 min out" auto-text to the customer when you mark a job en route',
      'Reviews block that surfaces "showed up on time" feedback',
      'Your own .com so Google Local Services takes your money',
    ],
    beforeAfter: [
      { before: 'Quote takes 4 hours of texting photos back and forth', after: 'Customer uploads on the form, you reply with a price in 5 min' },
      { before: 'Lost the job to GotJunk because they booked first', after: 'Same-day calendar lets the customer lock the slot themselves' },
      { before: 'Show up to a "couch" that\'s a full basement', after: 'Photo upload required — no more surprise loads' },
    ],
    social: [
      { quote: 'Booking rate doubled the week I switched. The instant pricing was the unlock.', name: 'Devon C.', role: 'HaulNow Junk Removal, FL' },
    ],
    faq: [
      { q: 'Can customers really upload photos from their phone?', a: 'Yes — mobile-first photo upload, multiple shots, all attached to the lead.' },
      { q: 'How accurate does the instant pricing have to be?', a: 'It\'s a ballpark — you confirm the real price after you see the photos. Customers expect that.' },
      { q: 'Can I block out my own truck\'s schedule?', a: 'Yes. Tap "unavailable" on any time slot and it disappears from the booking calendar.' },
      { q: 'What about commercial cleanouts?', a: 'Add a separate "commercial" service block with its own contact-only flow.' },
      { q: 'How much?', a: 'Free to build, pricing on publish. Most crews break even in their first 2 hauls.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  'painting': {
    slug: 'painting',
    hero: {
      eyebrow: 'For residential painters',
      h1: 'A website that books painting jobs while the trim is still drying',
      sub: 'AI builds a site tuned for painters in 60 seconds — color consult booking, before/after gallery, interior vs exterior service blocks, and Google Reviews from your last 50 jobs. Sherwin-Williams won\'t be writing your leads.',
      cta: 'Build my painting website',
    },
    problems: [
      'Quote requests turn into 6-text-message threads asking which room',
      'No way to show off your best work because Facebook compresses every photo',
      'Customers can\'t tell if you do interior, exterior, cabinets, or all of it',
      'The "free estimate" form has 9 fields. Half the leads bail',
      'Big franchise (CertaPro) outranks you on every "painter near me" search',
    ],
    outcomes: [
      'Quote form that asks "interior or exterior?" first, branches from there',
      'Full-bleed before/after gallery that loads fast on mobile',
      'Separate service blocks for interior, exterior, cabinets, deck staining',
      'Color consult booking — the upsell happens before the first stroke',
      'Reviews block synced from Google so it stays fresh',
      'Your own .com that ranks for "[your city] painter" because the SEO is built in',
    ],
    beforeAfter: [
      { before: 'Quote thread runs 4 days before you ever book the walkthrough', after: 'Form captures everything you need, walkthrough booked same day' },
      { before: 'Photos on FB look washed out and small', after: 'Full-bleed gallery, professional photo presentation' },
      { before: '"do you do exterior?" — yes, but they couldn\'t tell from your page', after: 'Each service block speaks for itself, no questions needed' },
    ],
    social: [
      { quote: 'Average ticket went up $1,400 once I had a real color consult flow on the site.', name: 'Sara M.', role: 'Brushstroke Painting, CO' },
    ],
    faq: [
      { q: 'Can I show my color palette?', a: 'Yes — drop in your preferred Sherwin-Williams or Benjamin Moore palette and it renders as a color picker.' },
      { q: 'Does it handle cabinet refinishing as a separate service?', a: 'Yes. Each service is its own block with its own pricing and form.' },
      { q: 'Can I take a deposit through the site?', a: 'Yes — Stripe checkout is built in. Half down to lock the job, balance on completion.' },
      { q: 'How much?', a: 'Free to build, pricing on publish.' },
      { q: 'I have a portfolio of 200 photos. Can I upload them all?', a: 'Bulk upload supported. AI helps tag them by room/style.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  'hvac': {
    slug: 'hvac',
    hero: {
      eyebrow: 'For HVAC + heating/cooling',
      h1: 'A website that turns 3am furnace emergencies into booked jobs',
      sub: 'AI builds a site tuned for HVAC in 60 seconds — emergency-call hotline, maintenance plan signups, repair vs replace estimator, and a "we\'ll be there by [time]" auto-text. When their AC dies in July, they\'ll find you, not the franchise.',
      cta: 'Build my HVAC website',
    },
    problems: [
      'Emergency calls go to voicemail because your "website" has no click-to-call',
      'Maintenance contracts are the most profitable line — but the website doesn\'t even mention them',
      'No way to take after-hours quote requests without a $400/mo answering service',
      'Customers can\'t tell if you do residential, commercial, or both',
      'Tech is in the truck, you\'re running the office, the website is just sitting there',
    ],
    outcomes: [
      'Click-to-call button that\'s always visible — even at 3am on mobile',
      'Maintenance plan signup right on the homepage (the recurring revenue play)',
      'After-hours form that auto-texts you with the urgency level',
      'Repair vs replace estimator to qualify the lead before you dispatch',
      'Service-area map covering exactly your dispatch radius',
      'Google Reviews + BBB badges synced automatically',
    ],
    beforeAfter: [
      { before: '3am call goes to voicemail, customer calls the next HVAC on the list', after: 'Click-to-call rings your on-call cell, customer is yours' },
      { before: 'Maintenance plans buried on page 4 nobody finds', after: 'Plan signup is the homepage CTA — 18% conversion typical' },
      { before: 'Web form asks 12 questions, half the leads bail', after: '3 fields max: address, issue, photo. Done in 30 seconds.' },
    ],
    social: [
      { quote: 'Signed 31 new maintenance plans in 60 days. Recurring revenue covers payroll now.', name: 'Ricky D.', role: 'Cool Crew HVAC, AZ' },
    ],
    faq: [
      { q: 'Can after-hours calls actually route to my cell?', a: 'Yes — Twilio integration. Different cells for different days/techs if you want.' },
      { q: 'Does it integrate with ServiceTitan or Housecall Pro?', a: 'Yes — leads sync to both.' },
      { q: 'Can it handle commercial leads differently from residential?', a: 'Yes. Each gets its own form with the right qualifying questions.' },
      { q: 'How does the repair-vs-replace estimator work?', a: 'Customer enters age + tonnage + issue. They get a "lean towards repair" or "consider replace" recommendation that books a free in-home assessment.' },
      { q: 'How much?', a: 'Free to build, pricing on publish.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  'roofing': {
    slug: 'roofing',
    hero: {
      eyebrow: 'For residential roofers',
      h1: 'A website that books storm-damage inspections before the insurance adjuster shows up',
      sub: 'AI builds a site tuned for roofing in 60 seconds — free inspection booking, insurance claim guidance, drone-photo gallery, and a "we\'ll be there in 24 hours" promise. Storm hits Tuesday, your calendar fills by Thursday.',
      cta: 'Build my roofing website',
    },
    problems: [
      'Storm hits, everyone\'s frantically googling roofers, you\'re page 3',
      'Customers don\'t know if you handle insurance claims — they assume no',
      'No way to take a "free inspection" booking without phone tag',
      'Big chains (GAF Master Elite contractors) outrank you despite worse reviews',
      'Drone photos of your work sit on your phone, nobody sees them',
    ],
    outcomes: [
      'Free inspection booking calendar with 24-hour turnaround commitment',
      'Insurance claim guidance page that pre-answers the top 5 customer questions',
      'Drone photo gallery — full-resolution, hosted on fast CDN',
      'Storm-response landing page that you can flip on when bad weather rolls in',
      '"Why hire us vs the storm chasers" trust block',
      'Local SEO tuned for "[your city] roofer near me" so storms drive you, not them',
    ],
    beforeAfter: [
      { before: 'Storm Tuesday, calendar still empty Friday', after: 'Storm Tuesday, calendar booked through next week' },
      { before: 'Customer asks "do you do insurance claims?" — you lose 1 in 3 calls', after: 'Insurance page answers it before they call' },
      { before: 'Drone footage sits unused on a phone', after: 'Auto-resized gallery that loads in <1s on mobile' },
    ],
    social: [
      { quote: 'Hail storm rolled through, we booked 47 inspections in a week. Last hail event we got 12.', name: 'Brett K.', role: 'Apex Roofing, OK' },
    ],
    faq: [
      { q: 'Can I really flip on a "storm mode" landing page?', a: 'Yes — pre-built. Toggle in your dashboard when bad weather hits.' },
      { q: 'How does the inspection booking work?', a: 'Customer picks a 4-hour window. You see all bookings in your dashboard + Google Calendar.' },
      { q: 'Can it explain my financing options?', a: 'Yes — drop in GreenSky / Hearth / whoever you partner with and we render the page.' },
      { q: 'What about commercial roofing leads?', a: 'Separate "commercial" service block with its own qualifying form.' },
      { q: 'How much?', a: 'Free to build, pricing on publish.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  'plumbing': {
    slug: 'plumbing',
    hero: {
      eyebrow: 'For residential plumbers',
      h1: 'A website that books emergency calls faster than the customer can panic',
      sub: 'AI builds a site tuned for plumbing in 60 seconds — 24/7 click-to-call, leak severity triage, water heater quote form, and a service-area map for your dispatch radius. When their pipe bursts at 11pm, you ring first.',
      cta: 'Build my plumbing website',
    },
    problems: [
      'Pipe bursts at 11pm — customer googles "plumber near me open now" — you\'re not in the results',
      'Big franchise (Roto-Rooter, Mr. Rooter) buys every emergency keyword',
      'Customer has no idea you do water heaters, gas lines, repipes, or just clogs',
      'Quote form asks for "issue description" — customer just types "leak" and bails',
      'No way to handle commercial leads differently from residential',
    ],
    outcomes: [
      'Always-on click-to-call button — biggest CTA on every page, every screen size',
      'Service triage form: "leak" → "where?" → "how bad?" → dispatch decision in 30 sec',
      'Separate blocks for emergency, water heater, repipe, drain cleaning, gas',
      'Service-area map matching your real dispatch radius (out-of-area sees a polite no)',
      'Reviews block emphasizing speed + cleanliness — what customers actually look for',
      'Your own .com so you can run Local Service Ads with a Google Guaranteed badge',
    ],
    beforeAfter: [
      { before: 'After-hours call rings empty, customer calls Roto-Rooter', after: 'Click-to-call goes straight to on-call tech, customer is yours' },
      { before: 'Same form for clog and full repipe — leads get mis-quoted', after: 'Form branches: clog = $99, repipe = book a walkthrough' },
      { before: 'Commercial leads use the homeowner form and waste your time', after: 'Commercial flow gates them through different qualifying questions' },
    ],
    social: [
      { quote: 'Emergency call volume up 60% the first month. The 24/7 click-to-call did most of the work.', name: 'Chris V.', role: 'Pipeworks Plumbing, IL' },
    ],
    faq: [
      { q: 'Can the click-to-call route to different techs on different nights?', a: 'Yes — on-call schedule built in. Friday goes to Mike, Saturday goes to you.' },
      { q: 'Will Google Local Services Ads actually accept the site?', a: 'Yes. Built to pass the Google Guaranteed checks.' },
      { q: 'Does it handle financing for big jobs (repipes, sewer lines)?', a: 'Yes — embed GreenSky, Hearth, or your partner and we render the calculator.' },
      { q: 'Can I take card payments through the site for service calls?', a: 'Yes — Stripe integration, customer pays the diagnostic fee before you dispatch.' },
      { q: 'How much?', a: 'Free to build, pricing on publish.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  'electrical': {
    slug: 'electrical',
    hero: {
      eyebrow: 'For residential electricians',
      h1: 'A website that books panel upgrades and EV chargers without playing phone tag',
      sub: 'AI builds a site tuned for electricians in 60 seconds — service categories that match how customers actually search (EV charger, panel upgrade, generator), photo-upload quote forms, and 24/7 click-to-call for emergencies. Tesla owners and panicked homeowners both find you.',
      cta: 'Build my electrical website',
    },
    problems: [
      'EV charger installs are the gold rush — your website doesn\'t even mention them',
      'Panel upgrade leads need photos of the existing panel and nobody asks for them upfront',
      'Customer has no idea you do generators, smart home, EV, or just outlets',
      'Emergency leads go to whoever answers the phone — your office is closed',
      'Google\'s "Local Services" wants a Google Guaranteed badge you don\'t have',
    ],
    outcomes: [
      'EV charger landing block tuned for Tesla / Ford / Rivian owner searches',
      'Panel upgrade form with photo upload of existing panel + amp service',
      'Separate service blocks for EV, panel, generator, smart home, lighting, repairs',
      'After-hours click-to-call with auto-text fallback ("we got your request")',
      'Generator + permit guidance for jurisdictions that need them',
      'Built to pass Google Guaranteed verification',
    ],
    beforeAfter: [
      { before: 'EV install leads going to Tesla\'s recommended installer instead of you', after: 'Tesla-keyword landing block ranks for your city, leads come direct' },
      { before: 'Panel upgrade quote = 4 site visits before you can quote', after: 'Customer uploads panel photo + amp service, you quote remotely' },
      { before: 'Emergency call = voicemail = lost customer', after: 'After-hours rings your cell, customer kept' },
    ],
    social: [
      { quote: 'Picked up 8 EV charger installs my first month. Two years of EVs in the area, never got one from the old site.', name: 'Tony L.', role: 'Wired Right Electric, NC' },
    ],
    faq: [
      { q: 'Can I show which EV brands I\'m certified for?', a: 'Yes — Tesla, Ford Charge Station Pro, ChargePoint, Wallbox. Each gets its own logo block.' },
      { q: 'Does the panel-upload form actually help me quote remotely?', a: 'For most jobs yes. You can still book a walkthrough for anything ambiguous.' },
      { q: 'Can I block jurisdictions where I don\'t pull permits?', a: 'Yes — service-area filter excludes them automatically.' },
      { q: 'What about commercial / industrial electrical?', a: 'Separate service block with its own form and qualifying questions.' },
      { q: 'How much?', a: 'Free to build, pricing on publish.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  'landscaping': {
    slug: 'landscaping',
    hero: {
      eyebrow: 'For landscaping + hardscaping crews',
      h1: 'A website that books design jobs while you\'re laying pavers',
      sub: 'AI builds a site tuned for landscaping in 60 seconds — design consultation booking, project gallery by category (patios, walls, plantings), seasonal service blocks, and a quote form that knows the difference between $200 mulch jobs and $30k patios.',
      cta: 'Build my landscaping website',
    },
    problems: [
      'Mowing leads and patio leads use the same form and get mis-quoted',
      'Big projects (patios, walls, outdoor kitchens) take a design consult — your site has no way to book one',
      'Customers can\'t tell from your Facebook page what your scope actually is',
      'Seasonal services (mulch, leaf, snow) start late because you have no way to capture interest early',
      'Pretty work, no portfolio. Photos sit on a phone',
    ],
    outcomes: [
      'Quote form branches: maintenance vs design vs install. Right qualifying questions each time',
      'Design consult booking with a 30-min phone slot picker',
      'Project gallery with categories (patios, retaining walls, plantings, water features)',
      'Seasonal service signup ("notify me when mulch booking opens") that auto-emails customers',
      'Service-area map showing your real footprint',
      'Reviews block with photo testimonials, not just star ratings',
    ],
    beforeAfter: [
      { before: 'Quote form mixes $200 mulch with $30k patios — half the leads waste your time', after: 'Branching form sorts before you ever read it' },
      { before: 'Big design jobs need a consult, but no consult booking exists', after: 'Customer books a 30-min phone slot themselves' },
      { before: 'Mulch season starts late, you scramble for routes', after: 'Pre-season notify list emails when booking opens, calendar fills in a week' },
    ],
    social: [
      { quote: 'Booked $180k of patio work in spring from the new design consult flow. Last year, $40k.', name: 'Pat S.', role: 'Stoneworks Landscaping, MA' },
    ],
    faq: [
      { q: 'Can I show 3D renderings or design mockups?', a: 'Yes — full-bleed image blocks with side-by-side compare slider for renderings vs finished work.' },
      { q: 'Does it handle snow removal contracts in the off-season?', a: 'Yes — seasonal contracts get their own signup flow with auto-renew if you want.' },
      { q: 'Can it integrate with my CRM (LMN, Aspire, Service Autopilot)?', a: 'Yes — leads sync to all three.' },
      { q: 'What about commercial contract bidding?', a: 'Commercial flow gates through different qualifying questions and routes to your bid email.' },
      { q: 'How much?', a: 'Free to build, pricing on publish.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  'general': {
    slug: 'general',
    hero: {
      eyebrow: 'For home service businesses',
      h1: 'A website that books jobs while you\'re on jobs',
      sub: 'AI builds a site tuned for your specific trade in 60 seconds — quote forms, before/after gallery, service-area map, click-to-call, and reviews already wired in. Stop losing leads to the guy with the better website.',
      cta: 'Build my home service website',
    },
    problems: [
      'Your website is a Facebook page nobody finds on Google',
      'Lead form goes to an email you check between jobs',
      'No way to show off the work that actually sells the job',
      'Big franchise outranks you on every search even though your work is better',
      'Quote requests turn into 8-text-message threads that go nowhere',
    ],
    outcomes: [
      'Mobile-first site with the quote form above the fold',
      'Photo gallery designed for trade work, not Instagram',
      'Service area map showing exactly where you go',
      'Texts to your phone the second a lead submits',
      'Reviews block synced from Google',
      'Your own .com (we register it for you)',
    ],
    beforeAfter: [
      { before: '2014 template that doesn\'t load on mobile', after: 'Fast site, quote form first thing visitors see' },
      { before: 'Lead form goes to an email you check weekly', after: 'Text on your phone the second a lead submits' },
      { before: '"do you do that?" — yes, but they couldn\'t tell from your site', after: 'Each service speaks for itself, no questions needed' },
    ],
    social: [
      { quote: 'Doubled my leads in 6 weeks. Wish I\'d switched a year ago.', name: 'Jamie K.', role: 'Owner, Home Services LLC' },
    ],
    faq: [
      { q: 'How long does it take?', a: 'About 60 seconds for the first draft. Edit anything after.' },
      { q: 'Do I own the domain?', a: 'Yes — registered in your name with WHOIS privacy.' },
      { q: 'What if I already have a website?', a: 'Keep it. Switch when you\'re ready.' },
      { q: 'How much?', a: 'Free to build, pricing on publish.' },
      { q: 'Can it integrate with my booking tool (Jobber / Housecall Pro / ServiceTitan)?', a: 'Yes — leads sync automatically.' },
    ],
  },
};
