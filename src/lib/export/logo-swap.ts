import { parse as babelParse } from '@babel/parser';

/**
 * Replaces the generated wordmark with the owner's uploaded logo.
 *
 * This runs at publish rather than at generation because the logo does not
 * exist yet when the site is built -- the owner uploads it afterwards, the
 * same reason PROJECT_ID is substituted here rather than written in.
 *
 * The follow-up flow has been able to store a logo_url for months and nothing
 * ever read it: no UI asked for one, and the publisher never looked. The
 * instruction it produced ("use the uploaded logo in the navbar instead of the
 * generated wordmark") was handed to the model, which is exactly the kind of
 * thing that only sometimes happens. So it is done deterministically here.
 *
 * The brand block in every generated navbar is a Link to "/" wrapping one or
 * more spans of the business name. Its children are swapped for an image and
 * the accessible name is preserved, since a logo with no alt text is a link
 * with no name.
 */

export interface LogoSwapResult {
  content: string;
  changed: boolean;
  reason?: string;
}

function parses(content: string): boolean {
  try {
    babelParse(content, { sourceType: 'module', plugins: ['jsx', 'typescript'], errorRecovery: false });
    return true;
  } catch {
    return false;
  }
}

/** The home link that carries the wordmark, in either quote style. */
const BRAND_LINK = /(<Link\b[^>]*href=(["'])\/\2[^>]*>)([\s\S]*?)(<\/Link>)/;

export function swapWordmarkForLogo(
  content: string,
  logoUrl: string,
  businessName: string
): LogoSwapResult {
  if (!logoUrl) return { content, changed: false, reason: 'no logo url' };
  // Already image-led; replacing it would fight the design rather than help.
  if (/<img\b|<Image\b/.test(content.match(BRAND_LINK)?.[0] ?? '')) {
    return { content, changed: false, reason: 'brand already uses an image' };
  }

  const match = content.match(BRAND_LINK);
  if (!match) return { content, changed: false, reason: 'no brand link found' };

  const [whole, open, , inner, close] = match;
  if (!inner.trim()) return { content, changed: false, reason: 'brand link is empty' };

  const alt = (businessName || 'Home').replace(/["\\]/g, '').trim() || 'Home';
  const image = [
    '',
    '        <img',
    `          src="${logoUrl}"`,
    `          alt="${alt}"`,
    '          className="h-9 w-auto max-w-[190px] object-contain sm:h-10"',
    '        />',
    '      ',
  ].join('\n');

  const replaced = content.replace(whole, `${open}${image}${close}`);

  if (!parses(replaced)) {
    return { content, changed: false, reason: 'replacement would not parse' };
  }

  return { content: replaced, changed: true };
}
