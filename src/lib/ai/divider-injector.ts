/**
 * Deterministic section-divider injection for generated sites.
 *
 * Generated pages should have SVG wave/skew dividers between sections whose
 * backgrounds contrast (dark hero above a white content band, white content
 * above a dark CTA). Two rounds of prompt mandates produced ZERO dividers --
 * the model ignores them -- so, exactly like the image guard, this is a
 * deterministic post-pass over the generated files that never trusts the
 * model.
 *
 * How it works:
 *   1. Find page files that render a sequence of section components.
 *   2. Resolve each component's ROOT background and classify it
 *      (dark / tinted / white / photo-backdrop).
 *   3. Between adjacent sections that cross a dark <-> light boundary,
 *      splice in a <SectionDivider /> colored like the NEXT section
 *      (the component fills with currentColor, so className carries a
 *      text-* class matching the next section's bg).
 *   4. Re-parse every modified file with @babel/parser; on any parse
 *      failure revert THAT file only.
 *
 * Fail-open: any unexpected error leaves the file untouched. This module
 * must never throw or corrupt a file -- a missing divider is cosmetic, a
 * broken page is not.
 */

import { parse as babelParse } from '@babel/parser';

interface FileLike {
  path: string;
  content: string;
}

type BgClass =
  | 'dark' // bg-black or shade 700/800/900/950 -- white-text surfaces
  | 'tinted' // shade 50/100/200 -- light gray/brand washes
  | 'white' // bg-white or no bg at all (page default)
  | 'photo' // absolute inset-0 <img> backdrop -- treated as dark
  | 'mid' // shades 300-600 -- ambiguous, never gets a divider
  | 'unknown';

interface SectionInfo {
  /** End offset of the JSX element in the page source (splice point). */
  end: number;
  /** Start offset -- used to recover the element's line indentation. */
  start: number;
  bg: BgClass;
  /** Tailwind text-* class a divider ABOVE this section should use. */
  textClass: string;
}

// --------------------------------------------------------------------------
// Background classification (regex-based, same spirit as contrast-guard)
// --------------------------------------------------------------------------

/** First non-variant, non-gradient bg-* token in a className string. */
function firstBgToken(className: string): string | null {
  for (const raw of className.split(/\s+/)) {
    // hover:bg-*, md:bg-* etc. are not the resting background.
    if (raw.includes(':')) continue;
    if (!raw.startsWith('bg-')) continue;
    if (raw.startsWith('bg-gradient')) continue;
    // bg-primary-950/90 -> bg-primary-950 (opacity doesn't change the hue class)
    return raw.replace(/\/\d+$/, '');
  }
  return null;
}

function classifyBgToken(token: string | null): BgClass {
  if (!token) return 'white'; // no bg = page default (white)
  if (token === 'bg-white') return 'white';
  if (token === 'bg-black') return 'dark';
  const shade = token.match(/^bg-[a-z]+(?:-[a-z]+)?-(\d{2,3})$/);
  if (!shade) return 'unknown'; // bg-transparent, bg-current, arbitrary values...
  const n = Number(shade[1]);
  if (n >= 700) return 'dark';
  if (n <= 200) return 'tinted';
  return 'mid';
}

/** bg-neutral-50 -> text-neutral-50; bg-black -> text-black. */
function bgTokenToTextClass(token: string): string {
  return token.replace(/^bg-/, 'text-');
}

