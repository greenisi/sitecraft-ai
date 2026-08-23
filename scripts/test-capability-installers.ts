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

import { parse } from '@babel/parser';
import { generateQuoteFormComponent, deriveQuoteOptions } from '../src/lib/templates/base/quote-form';
import { generateBookingFormComponent, deriveBookingOptions } from '../src/lib/templates/base/booking-form';
import { pickPage } from '../src/lib/ai/capability-installer';

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

console.log(
  failures === 0
    ? '\nAll checks passed.\n'
    : `\n${failures} check(s) failed.\n`
);
process.exit(failures === 0 ? 0 : 1);
