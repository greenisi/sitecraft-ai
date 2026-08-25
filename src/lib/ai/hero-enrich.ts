import { parse as babelParse } from '@babel/parser';
import { pickHeroImage } from './image-guard';

/**
 * Gives the hero a real photograph with parallax when the model shipped a
 * gradient instead.
 *
 * The prompt already forbids gradient-only heroes and asks for full-bleed
 * photography. It does not hold: across three real builds, two heroes had no
 * image of any kind and one had an image with parallax and ken burns. Same
 * pattern as the heading formulas and the invented phone numbers, so the same
 * answer -- do it after generation rather than ask for it.
 *
 * The runtime already drives parallax for any absolutely positioned img
 * covering its section, so injecting one activates the existing motion with
 * no new runtime code. A scrim goes in with it: a photograph behind
 * light-on-dark hero text is a contrast failure without one, and the point is
 * to make the page feel alive, not unreadable.
 */

export interface HeroEnrichResult<T> {
  files: T[];
  changes: string[];
}

function parses(content: string): boolean {
  try {
    babelParse(content, { sourceType: 'module', plugins: ['jsx', 'typescript'], errorRecovery: false });
    return true;
  } catch {
    return false;
  }
}

/** Already carries imagery in some form, so leave the composition alone. */
function hasImagery(content: string): boolean {
  return (
    /<img\b/.test(content) ||
    /<Image\b/.test(content) ||
    /backgroundImage/.test(content) ||
    /bg-\[url\(/.test(content)
  );
}

export function enrichHeroWithImage<T extends { path: string; content: string }>(
  files: T[],
  industryText: string,
  seedSource: string
): HeroEnrichResult<T> {
  const changes: string[] = [];

  const out = files.map((file) => {
    if (!/\/Hero\.tsx$/.test(file.path)) return file;
    if (hasImagery(file.content)) return file;

    const before = file.content;
    const image = pickHeroImage(industryText, seedSource);

    // Anchor on the first section so the layer covers the hero itself rather
    // than an inner content wrapper.
    const openMatch = before.match(/<section\b[^>]*>/);
    if (!openMatch || openMatch.index === undefined) return file;

    let openTag = openMatch[0];
    // The layer is absolutely positioned, so the section has to establish a
    // containing block and clip the ken-burns overscale.
    if (!/className=/.test(openTag)) {
      openTag = openTag.replace(/<section\b/, '<section className="relative overflow-hidden"');
    } else {
      openTag = openTag.replace(
        /className=(["'])([^"']*)\1/,
        (_whole, quote, classes) => {
          const needed = ['relative', 'overflow-hidden'].filter(
            (cls) => !new RegExp(`(^|\\s)${cls}(\\s|$)`).test(classes)
          );
          return `className=${quote}${[classes, ...needed].join(' ').trim()}${quote}`;
        }
      );
    }

    const layer = [
      '',
      '      {/* Full-bleed hero photography. The runtime drives parallax for any',
      '          absolutely positioned image covering its section. */}',
      '      <img',
      `        src="${image}"`,
      '        alt=""',
      '        aria-hidden="true"',
      '        data-parallax',
      '        className="pointer-events-none absolute inset-0 -z-10 h-[115%] w-full scale-105 object-cover animate-kenburns"',
      '      />',
      '      {/* Scrim, so hero text keeps its contrast over the photograph. */}',
      '      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-neutral-950/70 via-neutral-950/55 to-neutral-950/75" />',
    ].join('\n');

    const content =
      before.slice(0, openMatch.index) +
      openTag +
      layer +
      before.slice(openMatch.index + openMatch[0].length);

    if (!parses(content)) {
      changes.push(`${file.path}: left unchanged, the edit would not parse`);
      return file;
    }

    changes.push(`${file.path}: added a full-bleed hero image with parallax and a contrast scrim`);
    return { ...file, content };
  });

  return { files: out, changes };
}
