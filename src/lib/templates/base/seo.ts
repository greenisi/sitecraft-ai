import type { GenerationConfig } from '@/types/project';

/**
 * SEO template module -- deterministic scaffolding for generated sites.
 *
 * Emits three files for every generated project:
 *   - src/app/robots.ts          (Next.js App Router metadata route)
 *   - src/app/sitemap.ts         (Next.js App Router metadata route)
 *   - src/components/SeoSchema.tsx (server component with JSON-LD)
 *
 * Like the other modules in templates/base, each generator returns the
 * STRING contents of the target file. All config-derived values are
 * escaped via JSON.stringify at generation time so apostrophes, quotes,
 * angle brackets, and backslashes in business data can never break the
 * generated source.
 */

/**
 * Contents of src/app/robots.ts for a generated site.
 * Allows all crawlers and points them at the sitemap. The base URL comes
 * from NEXT_PUBLIC_SITE_URL (set per-deployment) with a safe fallback.
 */
export function generateRobotsTs(_config?: GenerationConfig): string {
  return `import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: new URL('/sitemap.xml', baseUrl).toString(),
  };
}
`;
}

/**
 * Contents of src/app/sitemap.ts for a generated site.
 * Lists the five standard generated pages with sensible crawl hints.
 */
export function generateSitemapTs(_config?: GenerationConfig): string {
  return `import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

// The five routes below are the standard pages every generated site ships
// with. If a particular site variant ever omits one, a 404 in the sitemap
// is harmless -- crawlers simply skip it -- but the big 5 are always
// generated, so this list stays static and deterministic.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL('/', baseUrl).toString(),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: new URL('/about', baseUrl).toString(),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: new URL('/services', baseUrl).toString(),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: new URL('/contact', baseUrl).toString(),
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: new URL('/portfolio', baseUrl).toString(),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];
}
`;
}

/**
 * Words that disqualify a capitalized phrase from being treated as a city.
 * Chosen so they never appear inside real locality names (which is why
 * "New" is deliberately absent -- New York, New Orleans, ...).
 */
const LOCALITY_STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'our',
  'your',
  'their',
  'my',
  'we',
  'all',
  'any',
  'every',
  'each',
  'this',
  'that',
  'these',
  'those',
  'need',
  'search',
  'quality',
  'business',
  'businesses',
  'company',
  'companies',
  'homeowners',
  'families',
  'people',
  'customers',
  'clients',
  'residents',
  'professionals',
  'america',
  'american',
  'internet',
  'online',
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

/**
 * Capitalized cue words that can precede a city at sentence start
 * ("Serving Austin, TX homeowners...") and get swept into the capture.
 * They are stripped from the front of a candidate rather than rejecting it.
 */
const LOCALITY_CUE_PREFIXES = new Set([
  'serving',
  'serve',
  'serves',
  'in',
  'near',
  'around',
  'throughout',
  'across',
  'of',
  'from',
  'at',
  'to',
  'for',
  'located',
  'based',
  'proudly',
  'welcome',
  'visit',
  'call',
  'contact',
  'choose',
  'trust',
]);

/**
 * Strips leading cue/stopword noise from a captured phrase, then rejects
 * the candidate entirely if any remaining word is a stopword. Returns the
 * cleaned locality or null.
 */
function cleanLocalityCandidate(raw: string): string | null {
  const words = raw.split(/\s+/);
  while (
    words.length > 0 &&
    (LOCALITY_CUE_PREFIXES.has(words[0].toLowerCase()) ||
      LOCALITY_STOPWORDS.has(words[0].toLowerCase()))
  ) {
    words.shift();
  }
  if (words.length === 0) return null;
  if (words.some((word) => LOCALITY_STOPWORDS.has(word.toLowerCase()))) {
    return null;
  }
  return words.join(' ');
}

/**
 * Best-effort extraction of a city / locality from the business description
 * or target audience. Looks for "in Austin", "serving Fort Worth",
 * "Boise, ID"-style patterns. Returns null when nothing plausible is found
 * -- callers omit address/areaServed in that case.
 */
function extractLocality(config: GenerationConfig): string | null {
  const sources = [config.business.description, config.business.targetAudience];

  // "City, ST" -- strongest signal, checked first.
  const cityState = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}),\s*[A-Z]{2}\b/;
  // "in/serving/based in/... <Capitalized Phrase>" (up to three words).
  const cue =
    /\b(?:in|serving|based in|located in|around|near|throughout|across)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;

  for (const text of sources) {
    if (!text) continue;

    const cs = cityState.exec(text);
    if (cs) {
      const cleaned = cleanLocalityCandidate(cs[1]);
      if (cleaned) return cleaned;
    }

    cue.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = cue.exec(text)) !== null) {
      const cleaned = cleanLocalityCandidate(match[1]);
      if (cleaned) return cleaned;
    }
  }

  return null;
}

/**
 * Contents of src/components/SeoSchema.tsx for a generated site.
 *
 * A dependency-free server component that renders LocalBusiness (for
 * local-service sites) or Organization JSON-LD. The schema is a plain
 * object literal in the generated code and is serialized at render time
 * with JSON.stringify, so the emitted <script> body is always valid JSON.
 */
export function generateSeoSchemaComponent(config: GenerationConfig): string {
  const schemaType =
    config.siteType === 'local-service' ? 'LocalBusiness' : 'Organization';
  const locality = extractLocality(config);

  // Every config-derived value goes through JSON.stringify HERE, at
  // generation time, so quotes/apostrophes/angle brackets in business data
  // become safe string literals in the generated source.
  const schemaLines: string[] = [
    `    '@context': 'https://schema.org',`,
    `    '@type': ${JSON.stringify(schemaType)},`,
    `    name: ${JSON.stringify(config.business.name)},`,
    `    description: ${JSON.stringify(config.business.description)},`,
    `    url: baseUrl,`,
  ];

  if (locality) {
    schemaLines.push(
      `    address: {`,
      `      '@type': 'PostalAddress',`,
      `      addressLocality: ${JSON.stringify(locality)},`,
      `    },`,
      `    areaServed: ${JSON.stringify(locality)},`
    );
  }

  return `// typeof guard: the in-browser preview sandbox has no \`process\` global,
// and an unguarded reference would crash the whole preview render.
const baseUrl =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL) ||
  'https://example.com';

/**
 * Server component that injects ${schemaType} JSON-LD structured data for
 * search engines. Dependency-free: renders a single script tag and ships
 * no client-side JavaScript.
 */
export default function SeoSchema() {
  const schema = {
${schemaLines.join('\n')}
  };

  // Escaping '<' as its JSON unicode escape prevents any embedded value
  // from closing the script tag early; the parsed JSON is unchanged.
  const json = JSON.stringify(schema).replace(/</g, '\\\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
`;
}
