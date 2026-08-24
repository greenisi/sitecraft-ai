/**
 * Fingerprints live generated sites to find what makes them read as generated.
 *
 * Different photos and colours cannot hide a shared skeleton. This measures the
 * things a visitor actually feels: how many distinct section rhythms exist
 * across sites, how deep the interior pages are, and how much typographic and
 * chromatic range the generator is really producing.
 *
 *   node scripts/audit-generation-quality.mjs
 */

const SITES = [
  ['harborline-auto-spa-ym70', 'auto detailing'],
  ['data-cabling-mppp0hiv', 'network cabling'],
  ['blue-sky-landscape', 'landscaping'],
  ['test-bakery-website-mmfjo5nq', 'bakery'],
  ['landscaping-mmcnhgae', 'landscaping'],
  ['luxe-dental-studio-mm5biqdm', 'dental'],
  ['urban-fitness-gym-mm1i28lx', 'gym'],
  ['weed-mm154kdd', 'dispensary'],
  ['mountain-view-yoga-studio-mlzflu2f', 'yoga'],
  ['coffee-mlz8hxyy', 'coffee'],
  ['flower-shop-mlymbev2', 'florist'],
  ['your-realty-group-1771513926368', 'real estate'],
];

const PAGES = ['', 'about', 'services', 'contact'];

async function fetchText(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Strips style/script so CSS selectors are not mistaken for markup. */
function stripAssets(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');
}

function analysePage(html) {
  const body = stripAssets(html);
  // Plain count: a capped section regex silently drops long sections.
  const sections = (body.match(/<section/gi) || []).length;
  const headings = [...body.matchAll(/<h2[^>]*>([\s\S]{0,120}?)<\/h2>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
  return {
    sections,
    headings,
    words: body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
    images: (body.match(/<img/gi) || []).length,
  };
}

function fonts(html) {
  const set = new Set();
  for (const m of html.matchAll(/font-family:\s*([^;"'}]+)/gi)) {
    const first = m[1].split(',')[0].trim().replace(/['"]/g, '');
    if (first && !/^var\(|^inherit|^ui-|^system/i.test(first)) set.add(first);
  }
  for (const m of html.matchAll(/fonts\.googleapis\.com\/css2\?family=([^&"']+)/gi)) {
    set.add(decodeURIComponent(m[1]).split(':')[0].replace(/\+/g, ' '));
  }
  return [...set];
}

function palette(html) {
  const set = new Set();
  for (const m of html.matchAll(/#([0-9a-f]{6})\b/gi)) set.add('#' + m[1].toLowerCase());
  return [...set];
}

const results = [];

for (const [slug, trade] of SITES) {
  const base = `https://${slug}.innovated.site`;
  const home = await fetchText(base + '/');
  if (!home) {
    console.log(`  SKIP ${slug} (home unreachable)`);
    continue;
  }

  const pages = {};
  for (const p of PAGES) {
    const html = p === '' ? home : await fetchText(`${base}/${p}`);
    if (html) pages[p || 'home'] = analysePage(html);
  }

  results.push({
    slug,
    trade,
    fonts: fonts(home),
    palette: palette(home),
    pages,
  });
}

console.log(`\n=== ${results.length} live generated sites ===\n`);

console.log('SECTION DEPTH PER PAGE (how much site is actually there)');
for (const r of results) {
  const cells = ['home', 'about', 'services', 'contact']
    .map((p) => `${p}:${r.pages[p] ? r.pages[p].sections : '-'}`)
    .join('  ');
  console.log(`  ${r.slug.slice(0, 34).padEnd(35)} ${cells}`);
}

console.log('\nINTERIOR THINNESS (words on interior vs home)');
for (const r of results) {
  const home = r.pages.home?.words || 0;
  const inner = ['about', 'services'].map((p) => r.pages[p]?.words || 0);
  const ratio = home ? (Math.max(...inner) / home).toFixed(2) : 'n/a';
  console.log(`  ${r.slug.slice(0, 34).padEnd(35)} home:${String(home).padStart(5)}  bestInterior/home: ${ratio}`);
}

console.log('\nTYPOGRAPHY');
const fontSets = new Map();
for (const r of results) {
  const key = r.fonts.slice().sort().join(' + ') || '(none found)';
  fontSets.set(key, (fontSets.get(key) || 0) + 1);
  console.log(`  ${r.slug.slice(0, 34).padEnd(35)} ${key}`);
}
console.log(`  -> ${fontSets.size} distinct type pairings across ${results.length} sites`);

console.log('\nSECTION RHYTHM (h2 sequence on home — identical sequences read as one template)');
const rhythm = new Map();
for (const r of results) {
  const seq = (r.pages.home?.headings || []).slice(0, 6).join(' | ') || '(none)';
  rhythm.set(seq, (rhythm.get(seq) || 0) + 1);
  console.log(`  ${r.slug.slice(0, 24).padEnd(25)} ${seq.slice(0, 96)}`);
}
console.log(`  -> ${rhythm.size} distinct heading sequences across ${results.length} sites`);

console.log('\nPALETTE BREADTH');
for (const r of results) {
  console.log(`  ${r.slug.slice(0, 34).padEnd(35)} ${r.palette.length} hex colours`);
}
console.log('');
