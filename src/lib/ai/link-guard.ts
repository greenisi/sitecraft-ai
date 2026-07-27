/**
 * Deterministic internal-link integrity for generated sites.
 *
 * Non-technical owners judge the whole product by one dead button. Prompts
 * already mandate "every nav link must have a page", but models still emit
 * hrefs to routes they never generated (e.g. a "View Portfolio" CTA with no
 * /portfolio page). Like the image-guard and divider-injector, this is a
 * post-pass that never trusts the model: it inventories the routes that
 * actually exist in the generated file set and rewrites any internal href
 * that would 404 to the closest real route.
 */

export interface GeneratedFile {
  path: string;
  content: string;
}

/** Routes every generated site is expected to have as fallbacks, in order. */
const FALLBACK_PRIORITY = ['/services', '/about', '/contact', '/'];

/** hrefs we never touch. */
const EXEMPT_HREF = /^(https?:\/\/|mailto:|tel:|sms:|#)/i;

/** Derive the set of real routes from generated App Router page files. */
export function collectRoutes(files: GeneratedFile[]): Set<string> {
  const routes = new Set<string>();
  for (const f of files) {
    const m = f.path.match(/^src\/app(\/.*)?\/page\.tsx$/);
    if (m) routes.add(m[1] ? m[1] : '/');
  }
  // A site with no page files (shouldn't happen) still gets '/'.
  if (routes.size === 0) routes.add('/');
  return routes;
}

/** Best real route for a broken href: prefix match → keyword match → fallback. */
function resolveBroken(href: string, routes: Set<string>): string {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';

  // Deeper path whose parent exists: /services/lawn-care → /services
  const segments = path.split('/').filter(Boolean);
  while (segments.length > 1) {
    segments.pop();
    const parent = '/' + segments.join('/');
    if (routes.has(parent)) return parent;
  }

  // Keyword affinity: gallery/portfolio/work → portfolio-ish routes, etc.
  const keyword = segments[0] ?? '';
  const affinities: Array<[RegExp, string[]]> = [
    [/portfolio|gallery|work|project/i, ['/portfolio', '/gallery', '/work', '/services']],
    [/service|pricing|menu|practice/i, ['/services', '/pricing', '/menu']],
    [/about|team|story|studio/i, ['/about']],
    [/contact|quote|consult|book|schedule|estimate/i, ['/contact']],
  ];
  for (const [re, candidates] of affinities) {
    if (re.test(keyword)) {
      for (const c of candidates) if (routes.has(c)) return c;
    }
  }

  for (const fb of FALLBACK_PRIORITY) if (routes.has(fb)) return fb;
  return '/';
}

/**
 * Rewrites internal hrefs that point at non-existent routes. Returns the
 * updated files plus a report of what changed. Generic so callers keep any
 * extra fields (e.g. the pipeline's `type`) through the pass. Never throws.
 */
export function enforceLinkIntegrity<T extends GeneratedFile>(files: T[]): {
  files: T[];
  fixed: Array<{ file: string; from: string; to: string }>;
} {
  const fixed: Array<{ file: string; from: string; to: string }> = [];
  try {
    const routes = collectRoutes(files);

    const out = files.map((f) => {
      if (!/\.(tsx|jsx)$/.test(f.path)) return f;

      const content = f.content.replace(
        /\bhref\s*=\s*(["'])([^"']*)\1/g,
        (whole, quote: string, href: string) => {
          if (!href || EXEMPT_HREF.test(href)) return whole;
          if (!href.startsWith('/')) return whole; // relative/unusual — leave alone
          const path = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
          if (routes.has(path)) return whole;
          const to = resolveBroken(href, routes);
          fixed.push({ file: f.path, from: href, to });
          return `href=${quote}${to}${quote}`;
        }
      );

      return content === f.content ? f : { ...f, content };
    });

    for (const fix of fixed) {
      console.log(`[link-guard] ${fix.file}: ${fix.from} → ${fix.to}`);
    }
    return { files: out, fixed };
  } catch {
    return { files, fixed };
  }
}
