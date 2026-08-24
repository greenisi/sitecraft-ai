/**
 * Deterministic image health guard for generated sites.
 *
 * Models copy Unsplash photo IDs from the prompts or hallucinate new ones;
 * a dead ID renders as a blank box — which in a photographic hero looks
 * identical to the white-text-on-white bug. Prompts can't guarantee a URL
 * is alive, so the pipeline verifies each unique Unsplash URL with a HEAD
 * request and swaps dead ones for verified, category-matched replacements.
 *
 * Fail-open: network errors and timeouts count as alive — we only replace
 * an image when Unsplash affirmatively says it's gone (4xx/5xx).
 */

const UNSPLASH_URL_RE = /https:\/\/images\.unsplash\.com\/(photo-[0-9a-f]+-[0-9a-f]+)(\?[^"'`\s)]*)?/g;

/**
 * Replacement pools — every ID verified live (HTTP 200) on 2026-07-01.
 * Picked deterministically by hashing the dead ID so regenerated previews
 * stay stable.
 */
const FALLBACK_POOLS: Array<{ match: RegExp; ids: string[] }> = [
  // Keep automotive ahead of healthcare: "Auto Spa" contains the word spa,
  // but vehicle/detailing context must always win.
  {
    match: /automotive|auto\s*(?:spa|detail|care)|car\s*(?:wash|care|detail)|vehicle|ceramic coating|paint correction|mobile detailing/i,
    ids: [
      'photo-1503376780353-7e6692767b70',
      'photo-1492144534655-ae79c964c9d7',
      'photo-1487754180451-c456f719a1fc',
      'photo-1549317661-bd32c8ce0db2',
      'photo-1553440569-bcc63803a83d',
      'photo-1618843479313-40f8afb4b4d8',
    ],
  },
  {
    match: /landscap|garden|lawn|outdoor|nature|tree|plant/i,
    ids: [
      'photo-1466692476868-aef1dfb1e735',
      'photo-1585320806297-9794b3e4eeae',
      'photo-1416879595882-3373a0480b5b',
      'photo-1523348837708-15d4a09cfac2',
      'photo-1592150621744-aca64f48394a',
    ],
  },
  {
    match: /restaurant|food|menu|dish|chef|dining|bakery|cafe|coffee/i,
    ids: [
      'photo-1517248135467-4c7edcad34c4',
      'photo-1414235077428-338989a2e8c0',
      'photo-1504674900247-0877df9cc836',
    ],
  },
  {
    match: /health|medical|dental|clinic|doctor|wellness|spa|therap/i,
    ids: [
      'photo-1576091160399-112ba8d25d1d',
      'photo-1559757148-5c350d0d3c56',
      'photo-1579684385127-1ef15d508118',
    ],
  },
  {
    match: /real.?estate|property|home|house|realt|apartment|interior/i,
    ids: [
      'photo-1560448204-e02f11c3d0e2',
      'photo-1600596542815-ffad4c1539a9',
      'photo-1600585154340-be6161a56a0c',
    ],
  },
  {
    match: /fitness|gym|training|workout|athlete|yoga/i,
    ids: [
      'photo-1534438327276-14e5300c3a48',
      'photo-1571019613454-1cb2f99b2d8b',
      'photo-1517836357463-d25dfeac3438',
    ],
  },
  {
    match: /tech|software|saas|app|startup|data|digital|code/i,
    ids: [
      'photo-1518770660439-4636190af475',
      'photo-1531297484001-80022131f5a1',
      'photo-1550751827-4bd374c3f58b',
    ],
  },
  {
    match: /design|creative|studio|portfolio|agency|art/i,
    ids: [
      'photo-1558655146-9f40138edfeb',
      'photo-1561070791-2526d30994b5',
      'photo-1545235617-9465d2a55698',
    ],
  },
];

/** Generic professional fallbacks when no category matches. */
const GENERIC_POOL = [
  'photo-1508515053963-70c7cc39dfb5',
  'photo-1584479898061-15742e14f50d',
  'photo-1531297484001-80022131f5a1',
  'photo-1560448204-e02f11c3d0e2',
];

/** Cross-file cache so each unique ID is checked at most once per process. */
const aliveCache = new Map<string, boolean>();

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

async function isAlive(photoId: string): Promise<boolean> {
  const cached = aliveCache.get(photoId);
  if (cached !== undefined) return cached;

  let alive = true;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://images.unsplash.com/${photoId}?w=10`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timer);
    // Only an affirmative error status counts as dead — fail open otherwise.
    alive = res.status < 400;
  } catch {
    alive = true;
  }

  aliveCache.set(photoId, alive);
  return alive;
}

function pickReplacement(deadId: string, fileContent: string): string {
  const pool = FALLBACK_POOLS.find((p) => p.match.test(fileContent))?.ids ?? GENERIC_POOL;
  return pool[hashId(deadId) % pool.length];
}

/**
 * Generation-scoped context for gallery enforcement. Create one per
 * generation and pass it to every repairDeadImageUrls call so uniqueness
 * is enforced ACROSS files, not just within one.
 */
export interface GalleryContext {
  /** Curated verified pool for this industry (null = no curated gallery). */
  pool: Array<{ id: string; tier: string; subject: string }> | null;
  /** id → number of files it has already appeared in. */
  used: Map<string, number>;
}

export function createGalleryContext(
  pool: GalleryContext['pool']
): GalleryContext {
  return { pool, used: new Map() };
}

/** Max distinct files an image may appear in, by tier. */
function tierLimit(tier: string | undefined): number {
  return tier === 'texture' ? 2 : 1;
}

function pickUnused(ctx: GalleryContext, preferredTier: string | undefined): string | null {
  if (!ctx.pool) return null;
  const unused = ctx.pool.filter(
    (img) => (ctx.used.get(img.id) ?? 0) === 0 && img.tier !== 'portrait'
  );
  if (unused.length === 0) return null;
  const tierOrder =
    preferredTier === 'hero'
      ? ['hero', 'exterior', 'detail', 'texture']
      : preferredTier === 'exterior'
        ? ['exterior', 'hero', 'detail', 'texture']
        : ['detail', 'exterior', 'hero', 'texture'];
  for (const tier of tierOrder) {
    const hit = unused.find((img) => img.tier === tier);
    if (hit) return hit.id;
  }
  return unused[0].id;
}

/**
 * Rewrites string-literal alt attributes so they describe the VERIFIED
 * subject of the image actually in the tag. Two failure modes make this
 * necessary: the dedupe pass swaps image IDs but the model's original alt
 * stays behind, and models sometimes pair a correct gallery ID with the alt
 * text of a different one. Expression alts (alt={...}) are left alone.
 */
function enforceTruthfulAlts(
  content: string,
  pool: NonNullable<GalleryContext['pool']>
): string {
  const poolById = new Map(pool.map((img) => [img.id, img]));
  return content.replace(/<img\b[^>]*?>/g, (tag) => {
    const idMatch = tag.match(/images\.unsplash\.com\/(photo-[0-9a-f]+-[0-9a-f]+)/);
    if (!idMatch) return tag;
    const entry = poolById.get(idMatch[1]);
    if (!entry) return tag;
    const subject = entry.subject.replace(/"/g, '&quot;');
    if (/\balt\s*=\s*"[^"]*"/.test(tag)) {
      return tag.replace(/\balt\s*=\s*"[^"]*"/, `alt="${subject}"`);
    }
    if (/\balt\s*=\s*'[^']*'/.test(tag)) {
      return tag.replace(/\balt\s*=\s*'[^']*'/, `alt='${subject}'`);
    }
    return tag;
  });
}

