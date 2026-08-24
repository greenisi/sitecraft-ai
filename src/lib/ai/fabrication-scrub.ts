import { parse as babelParse } from '@babel/parser';

/**
 * Replaces invented contact details in a generated site.
 *
 * Two rounds of prompt instructions failed to stop this: three builds from the
 * same brief produced six fabrications each, whatever the prompt said. A
 * heading formula is a style choice the model can decline to make, but a phone
 * number is a slot the design demands -- header, footer, contact page, CTA --
 * and with no real value to put there the model invents one rather than leave
 * a hole.
 *
 * So this does not ask. It rewrites the files after generation, the same way
 * the booking form and dividers are injected rather than requested.
 *
 * Where the owner has supplied a real value it is used. Where they have not,
 * the text becomes an obvious prompt to fill it in -- a site that says "Add
 * your phone number" is unfinished, which is true, whereas one carrying a
 * number that reaches a stranger is wrong.
 */

export interface KnownContact {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface ScrubResult<T> {
  files: T[];
  /** One line per replacement, for the generation report. */
  changes: string[];
}

const PLACEHOLDER = {
  phone: 'Add your phone number',
  email: 'Add your email address',
  address: 'Add your address',
};

/** Digits only, so formatting differences do not read as a different number. */
function digits(value: string): string {
  return value.replace(/\D/g, '');
}

function parses(content: string): boolean {
  try {
    babelParse(content, { sourceType: 'module', plugins: ['jsx', 'typescript'], errorRecovery: false });
    return true;
  } catch {
    return false;
  }
}

/**
 * Must LOOK like a phone number a human would read, not merely be ten digits.
 *
 * A looser pattern matched any ten-digit run and rewrote Unix timestamps in
 * review data into "Add your phone number". The files still parsed, so the
 * parse-and-revert guard never fired -- syntactically valid and semantically
 * destroyed is the dangerous kind of wrong. Parens or separators are required,
 * which excludes timestamps, ids and numeric keys. Missing an unformatted
 * number is far cheaper than corrupting real data.
 */
const PHONE = /\(\d{3}\)\s*\d{3}[-.\s]\d{4}|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g;
const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const ADDRESS =
  /\b\d{1,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:Road|Rd|Street|St|Avenue|Ave|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b\.?/g;

/**
 * A value is legitimate only if the owner actually gave it to us. Anything
 * else on the page was supplied by the model.
 */
function isKnown(value: string, known: string[]): boolean {
  const candidate = value.toLowerCase().trim();
  return known.some((entry) => {
    const source = entry.toLowerCase().trim();
    if (!source) return false;
    if (source.includes(candidate) || candidate.includes(source)) return true;
    // Compare phone numbers by digits so (828) 244-1180 matches 8282441180.
    const a = digits(candidate);
    const b = digits(source);
    return a.length >= 7 && b.length >= 7 && (a.includes(b) || b.includes(a));
  });
}

export function scrubFabricatedContacts<T extends { path: string; content: string }>(
  files: T[],
  contact: KnownContact,
  extraKnownText = ''
): ScrubResult<T> {
  const changes: string[] = [];

  const knownPhones = [contact.phone, extraKnownText].filter(Boolean) as string[];
  const knownEmails = [contact.email, extraKnownText].filter(Boolean) as string[];
  const knownAddresses = [contact.address, extraKnownText].filter(Boolean) as string[];

  const out = files.map((file) => {
    if (!/\.(tsx?|jsx?)$/.test(file.path)) return file;

    const before = file.content;
    let content = before;

    content = content.replace(PHONE, (match) => {
      if (isKnown(match, knownPhones)) return match;
      // A real number the owner gave us is better than a placeholder.
      if (contact.phone) {
        changes.push(`${file.path}: replaced invented phone with the owner's number`);
        return contact.phone;
      }
      changes.push(`${file.path}: removed invented phone "${match.trim()}"`);
      return PLACEHOLDER.phone;
    });

    content = content.replace(EMAIL, (match) => {
      if (isKnown(match, knownEmails)) return match;
      if (contact.email) {
        changes.push(`${file.path}: replaced invented email with the owner's address`);
        return contact.email;
      }
      changes.push(`${file.path}: removed invented email "${match.trim()}"`);
      return PLACEHOLDER.email;
    });

    content = content.replace(ADDRESS, (match) => {
      if (isKnown(match, knownAddresses)) return match;
      if (contact.address) {
        changes.push(`${file.path}: replaced invented address with the owner's address`);
        return contact.address;
      }
      changes.push(`${file.path}: removed invented address "${match.trim()}"`);
      return PLACEHOLDER.address;
    });

    // A tel: or mailto: whose text is now a placeholder must not still dial the
    // number that was just removed.
    if (content.includes(PLACEHOLDER.phone)) {
      content = content.replace(/href=(["'])tel:[^"']*\1/g, 'href="#contact"');
    }
    if (content.includes(PLACEHOLDER.email)) {
      content = content.replace(/href=(["'])mailto:[^"']*\1/g, 'href="#contact"');
    }

    // An empty tel: or mailto: is a dead "Call us" button. Once the model
    // stopped inventing numbers it started omitting the value but keeping the
    // link, which taps and does nothing. Point those at the contact section
    // too, so the visitor still reaches a way to get in touch.
    const deadBefore = content;
    content = content
      .replace(/href=(["'])tel:\s*\1/g, 'href="#contact"')
      .replace(/href=(["'])mailto:\s*\1/g, 'href="#contact"');
    if (content !== deadBefore) {
      changes.push(`${file.path}: repointed empty tel:/mailto: link to the contact section`);
    }

    if (content === before) return file;

    // Same contract the booking injector uses: a repair that breaks the file
    // is worse than the thing it was repairing.
    if (!parses(content)) {
      changes.push(`${file.path}: left unchanged, the edit would not parse`);
      return file;
    }

    return { ...file, content };
  });

  return { files: out, changes };
}