/** Does this source have a full-bleed photo backdrop (absolute inset-0 img)? */
function hasPhotoBackdrop(source: string): boolean {
  for (const m of source.matchAll(/<img\b[^>]*?className\s*=\s*["'{`]([^"'`]*)/g)) {
    const cls = m[1];
    if (/\babsolute\b/.test(cls) && /\binset-0\b/.test(cls)) return true;
  }
  return false;
}

/**
 * Extracts the root background of a component/section source: the first
 * bg-* class on the first <section> element (or the first lowercase element
 * when there is no section). Photo backdrops with no root bg count as dark.
 */
function classifyComponentSource(source: string): { bg: BgClass; textClass: string } {
  let rootIdx = source.search(/<section\b/);
  if (rootIdx < 0) rootIdx = source.search(/<[a-z][\w]*\b/);
  if (rootIdx < 0) return { bg: 'unknown', textClass: 'text-white' };

  // className lives within the opening tag; a generous window is enough and
  // avoids writing a real JSX attribute parser here.
  const window = source.slice(rootIdx, rootIdx + 800);
  const classMatch = window.match(/className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/);
  const className = classMatch ? (classMatch[1] ?? classMatch[2] ?? classMatch[3] ?? '') : '';
  const token = firstBgToken(className);

  if (!token && hasPhotoBackdrop(source)) {
    // Photo sections are dark surfaces. A divider above one should use the
    // dominant dark overlay color so the wave blends into the gradient scrim;
    // fall back to a near-black neutral if no overlay stop is found.
    const overlay =
      source.match(/\b(?:from|via|to)-([a-z]+(?:-[a-z]+)?-(?:700|800|900|950))\b/) ??
      source.match(/\bbg-([a-z]+(?:-[a-z]+)?-(?:700|800|900|950))\b/);
    return { bg: 'photo', textClass: overlay ? `text-${overlay[1]}` : 'text-neutral-950' };
  }

  const bg = classifyBgToken(token);
  return {
    bg,
    textClass: token && bg !== 'unknown' && bg !== 'mid' ? bgTokenToTextClass(token) : 'text-white',
  };
}

/** Dividers only make sense across a dark <-> light boundary. */
function isBoundary(a: BgClass, b: BgClass): boolean {
  const darkish = (x: BgClass) => x === 'dark' || x === 'photo';
  const lightish = (x: BgClass) => x === 'white' || x === 'tinted';
  return (darkish(a) && lightish(b)) || (lightish(a) && darkish(b));
}

// --------------------------------------------------------------------------
// AST helpers (parse-only -- we splice strings by node offsets, so the
// original formatting of untouched code is always preserved byte-for-byte)
// --------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

function parseModule(content: string): any {
  return babelParse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
    errorRecovery: false,
  });
}

/** Depth-first pre-order walk over every AST node. */
function walk(node: any, visit: (n: any) => void): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (typeof node.type === 'string') visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'extra' || key === 'leadingComments' || key === 'trailingComments') {
      continue;
    }
    walk(node[key], visit);
  }
}

function jsxElementName(node: any): string | null {
  const name = node?.openingElement?.name;
  if (!name) return null;
  if (name.type === 'JSXIdentifier') return name.name;
  return null; // member expressions (Foo.Bar) -- not our section components
}

/** String value of the className attribute on a JSX element, if literal. */
function jsxClassName(node: any): string {
  const attrs = node?.openingElement?.attributes ?? [];
  for (const attr of attrs) {
    if (attr.type !== 'JSXAttribute' || attr.name?.name !== 'className') continue;
    if (attr.value?.type === 'StringLiteral') return attr.value.value;
    if (
      attr.value?.type === 'JSXExpressionContainer' &&
      attr.value.expression?.type === 'TemplateLiteral'
    ) {
      return attr.value.expression.quasis.map((q: any) => q.value.raw).join(' ');
    }
  }
  return '';
}

// --------------------------------------------------------------------------
// Component file resolution
// --------------------------------------------------------------------------

