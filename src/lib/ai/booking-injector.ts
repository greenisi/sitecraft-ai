/**
 * Guarantees every generated site has a working booking form.
 *
 * The bookings backend has been live since Phase 3 — slot conflicts, owner
 * Confirm/Decline emails, customer acknowledgement — but nothing put a front
 * end in front of it. Asking the model to build one has the same problem as
 * asking for dividers: it lands sometimes, differently each time, and wired to
 * nothing. So this is a post-pass, like the divider and layout injectors:
 * BookingForm is scaffolded unconditionally and inserted into the contact page
 * (or, failing that, the home page) whether or not the model thought of it.
 *
 * Babel-verified with per-file revert, and never throws — a site that cannot
 * take the injection keeps exactly the content the model produced.
 */
import { parse as babelParse } from '@babel/parser';

interface FileLike {
  path: string;
  content: string;
}

function parseModule(content: string) {
  return babelParse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: false,
  });
}

/** Pages that should carry a booking form, best candidate first. */
function findTarget<T extends FileLike>(files: T[]): T | undefined {
  const pages = files.filter((file) => /^src\/app\/.*page\.tsx$/.test(file.path));
  const byPreference = [
    /\/(contact|book|booking|appointments?|reservations?|schedule)\//,
    /\/(services|menu)\//,
  ];
  for (const pattern of byPreference) {
    const match = pages.find((page) => pattern.test(page.path));
    if (match) return match;
  }
  return pages.find((page) => page.path === 'src/app/page.tsx');
}

/**
 * Inserts `<BookingForm />` before the closing tag of the page's outermost
 * JSX element, plus the import. Idempotent: a page that already renders one is
 * left alone, so a model that DID build the section keeps its own placement.
 */
export function injectBookingForm<T extends FileLike>(
  files: T[]
): { files: T[]; injectedInto: string | null } {
  try {
    if (files.some((file) => /<BookingForm\b/.test(file.content))) {
      return { files, injectedInto: null };
    }

    const target = findTarget(files);
    if (!target) return { files, injectedInto: null };

    let content = target.content;
    const usesAlias = /from\s+['"]@\//.test(content);
    const importPath = usesAlias ? '@/components/BookingForm' : '../../components/BookingForm';

    if (!/import\s+BookingForm\b/.test(content)) {
      const lastImport = content.lastIndexOf('\nimport ');
      const insertAt = lastImport === -1 ? 0 : content.indexOf('\n', lastImport + 1) + 1;
      content =
        content.slice(0, insertAt) +
        `import BookingForm from '${importPath}';\n` +
        content.slice(insertAt);
    }

    // Place it just before the last closing tag of the returned tree, which is
    // the end of the page body — above the footer if the page renders one.
    const closing = content.lastIndexOf('</');
    if (closing === -1) return { files, injectedInto: null };
    const lineStart = content.lastIndexOf('\n', closing) + 1;
    const indent = content.slice(lineStart, closing).match(/^\s*/)?.[0] ?? '      ';
    content = `${content.slice(0, lineStart)}${indent}<BookingForm />\n${content.slice(lineStart)}`;

    try {
      parseModule(content);
    } catch {
      return { files, injectedInto: null };
    }

    console.log(`[booking-injector] injected BookingForm into ${target.path}`);
    const out = files.map((file) =>
      file.path === target.path ? ({ ...file, content } as T) : file
    );
    return { files: out, injectedInto: target.path };
  } catch {
    return { files, injectedInto: null };
  }
}
