import { parse as babelParse } from '@babel/parser';

/**
 * Rewrites the heading formulas that make a generated site recognisable.
 *
 * The prompt ban helped but does not hold. Across four real builds the same
 * brief produced 1, 0, 0 and 2 formula hits: instructions bend the
 * distribution, they do not enforce a rule. Contact details got a post-pass
 * for the same reason and stopped appearing entirely.
 *
 * A heading cannot simply be deleted the way an invented phone number can --
 * the section still needs a title. So each formula is replaced from a
 * per-vertical table of alternatives that name the actual work, picked by a
 * seed derived from the business so two movers do not get the same line.
 *
 * The replacements are deliberately concrete. "Ready to Transform Your Life?"
 * becomes something a competitor could not paste onto their own site
 * unchanged, which is the same test the prompt applies to headlines.
 */

export interface HeadingScrubResult<T> {
  files: T[];
  changes: string[];
}

type Slot = 'cta' | 'testimonial' | 'services' | 'why';

/** Which formula maps to which kind of section. */
const FORMULAS: Array<{ slot: Slot; pattern: RegExp }> = [
  { slot: 'cta', pattern: /^ready to .+\?$/i },
  { slot: 'cta', pattern: /^(?:get started|get in touch|let'?s get started)\b/i },
  { slot: 'testimonial', pattern: /^what our .+\b(?:say|think)\b/i },
  { slot: 'services', pattern: /^our\b.*\bservices?$/i },
  { slot: 'why', pattern: /^why choose\b/i },
];

/**
 * Per-vertical replacements. Several per slot so the same trade does not
 * produce the same heading twice, and phrased as the next concrete step or a
 * plain statement of the work rather than a question about readiness.
 */
const REPLACEMENTS: Record<string, Record<Slot, string[]>> = {
  moving: {
    cta: ['Get a binding written estimate', 'Book your move date', 'Tell us what needs moving'],
    testimonial: ['After the truck pulled away', 'From people who have moved with us', 'What moving day was actually like'],
    services: ['What we move, and how', 'Local moves and long hauls', 'Packing, loading, and the drive'],
    why: ['How we quote, and what it covers', 'What is included in every move'],
  },
  cleaning: {
    cta: ['Book your first clean', 'Get a price for your place', 'Set up a recurring visit'],
    testimonial: ['From homes we clean every week', 'What clients noticed first', 'After the first visit'],
    services: ['What gets cleaned, room by room', 'One-off cleans and recurring visits', 'Everything on the checklist'],
    why: ['What is included every visit', 'How we price, and what is covered'],
  },
  pestcontrol: {
    cta: ['Book a free inspection', 'Tell us what you are seeing', 'Get a treatment plan'],
    testimonial: ['From homes we have cleared', 'What happened after treatment', 'From customers on a protection plan'],
    services: ['What we treat, and how', 'Inspection, treatment, and follow-up', 'Pests we handle'],
    why: ['How treatment works, step by step', 'What the plan covers'],
  },
  automotive: {
    cta: ['Book your detail', 'See package pricing', 'Get your vehicle assessed'],
    testimonial: ['From cars that came through the bay', 'What owners said about the finish', 'After the first detail'],
    services: ['Packages, and what each includes', 'What we do to the paint', 'Interior, exterior, and protection'],
    why: ['How the process works', 'What each package covers'],
  },
  salon: {
    cta: ['Book an appointment', 'See the service menu', 'Find a stylist'],
    testimonial: ['From the chair', 'What clients said afterwards', 'From regulars'],
    services: ['The menu, with prices', 'Cuts, colour, and treatments', 'What we do, and what it costs'],
    why: ['What a first visit is like', 'How booking works'],
  },
  landscaping: {
    cta: ['Get a quote for your yard', 'Book a walkthrough', 'Start with a free soil test'],
    testimonial: ['From yards we look after', 'What the neighbours noticed', 'After the first season'],
    services: ['What we do outside', 'Design, build, and upkeep', 'Seasonal work, month by month'],
    why: ['How we work through a season', 'What maintenance includes'],
  },
  construction: {
    cta: ['Get a written quote', 'Book a site visit', 'Tell us about the job'],
    testimonial: ['From jobs we have finished', 'What the crew left behind', 'After the last inspection'],
    services: ['What we build and repair', 'The work, start to finish', 'Jobs we take on'],
    why: ['How a job runs, start to finish', 'What the quote covers'],
  },
  restaurant: {
    cta: ['Reserve a table', 'See the menu', 'Book a sitting'],
    testimonial: ['From the dining room', 'What guests came back for', 'After a night with us'],
    services: ['On the menu', 'What we cook, and why', 'The kitchen, and the list'],
    why: ['How an evening runs', 'What is on, and when'],
  },
  healthcare: {
    cta: ['Book an appointment', 'Request a consultation', 'Speak to the practice'],
    testimonial: ['From patients we look after', 'After treatment', 'What patients said'],
    services: ['Treatments we provide', 'What we treat, and how', 'Care we offer'],
    why: ['What a first visit involves', 'How treatment is planned'],
  },
  default: {
    cta: ['Start the conversation', 'Ask for a quote', 'Tell us what you need'],
    testimonial: ['From people we have worked with', 'What clients said afterwards', 'After the work was done'],
    services: ['What we do', 'The work we take on', 'How we can help'],
    why: ['How we work', 'What is included'],
  },
};

/** Stable per-business seed, so a rebuild does not reshuffle the copy. */
function seedFrom(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = Math.imul(hash, 31) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function parses(content: string): boolean {
  try {
    babelParse(content, { sourceType: 'module', plugins: ['jsx', 'typescript'], errorRecovery: false });
    return true;
  } catch {
    return false;
  }
}

export function scrubFormulaicHeadings<T extends { path: string; content: string }>(
  files: T[],
  industry: string,
  seedSource: string
): HeadingScrubResult<T> {
  const table = REPLACEMENTS[industry] || REPLACEMENTS.default;
  const seed = seedFrom(seedSource || industry);
  const changes: string[] = [];
  // Tracks how many of each slot have been replaced, so a site with two
  // closing CTAs does not get the same replacement twice.
  const used: Record<string, number> = {};

  const out = files.map((file) => {
    if (!/\.(tsx?|jsx?)$/.test(file.path)) return file;

    const before = file.content;
    // Only the text between heading tags is touched. Interpolated headings
    // are data-driven and left alone.
    const content = before.replace(
      /(<h[1-4][^>]*>)([^<>{}]+)(<\/h[1-4]>)/gi,
      (whole, open: string, text: string, close: string) => {
        const trimmed = text.trim();
        if (!trimmed) return whole;

        const match = FORMULAS.find((f) => f.pattern.test(trimmed));
        if (!match) return whole;

        const options = table[match.slot];
        const index = (seed + (used[match.slot] || 0)) % options.length;
        used[match.slot] = (used[match.slot] || 0) + 1;
        const replacement = options[index];

        changes.push(`${file.path}: "${trimmed.slice(0, 46)}" -> "${replacement}"`);
        return `${open}${replacement}${close}`;
      }
    );

    if (content === before) return file;

    if (!parses(content)) {
      changes.push(`${file.path}: left unchanged, the edit would not parse`);
      return file;
    }

    return { ...file, content };
  });

  return { files: out, changes };
}