/** Minimal ./ + ../ resolution -- generated projects never need more. */
function resolveRelative(fromDir: string, source: string): string {
  const parts = fromDir.split('/').filter(Boolean);
  for (const seg of source.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts.join('/');
}

/** Maps an import source to a file in the virtual tree (or null). */
function resolveImport(
  source: string,
  pagePath: string,
  byPath: Map<string, FileLike>
): FileLike | null {
  let base: string;
  if (source.startsWith('@/')) {
    base = `src/${source.slice(2)}`;
  } else if (source.startsWith('.')) {
    const pageDir = pagePath.split('/').slice(0, -1).join('/');
    base = resolveRelative(pageDir, source);
  } else {
    return null; // bare package import -- not a project component
  }
  for (const ext of ['', '.tsx', '.ts', '.jsx', '.js']) {
    const hit = byPath.get(base + ext);
    if (hit) return hit;
  }
  return null;
}

// --------------------------------------------------------------------------
// Page processing
// --------------------------------------------------------------------------

const PAGE_PATH_RE = /(?:^|\/)page\.tsx$|[A-Z]\w*Page\.tsx$/;

/**
 * Processes one page file. Returns the new content and how many dividers
 * were inserted, or null when nothing applies (not a sequence page, no
 * boundaries, or the result failed to re-parse).
 */
function processPage(
  page: FileLike,
  byPath: Map<string, FileLike>
): { content: string; injected: number } | null {
  const ast = parseModule(page.content);

  // Default-import map (Hero -> '@/components/Hero') + last import offset,
  // so the SectionDivider import can be appended in the same style/position.
  const importMap = new Map<string, string>();
  let lastImportEnd = 0;
  let usesAliasImports = false;
  for (const stmt of ast.program.body) {
    if (stmt.type !== 'ImportDeclaration') continue;
    lastImportEnd = Math.max(lastImportEnd, stmt.end);
    const source: string = stmt.source.value;
    if (source.startsWith('@/')) usesAliasImports = true;
    for (const spec of stmt.specifiers) {
      if (spec.type === 'ImportDefaultSpecifier') importMap.set(spec.local.name, source);
    }
  }

  // Find the JSX container holding the section sequence: the element or
  // fragment with the most direct children that are either imported
  // components or inline <section>s. Pre-order walk means ties go to the
  // outermost container, which is what a page layout is.
  let best: any[] | null = null;
  let bestScore = 0;
  walk(ast.program, (node) => {
    if (node.type !== 'JSXFragment' && node.type !== 'JSXElement') return;
    const children = (node.children ?? []).filter((c: any) => c.type === 'JSXElement');
    let score = 0;
    for (const child of children) {
      const name = jsxElementName(child);
      if (!name) continue;
      if (name === 'section' || importMap.has(name)) score++;
    }
    if (score >= 2 && score > bestScore) {
      best = children;
      bestScore = score;
    }
  });
  if (!best) return null;

  // Classify each child in render order.
  const sections: SectionInfo[] = [];
  for (const child of best as any[]) {
    const name = jsxElementName(child);
    let info: { bg: BgClass; textClass: string };
    if (name === 'section') {
      // Inline section: classify from its own source slice so photo
      // backdrops nested inside it are still detected.
      info = classifyComponentSource(page.content.slice(child.start, child.end));
    } else if (name && importMap.has(name)) {
      const componentFile = resolveImport(importMap.get(name)!, page.path, byPath);
      info = componentFile
        ? classifyComponentSource(componentFile.content)
        : { bg: 'unknown', textClass: 'text-white' };
    } else {
      info = { bg: 'unknown', textClass: 'text-white' };
    }
    sections.push({ start: child.start, end: child.end, ...info });
  }

  // Plan insertions between adjacent boundary pairs. Variant alternates
  // wave -> skew -> wave per page so repeated boundaries don't look stamped.
  const insertions: Array<{ offset: number; text: string }> = [];
  for (let i = 0; i < sections.length - 1; i++) {
    const prev = sections[i];
    const next = sections[i + 1];
    if (!isBoundary(prev.bg, next.bg)) continue;
    const variant = insertions.length % 2 === 0 ? 'wave' : 'skew';
    // Match the previous element's indentation so the splice reads as
    // hand-written code in the preview's code view.
    const lineStart = page.content.lastIndexOf('\n', prev.start) + 1;
    const indentMatch = page.content.slice(lineStart, prev.start).match(/^[ \t]*/);
    const indent = indentMatch ? indentMatch[0] : '      ';
    insertions.push({
      offset: prev.end,
      text: `\n${indent}<SectionDivider variant="${variant}" className="${next.textClass}" />`,
    });
  }
  if (insertions.length === 0) return null;

  // Import statement, matching the page's existing style.
  const importSource = usesAliasImports
    ? '@/components/SectionDivider'
    : (() => {
        const pageDir = page.path.split('/').slice(0, -1).join('/');
        const depth = pageDir.split('/').filter(Boolean).length - 1; // hops up to src/
        return `${'../'.repeat(Math.max(depth, 0)) || './'}components/SectionDivider`;
      })();
  insertions.push({
    offset: lastImportEnd,
    text: `\nimport SectionDivider from '${importSource}';`,
  });

  // Splice from the highest offset down so earlier offsets stay valid.
  insertions.sort((a, b) => b.offset - a.offset);
  let content = page.content;
  for (const ins of insertions) {
    content = content.slice(0, ins.offset) + ins.text + content.slice(ins.offset);
  }

  // The whole point of doing this deterministically is never shipping broken
  // code -- verify with the real parser and revert this file on failure.
  try {
    parseModule(content);
  } catch {
    console.log(`[divider-injector] post-splice parse failed, reverting ${page.path}`);
    return null;
  }

  return { content, injected: insertions.length - 1 }; // minus the import splice
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Injects <SectionDivider /> elements between contrasting sections in every
 * page file. Returns the (possibly updated) files in the same order/shape
 * plus the number of dividers inserted. Never throws; files that already
 * contain SectionDivider are skipped so the pass is idempotent.
 */
export function injectSectionDividers<T extends FileLike>(
  files: T[]
): { files: T[]; injected: number } {
  try {
    const byPath = new Map<string, FileLike>(files.map((f) => [f.path, f]));
    let injected = 0;

    const out = files.map((file) => {
      try {
        if (!PAGE_PATH_RE.test(file.path)) return file;
        // Idempotence: an import or prior injection means this page is done.
        if (file.content.includes('SectionDivider')) return file;

        const result = processPage(file, byPath);
        if (!result) return file;

        injected += result.injected;
        console.log(`[divider-injector] injected ${result.injected} divider(s) into ${file.path}`);
        return { ...file, content: result.content } as T;
      } catch {
        // Fail-open per file: an unparseable page just keeps its content.
        return file;
      }
    });

    return { files: out, injected };
  } catch {
    return { files, injected: 0 };
  }
}

// --------------------------------------------------------------------------
// Layout runtime injection
// --------------------------------------------------------------------------

/**
 * Components that must render in the generated layout regardless of whether
 * the model remembered them: SeoSchema (JSON-LD) and DynamicsRuntime
 * (parallax / counters / scroll progress). Prompt mandates for both were
 * ignored under prompt saturation, so — like dividers — they are guaranteed
 * in code. Inserted right after the opening <body> tag (or before
 * {children} as a fallback), import added in the file's own alias style,
 * babel-verified with per-file revert. Never throws.
 */
export function injectLayoutRuntimes<T extends FileLike>(
  files: T[]
): { files: T[]; injected: string[] } {
  const injected: string[] = [];
  try {
    const layout =
      files.find((f) => f.path === 'src/app/layout.tsx') ??
      files.find((f) => f.path === 'src/components/Layout.tsx');
    if (!layout) return { files, injected };

    let content = layout.content;
    const usesAlias = /from\s+['"]@\//.test(content);
    const relPrefix = layout.path.startsWith('src/app/') ? '../components/' : './';

    // Both components are scaffolded unconditionally in assembleProject
    // (which runs after this pass), so the imports always resolve.
    for (const name of ['SeoSchema', 'DynamicsRuntime']) {
      if (new RegExp(`<${name}\\b`).test(content)) continue;

      const importPath = usesAlias ? `@/components/${name}` : `${relPrefix}${name}`;
      if (!new RegExp(`import\\s+${name}\\b`).test(content)) {
        const lastImport = content.lastIndexOf('\nimport ');
        const insertAt =
          lastImport === -1 ? 0 : content.indexOf('\n', lastImport + 1) + 1;
        content =
          content.slice(0, insertAt) +
          `import ${name} from '${importPath}';\n` +
          content.slice(insertAt);
      }

      const bodyOpen = content.match(/<body\b[^>]*>/);
      if (bodyOpen && bodyOpen.index !== undefined) {
        const at = bodyOpen.index + bodyOpen[0].length;
        content = `${content.slice(0, at)}\n        <${name} />${content.slice(at)}`;
      } else if (content.includes('{children}')) {
        content = content.replace('{children}', `<${name} />\n      {children}`);
      } else {
        continue;
      }
      injected.push(name);
    }

    if (injected.length === 0) return { files, injected };

    try {
      parseModule(content);
    } catch {
      return { files, injected: [] };
    }

    console.log(`[layout-injector] injected ${injected.join(', ')} into ${layout.path}`);
    const out = files.map((f) =>
      f.path === layout.path ? ({ ...f, content } as T) : f
    );
    return { files: out, injected };
  } catch {
    return { files, injected: [] };
  }
}
