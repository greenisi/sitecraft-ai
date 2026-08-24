/**
 * Parse-checks the components the capability installers write into a site, and
 * exercises the page-preference logic that decides where they land.
 *
 * Generated code is emitted from template literals, so an escaping slip shows
 * up as a component that looks right in review and does not parse in the
 * build. This codebase has been bitten by exactly that before, so nothing here
 * is eyeballed: every component is run through the same Babel parser the
 * installer uses before it will write anything.
 *
 *   npx tsx scripts/test-capability-installers.ts
 */

import { readFileSync, existsSync } from 'fs';
import { parse } from '@babel/parser';
import { generateQuoteFormComponent, deriveQuoteOptions } from '../src/lib/templates/base/quote-form';
import {
  generateBookingFormComponent,
  deriveBookingOptions,
  type BookingIntent,
} from '../src/lib/templates/base/booking-form';
import { generateReviewsSectionComponent, deriveReviewsOptions } from '../src/lib/templates/base/reviews-section';
import { generateWorkGalleryComponent, deriveWorkGalleryOptions } from '../src/lib/templates/base/work-gallery';
import { pickPage, injectComponentIntoPage } from '../src/lib/ai/capability-installer';

let failures = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function parses(source: string): string | null {
  try {
    parse(source, { sourceType: 'module', plugins: ['jsx', 'typescript'], errorRecovery: false });
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

const TRADES: Array<[string, string]> = [
  ['local-service', 'Roofing & Gutters'],
  ['local-service', 'Landscaping & Lawn Care'],
  ['local-service', 'Plumbing and HVAC'],
  ['local-service', 'Commercial Cleaning'],
  ['local-service', 'Kitchen Remodeling'],
  ['business', 'Dental Clinic'],
  ['restaurant', 'Italian Dining'],
  ['business', ''],
  ['', ''],
];

console.log('\nQuote form parses for every trade');
for (const [siteType, industry] of TRADES) {
  const source = generateQuoteFormComponent(deriveQuoteOptions(siteType, industry));
  const error = parses(source);
  check(`${siteType || '(none)'} / ${industry || '(none)'}`, error === null, error || undefined);
}

console.log('\nBooking form parses for every trade');
for (const [siteType, industry] of TRADES) {
  const source = generateBookingFormComponent(deriveBookingOptions(siteType, industry));
  const error = parses(source);
  check(`${siteType || '(none)'} / ${industry || '(none)'}`, error === null, error || undefined);
}

console.log('\nGenerated source is free of un-substituted placeholders');
{
  const source = generateQuoteFormComponent(deriveQuoteOptions('local-service', 'Roofing'));
  // The bug that shipped before: a nested template literal emitting the
  // placeholder text itself instead of interpolating.
  check('no literal ${ left in the output', !/\$\{/.test(source));
  check('PROJECT_ID placeholder is present for publish-time substitution', source.includes('PROJECT_ID'));
  check('posts to submit-form', source.includes("'/submit-form'") || source.includes('/submit-form'));
  check('tags submissions as quote', source.includes("'quote'"));
  check('includes the honeypot spam-guard checks', source.includes('website_url'));
  check('sends photos as images[]', source.includes("payload.append('images'"));
}

console.log('\nQuote copy is framed per trade, not one generic block');
{
  const headings = new Set(
    TRADES.map(([siteType, industry]) => deriveQuoteOptions(siteType, industry).heading)
  );
  check(`distinct headings across ${TRADES.length} trades`, headings.size >= 5, `got ${headings.size}`);

  const roofing = deriveQuoteOptions('local-service', 'Roofing & Gutters');
  check('roofing offers a leak/repair option', roofing.choices.some((c) => /leak|repair/i.test(c)));
  check('roofing never invents a service name', !roofing.choices.some((c) => /gutter guard|shingle/i.test(c)));
}

console.log('\nInstaller puts each capability on the right page');
{
  const pages = [
    'src/app/page.tsx',
    'src/app/about/page.tsx',
    'src/app/services/page.tsx',
    'src/app/contact/page.tsx',
  ];

  check('newsletter keeps the home-page default', pickPage(pages) === 'src/app/page.tsx');

  const bookingPrefs = [/\/(book|booking|appointments?|reservations?)\/page\.tsx$/, /\/contact\/page\.tsx$/];
  check(
    'booking falls back to contact when there is no booking page',
    pickPage(pages, bookingPrefs) === 'src/app/contact/page.tsx'
  );
  check(
    'booking prefers a dedicated booking page',
    pickPage([...pages, 'src/app/book/page.tsx'], bookingPrefs) === 'src/app/book/page.tsx'
  );

  const quotePrefs = [/\/(quote|quotes|estimates?)\/page\.tsx$/, /\/contact\/page\.tsx$/];
  check(
    'quote prefers a dedicated quote page',
    pickPage([...pages, 'src/app/quote/page.tsx'], quotePrefs) === 'src/app/quote/page.tsx'
  );
  check(
    'quote falls back to home when there is no contact or quote page',
    pickPage(['src/app/page.tsx', 'src/app/about/page.tsx'], quotePrefs) === 'src/app/page.tsx'
  );
  check('non-page files are never chosen', pickPage(['src/components/Hero.tsx']) === undefined);
}

console.log('\nReviews section parses for every trade');
for (const [siteType, industry] of TRADES) {
  const source = generateReviewsSectionComponent(deriveReviewsOptions(siteType, industry));
  const error = parses(source);
  check(`${siteType || '(none)'} / ${industry || '(none)'}`, error === null, error || undefined);
}

console.log('\nWork gallery parses for every trade');
for (const [siteType, industry] of TRADES) {
  const source = generateWorkGalleryComponent(deriveWorkGalleryOptions(siteType, industry));
  const error = parses(source);
  check(`${siteType || '(none)'} / ${industry || '(none)'}`, error === null, error || undefined);
}

console.log('\nReviews and gallery read live data and stay quiet when empty');
{
  const reviews = generateReviewsSectionComponent(deriveReviewsOptions('local-service', 'Roofing'));
  check('no literal ${ left in reviews', !/\$\{/.test(reviews));
  check('reviews reads the live endpoint', reviews.includes("'/reviews'"));
  check('reviews submits with a honeypot', reviews.includes('website_url'));
  check('reviews renders nothing while empty', /return null/.test(reviews));
  check('reviews says approval is required', /read before they appear/i.test(reviews));

  const gallery = generateWorkGalleryComponent(deriveWorkGalleryOptions('local-service', 'Roofing'));
  check('no literal ${ left in gallery', !/\$\{/.test(gallery));
  check('gallery reads the live endpoint', gallery.includes("'/gallery'"));
  check('gallery renders nothing while empty', /return null/.test(gallery));
  check('gallery lightbox is escapable', gallery.includes("event.key === 'Escape'"));
  check('gallery images lazy-load', gallery.includes('loading="lazy"'));

  // The promise is "the site updates itself", which only holds if content is
  // fetched at runtime rather than written into the component.
  check('gallery bakes in no image URLs', !/https?:\/\/[^'"\s]+\.(?:png|jpe?g|webp)/i.test(gallery));

  const headings = new Set(
    TRADES.map(([s, i]) => deriveReviewsOptions(s, i).heading)
  );
  check('review headings differ by trade', headings.size >= 3, `got ${headings.size}`);
  check(
    'a clinic gets patients, not customers',
    deriveReviewsOptions('business', 'Dental Clinic').heading === 'What our patients say'
  );
  check(
    'a restaurant gets guests',
    deriveReviewsOptions('restaurant', 'Italian Dining').heading === 'What our guests say'
  );
}

console.log('\nPublic site endpoints are reachable cross-origin');
{
  // Every route a published site reads content from. cart, checkout and
  // create-checkout are deliberately absent: they are superseded by
  // /api/storefront/[projectId]/checkout and must NOT be made reachable from
  // other origins.
  const routes = [
    'reviews', 'gallery', 'bookings', 'submit-form', 'contact',
    'services', 'products', 'orders', 'blog', 'business-info', 'properties',
  ];
  for (const route of routes) {
    const source = readFileSync(
      `src/app/api/sites/[projectId]/${route}/route.ts`,
      'utf8'
    );
    check(`${route} sends CORS headers`, source.includes('Access-Control-Allow-Origin'));
    check(`${route} answers the preflight`, /export async function OPTIONS/.test(source));
  }

  // Prices must never come from the request body on a payment path.
  const createCheckout = readFileSync(
    'src/app/api/sites/[projectId]/create-checkout/route.ts',
    'utf8'
  );
  check(
    'create-checkout resolves prices from the database',
    createCheckout.includes("from('products')") && /unit_amount: unitAmount/.test(createCheckout)
  );
  check(
    'create-checkout stays unreachable cross-origin',
    !createCheckout.includes('Access-Control-Allow-Origin')
  );

  check(
    'create-checkout still accepts the name-only cart the publisher injects',
    createCheckout.includes('productNames')
  );

  // profiles.stripe_account_id does not exist; the real column is
  // stripe_connect_account_id. Selecting the phantom silently disables
  // whatever depends on it.
  for (const file of ['src/app/api/projects/[projectId]/onboarding-status/route.ts']) {
    const source = readFileSync(file, 'utf8');
    check(
      `${file.split('/').slice(-2)[0]} reads a stripe column that exists`,
      !/select\('stripe_account_id'\)/.test(source)
    );
  }

  // The superseded pair is gone; nothing should reintroduce a second
  // checkout under /api/sites/.
  check(
    'superseded /api/sites checkout route is gone',
    !existsSync('src/app/api/sites/[projectId]/checkout/route.ts')
  );
  check(
    'superseded checkout success route is gone',
    !existsSync('src/app/api/sites/[projectId]/checkout/success/route.ts')
  );
}

console.log('\nBooking intent overrides trade guessing');
{
  const intents: BookingIntent[] = ['table', 'class', 'appointment'];
  for (const intent of intents) {
    const source = generateBookingFormComponent(deriveBookingOptions('', '', intent));
    check(`${intent} parses`, parses(source) === null);
  }

  // A gym whose industry string never matches the restaurant regex must still
  // get table copy if that is the capability the owner accepted.
  const table = deriveBookingOptions('business', 'Hospitality Group', 'table');
  check('table intent wins over an unmatched industry', table.heading === 'Reserve a table');
  check('table intent asks party size', table.choiceLabel === 'Party size');

  const klass = deriveBookingOptions('business', 'Wellness', 'class');
  check('class intent wins over the wellness trade match', klass.heading === 'Book a class');
  check('class intent never invents a timetable', !klass.choices.some((c) => /yoga|spin|pilates/i.test(c)));

  // Omitting intent must keep the generation-time behaviour untouched.
  check(
    'no intent still infers from the trade',
    deriveBookingOptions('restaurant', 'Italian Dining').heading === 'Reserve a table'
  );
  check(
    'no intent still gives a contractor a visit',
    deriveBookingOptions('local-service', 'Roofing').heading === 'Book a visit'
  );
}

async function installerChecks() {
console.log('\nA second booking capability does not duplicate the form');
{
  const files = [
    { id: 'f1', file_path: 'src/app/page.tsx', content: 'export default function Home(){\n  return (\n    <main>\n      <h1>Home</h1>\n    </main>\n  );\n}\n' },
    { id: 'f2', file_path: 'src/app/contact/page.tsx', content: "import BookingForm from '@/components/BookingForm';\n\nexport default function Contact(){\n  return (\n    <main>\n      <BookingForm />\n    </main>\n  );\n}\n" },
    { id: 'f3', file_path: 'src/app/reservations/page.tsx', content: 'export default function Reservations(){\n  return (\n    <main>\n      <h1>Reservations</h1>\n    </main>\n  );\n}\n' },
    { id: 'f4', file_path: 'src/components/BookingForm.tsx', content: '// old appointment framing\n' },
  ];

  const updates: Array<{ id: string; content: string }> = [];
  const inserts: Array<{ file_path: string }> = [];
  const supabase = fakeSupabase(files, updates, inserts);

  const result = await injectComponentIntoPage(supabase, 'p1', {
    componentName: 'BookingForm',
    filePath: 'src/components/BookingForm.tsx',
    content: '// new table framing\n',
    preferPages: [/\/(reservations?|book|booking)\/page\.tsx$/, /\/contact\/page\.tsx$/],
  });

  check('install reports success', result.ok === true);
  check(
    'reuses the page already rendering the form, not the preferred one',
    result.page === 'src/app/contact/page.tsx',
    `got ${result.page}`
  );
  check('reservations page was left alone', !updates.some((u) => u.id === 'f3'));
  check('no duplicate component file inserted', inserts.length === 0);
  check(
    'the shared component was refreshed with the new framing',
    updates.some((u) => u.id === 'f4' && u.content.includes('new table framing'))
  );
}

console.log('\nA first booking capability installs onto the preferred page');
{
  const files = [
    { id: 'f1', file_path: 'src/app/page.tsx', content: 'export default function Home(){\n  return (\n    <main>\n      <h1>Home</h1>\n    </main>\n  );\n}\n' },
    { id: 'f2', file_path: 'src/app/reservations/page.tsx', content: 'export default function Reservations(){\n  return (\n    <main>\n      <h1>Reservations</h1>\n    </main>\n  );\n}\n' },
  ];

  const updates: Array<{ id: string; content: string }> = [];
  const inserts: Array<{ file_path: string }> = [];
  const supabase = fakeSupabase(files, updates, inserts);

  const result = await injectComponentIntoPage(supabase, 'p1', {
    componentName: 'BookingForm',
    filePath: 'src/components/BookingForm.tsx',
    content: generateBookingFormComponent(deriveBookingOptions('', '', 'table')),
    preferPages: [/\/(reservations?|book|booking)\/page\.tsx$/, /\/contact\/page\.tsx$/],
  });

  check('installs onto the reservations page', result.page === 'src/app/reservations/page.tsx');
  check('writes the component file', inserts.some((i) => i.file_path === 'src/components/BookingForm.tsx'));

  const page = updates.find((u) => u.id === 'f2');
  check('page now imports the component', Boolean(page && /import BookingForm/.test(page.content)));
  check('page now renders the component', Boolean(page && /<BookingForm \/>/.test(page.content)));
  check('edited page still parses', Boolean(page && parses(page.content) === null));
}
}

/**
 * Minimal stand-in for the Supabase query builder, covering only the chains
 * injectComponentIntoPage actually uses.
 */
function fakeSupabase(
  files: Array<{ id: string; file_path: string; content: string }>,
  updates: Array<{ id: string; content: string }>,
  inserts: Array<{ file_path: string }>
) {
  return {
    from(table: string) {
      if (table === 'generation_versions') {
        const chain: Record<string, unknown> = {};
        for (const method of ['select', 'eq', 'order', 'limit']) {
          chain[method] = () => chain;
        }
        chain.maybeSingle = async () => ({ data: { id: 'v1' } });
        return chain;
      }

      return {
        select: () => ({ eq: async () => ({ data: files }) }),
        update: (patch: { content: string }) => ({
          eq: async (_column: string, id: string) => {
            updates.push({ id, content: patch.content });
            const row = files.find((file) => file.id === id);
            if (row) row.content = patch.content;
            return { data: null };
          },
        }),
        insert: async (row: { file_path: string; content: string }) => {
          inserts.push({ file_path: row.file_path });
          files.push({ id: 'new', ...row });
          return { data: null };
        },
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

installerChecks().then(() => {
  console.log(
    failures === 0
      ? '\nAll checks passed.\n'
      : `\n${failures} check(s) failed.\n`
  );
  process.exit(failures === 0 ? 0 : 1);
});