/**
 * Scans a generated file for Unsplash image URLs, verifies each unique
 * photo ID, and rewrites dead ones to a verified category-matched ID while
 * preserving the original query string (dimensions/quality). When a
 * GalleryContext is provided, additionally enforces cross-file uniqueness:
 * an image already used in a previous file (beyond its tier limit) is
 * swapped for an unused pool image. Returns the (possibly unchanged)
 * content. Never throws.
 */
export async function repairDeadImageUrls(
  content: string,
  ctx?: GalleryContext
): Promise<string> {
  try {
    const ids = new Set<string>();
    for (const m of content.matchAll(UNSPLASH_URL_RE)) {
      ids.add(m[1]);
    }
    if (ids.size === 0) return content;

    const checks = await Promise.all(
      [...ids].map(async (id) => [id, await isAlive(id)] as const)
    );
    const dead = checks.filter(([, alive]) => !alive).map(([id]) => id);

    let out = content;
    for (const id of dead) {
      const replacement =
        (ctx?.pool ? pickUnused(ctx, undefined) : null) ?? pickReplacement(id, content);
      out = out.split(id).join(replacement);
      console.log(`[image-guard] replaced dead Unsplash id ${id} → ${replacement}`);
    }

    // Cross-file uniqueness: swap images that already hit their tier limit
    // in previous files for unused pool images.
    if (ctx?.pool) {
      const poolById = new Map(ctx.pool.map((img) => [img.id, img]));
      const currentIds = new Set<string>();
      for (const m of out.matchAll(UNSPLASH_URL_RE)) currentIds.add(m[1]);

      for (const id of currentIds) {
        const entry = poolById.get(id);
        const priorUses = ctx.used.get(id) ?? 0;

        // A curated gallery is an allowlist, not merely a dedupe pool. A live
        // but semantically wrong photo (for example, seedlings on an auto
        // detailing page) is still a broken result and must be replaced.
        if (!entry) {
          const replacement = pickUnused(ctx, undefined);
          if (replacement) {
            out = out.split(id).join(replacement);
            ctx.used.set(replacement, (ctx.used.get(replacement) ?? 0) + 1);
            console.log(`[image-guard] replaced out-of-gallery id ${id} → ${replacement}`);
          } else {
            // Pool exhausted — preserve a working image rather than creating
            // a blank, but do not count it as an approved gallery entry.
            ctx.used.set(id, priorUses + 1);
          }
          continue;
        }

        if (priorUses >= tierLimit(entry.tier)) {
          const replacement = pickUnused(ctx, entry?.tier);
          if (replacement) {
            out = out.split(id).join(replacement);
            ctx.used.set(replacement, (ctx.used.get(replacement) ?? 0) + 1);
            console.log(`[image-guard] deduped reused id ${id} → ${replacement}`);
          } else {
            // Pool exhausted — leave in place rather than break imagery.
            ctx.used.set(id, priorUses + 1);
          }
        } else {
          ctx.used.set(id, priorUses + 1);
        }
      }

      // After all ID swaps are final, make every string-literal alt tell the
      // truth about the image actually in the tag.
      out = enforceTruthfulAlts(out, ctx.pool);
    }

    return out;
  } catch {
    return content;
  }
}
