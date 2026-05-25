import { NextRequest, NextResponse } from 'next/server';
import { parse as babelParse } from '@babel/parser';
import { createAdminClient } from '@/lib/supabase/admin';
import { LUCIDE_ICON_PATHS } from '@/lib/preview/lucide-icons';

export const runtime = 'nodejs';

/**
 * Validates that a chunk of cleaned component code parses as valid TS+JSX.
 * The cleaned code is wrapped in an IIFE in the final output, so we test it
 * the same way to catch the exact failure mode Babel.transform would hit.
 */
function isParseable(cleanedCode: string): boolean {
  try {
    babelParse(`(function(){${cleanedCode}})();`, {
      sourceType: 'script',
      plugins: ['typescript', 'jsx'],
      errorRecovery: false,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds an invisible stub component. Used when a generated component has a
 * syntax error so the rest of the preview can still render — without showing
 * any visible error to the end user. The chat UI is notified separately via
 * the sitecraft:broken-components postMessage so it can offer a regenerate
 * button.
 */
function buildStubComponent(name: string): string {
  return `
// --- ${name} (silent stub: original had a syntax error) ---
const ${name} = function ${name}() { return null; };
`;
}

/**
 * GET /api/preview/render?projectId=xxx&page=/about
 *
 * Server-side compiles the generated React/TSX files into a single
 * self-contained HTML page that can be loaded in an iframe.
 *
 * Supports multi-page preview: the `page` query parameter selects which
 * page to render (default: `/`). Link clicks inside the iframe are
 * intercepted and sent to the parent frame via postMessage.
 */

/**
 * Replace smart/curly quotes with ASCII equivalents to prevent
 * "Unterminated string constant" errors in JSX transpilation.
 */
function sanitizeSmartQuotes(content: string): string {
  return content
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2013]/g, '-')
    .replace(/[\u2014]/g, '--')
    .replace(/[\u2026]/g, '...');
}

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');
  const page = request.nextUrl.searchParams.get('page') || '/';
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get latest completed version
  const { data: version } = await supabase
    .from('generation_versions')
    .select('id')
    .eq('project_id', projectId)
    .eq('status', 'complete')
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (!version) {
    return new Response('<html><body><p>No generated version found</p></body></html>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Get all files for this version
  const { data: files } = await supabase
    .from('generated_files')
    .select('file_path, content')
    .eq('version_id', version.id)
    .order('file_path');

  if (!files || files.length === 0) {
    return new Response('<html><body><p>No files found</p></body></html>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Fallback design system: if the assembly stage didn't persist
  // src/lib/design-system.json (e.g. function timed out before scaffold
  // yields), synthesize one from the project's stored branding so the
  // preview's Tailwind CDN still gets the right primary/accent colors.
  // Without this, classes like text-primary-600 silently resolve to nothing
  // and the site renders grayscale.
  const hasDesignSystem = files.some((f) => f.file_path === 'src/lib/design-system.json');
  if (!hasDesignSystem) {
    const { data: project } = await supabase
      .from('projects')
      .select('generation_config')
      .eq('id', projectId)
      .single();
    const branding = (project?.generation_config as Record<string, unknown> | null)?.branding as
      | { primaryColor?: string; secondaryColor?: string; accentColor?: string }
      | undefined;
    if (branding?.primaryColor || branding?.secondaryColor || branding?.accentColor) {
      const fallback = synthesizeDesignSystemFromBranding(
        branding.primaryColor ?? '#15803d',
        branding.secondaryColor ?? '#78716c',
        branding.accentColor ?? '#eab308'
      );
      files.push({
        file_path: 'src/lib/design-system.json',
        content: JSON.stringify(fallback),
      });
    }
  }

  // Derive available pages from file structure
  const availablePages = deriveAvailablePages(files);

  // Fetch live data so generated components have real reviews/services/etc.
  // instead of empty-array stubs. Only reviews are wired today; other tables
  // can be added the same way as we hook them up.
  const [{ data: reviewsRaw }, { data: gpc }, { data: businessInfo }] = await Promise.all([
    supabase
      .from('reviews')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('posted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('google_places_connections')
      .select('rating, user_ratings_total, attribution_html, google_url, business_name')
      .eq('project_id', projectId)
      .maybeSingle(),
    supabase
      .from('business_info')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle(),
  ]);

  const liveData = {
    reviews: reviewsRaw ?? [],
    googlePlaces: gpc ?? null,
    businessInfo: businessInfo ?? null,
  };

  // Build the preview HTML for the requested page
  const html = buildPreviewHTML(files, page, availablePages, liveData);

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}

interface FileRecord {
  file_path: string;
  content: string;
}

/**
 * Convert a hex color to HSL (h: 0-360, s/l: 0-100).
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lNorm - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate a 50-950 Tailwind-style scale from a base hex color.
 * The base color anchors to shade 500; lighter shades increase L, darker shades decrease L.
 */
function generateScale(baseHex: string): Record<string, string> {
  const { h, s } = hexToHsl(baseHex);
  // Lightness targets per shade — matches Tailwind's typical color ramps.
  const shadeLightness: Record<string, number> = {
    '50': 96, '100': 92, '200': 84, '300': 74, '400': 60,
    '500': 48, '600': 40, '700': 32, '800': 24, '900': 16, '950': 10,
  };
  const scale: Record<string, string> = {};
  for (const [shade, l] of Object.entries(shadeLightness)) {
    // Reduce saturation slightly at the extremes for a more natural ramp.
    const adjustedS = parseInt(shade) <= 100 || parseInt(shade) >= 900
      ? Math.max(15, s * 0.6)
      : s;
    scale[shade] = hslToHex(h, adjustedS, l);
  }
  return scale;
}

/**
 * Build a minimal design-system JSON from the three brand hex colors.
 * Used as a fallback when the assembly stage didn't persist the real one.
 */
function synthesizeDesignSystemFromBranding(
  primaryHex: string,
  secondaryHex: string,
  accentHex: string
): Record<string, unknown> {
  return {
    colors: {
      primary: generateScale(primaryHex),
      secondary: generateScale(secondaryHex),
      accent: generateScale(accentHex),
      neutral: generateScale('#78716c'),
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
    },
  };
}

/**
 * Derive available pages from the file structure.
 * Scans for page.tsx files inside src/app subdirectories.
 */
function deriveAvailablePages(files: FileRecord[]): Array<{ path: string; title: string }> {
  const pages: Array<{ path: string; title: string }> = [];

  for (const f of files) {
    const match = f.file_path.match(/^src\/app\/(.*?)page\.tsx$/);
    if (match) {
      const pathSegment = match[1]; // '' for root, 'about/' for about, etc.
      const pagePath = pathSegment ? `/${pathSegment.replace(/\/$/, '')}` : '/';
      const title = pagePath === '/'
        ? 'Home'
        : pagePath.split('/').filter(Boolean).pop()!.replace(/^\[|\]$/g, '').replace(/([A-Z])/g, ' $1').trim().replace(/(^|\s)\S/g, (t) => t.toUpperCase());
      pages.push({ path: pagePath, title });
    }
  }

  // Sort: Home first, then alphabetically
  pages.sort((a, b) => {
    if (a.path === '/') return -1;
    if (b.path === '/') return 1;
    return a.path.localeCompare(b.path);
  });

  return pages;
}

/**
 * Resolve the page file path from a URL path.
 * / â src/app/page.tsx
 * /about â src/app/about/page.tsx
 */
function resolvePageFilePath(pagePath: string): string {
  if (pagePath === '/') return 'src/app/page.tsx';
  const clean = pagePath.replace(/^\/|\/$/g, '');
  return `src/app/${clean}/page.tsx`;
}

interface LiveData {
  reviews: unknown[];
  googlePlaces: Record<string, unknown> | null;
  businessInfo: Record<string, unknown> | null;
}

function buildPreviewHTML(
  files: FileRecord[],
  page: string,
  availablePages: Array<{ path: string; title: string }>,
  liveData: LiveData = { reviews: [], googlePlaces: null, businessInfo: null }
): string {
  // Sanitize smart quotes in all file contents to prevent transpilation errors
  for (const f of files) {
    f.content = sanitizeSmartQuotes(f.content);
  }

  // Extract globals.css
  const globalsCss = files.find((f) => f.file_path === 'src/app/globals.css')?.content || '';

  // Clean CSS â remove @tailwind directives (CDN handles it), @import, @layer blocks
  // The Tailwind CDN doesn't support @apply or @layer, so strip those blocks entirely
  const cleanedCss = stripLayerBlocks(
    globalsCss
      .replace(/@tailwind\s+[^;]+;/g, '')
      .replace(/@import\s+[^;]+;/g, '')
  ).trim();

  // Resolve the page file for the requested path
  const pageFilePath = resolvePageFilePath(page);
  const pageContent = files.find((f) => f.file_path === pageFilePath)?.content
    || files.find((f) => f.file_path === 'src/app/page.tsx')?.content
    || '';

  // Get layout.tsx content (if exists)
  const layoutContent = files.find((f) => f.file_path === 'src/app/layout.tsx')?.content || '';

  // Get all component files
  const componentFiles = files.filter(
    (f) => f.file_path.startsWith('src/components/') && f.file_path.endsWith('.tsx')
  );

  // Check for truncated files
  const validComponents: FileRecord[] = [];
  const truncatedNames = new Set<string>();

  for (const f of componentFiles) {
    const trimmed = f.content.trimEnd();
    const lastLine = trimmed.split('\n').pop()?.trim() || '';
    const validEndings = ['}', ')', ';', '/>', 'export default'];
    const isValid = validEndings.some((e) => lastLine.endsWith(e) || lastLine.startsWith(e));

    if (isValid) {
      validComponents.push(f);
    } else {
      const match = f.file_path.match(/\/([^/]+)\.tsx?$/);
      if (match) truncatedNames.add(match[1]);
    }
  }

  // Get available component names
  const availableNames = new Set(
    validComponents.map((f) => {
      const match = f.file_path.match(/\/([^/]+)\.tsx$/);
      return match ? match[1] : '';
    }).filter(Boolean)
  );

  // Process component source code. Validate each component's cleaned output
  // independently — if one component has a syntax error, stub it so the rest
  // of the preview still renders instead of breaking the whole page.
  const brokenComponents: string[] = [];
  const componentScripts = validComponents
    .map((f) => {
      const name = f.file_path.match(/\/([^/]+)\.tsx$/)?.[1];
      if (!name) return '';

      const cleaned = cleanComponentCode(f.content);

      if (!isParseable(cleaned)) {
        brokenComponents.push(name);
        return buildStubComponent(name);
      }

      return `
// --- ${name} ---
const ${name}_module = (function() {
  ${cleaned}
})();
const ${name} = ${name}_module;
`;
    })
    .join('\n');

  // Process page.tsx â build the Page component
  let pageCode = processPageCode(pageContent, availableNames, truncatedNames);
  if (!isParseable(pageCode)) {
    brokenComponents.push('page.tsx');
    // Silent fallback — render an empty page rather than showing an error to
    // the end user. The chat UI is notified separately via postMessage.
    pageCode = `function Page() { return null; }`;
  }

  // Process layout.tsx â if it exists, build a Layout wrapper
  let layoutCode = '';
  if (layoutContent) {
    const candidate = processLayoutCode(layoutContent, availableNames, truncatedNames);
    if (isParseable(candidate)) {
      layoutCode = candidate;
    } else {
      brokenComponents.push('layout.tsx');
    }
  }

  // Fallback: if no layout.tsx was generated but Navbar and/or Footer components
  // exist, synthesize a Layout wrapper so the navbar and footer always appear.
  const hasNavbar = availableNames.has('Navbar') && !truncatedNames.has('Navbar');
  const hasFooter = availableNames.has('Footer') && !truncatedNames.has('Footer');

  if (!layoutCode && (hasNavbar || hasFooter)) {
    const navbarEl = hasNavbar ? 'React.createElement(Navbar, null)' : 'null';
    const footerEl = hasFooter ? 'React.createElement(Footer, null)' : 'null';
    layoutCode = `
      function Layout(props) {
        return React.createElement('div', { className: 'fallback-layout-wrapper min-h-screen flex flex-col' },
          ${navbarEl},
          React.createElement('main', { className: 'flex-1 pt-16' }, props.children),
          ${footerEl}
        );
      }
    `;
  }

  // Build the final App component that composes Layout + Page
  let appCode: string;
  if (layoutCode) {
    appCode = `
${layoutCode}

${pageCode}

function App() {
  return React.createElement(Layout, null, React.createElement(Page, null));
}
`;
  } else {
    // No layout â just rename Page to App
    appCode = pageCode.replace(/function Page\b/, 'function App');
  }

  // Fix unescaped apostrophes
  appCode = fixUnescapedApostrophes(appCode);

  // Discover all lucide icon names from import statements in original code
  // so we can create shims for any icons not in the static list
  const allOriginalCode = files
    .filter((f) => f.file_path.endsWith('.tsx'))
    .map((f) => f.content)
    .join('\n');
  const lucideImports = [...allOriginalCode.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g)];
  const allIconNames = new Set<string>();
  for (const m of lucideImports) {
    const names = m[1].split(',').map((n) => n.trim()).filter(Boolean);
    for (const name of names) {
      allIconNames.add(name);
    }
  }
  // Get design system for tailwind config
  const designSystem = files.find((f) => f.file_path === 'src/lib/design-system.json')?.content;

  // Extract color configuration from tailwind config
  let tailwindExtendScript = '';
  if (designSystem) {
    try {
      const ds = JSON.parse(designSystem);
      tailwindExtendScript = `
tailwind.config = {
  theme: {
    extend: {
      colors: ${JSON.stringify(ds.colors || {})},
      fontFamily: {
        heading: [${JSON.stringify(ds.typography?.headingFont || 'Space Grotesk')}, 'sans-serif'],
        body: [${JSON.stringify(ds.typography?.bodyFont || 'Inter')}, 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'bounce-in': 'bounceIn 0.6s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
};
`;
    } catch {
      // Invalid design system JSON, skip
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=Lora:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body { margin: 0; padding: 0; }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    #__loading { font-family: system-ui, sans-serif; }
    #__loading .bar { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; }
    ${cleanedCss}
  
      /* Fix transparent navbars: ensure they are visible on light backgrounds */
      nav.bg-transparent,
      nav[class*="bg-transparent"] {
        background-color: white !important;
        border-bottom: 1px solid #e5e7eb !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
      }
      nav.bg-transparent a[class*="text-white"],
      nav.bg-transparent [class*="text-white"],
      nav[class*="bg-transparent"] a[class*="text-white"],
      nav[class*="bg-transparent"] [class*="text-white"] {
        color: #111827 !important;
      }
      nav.bg-transparent a[class*="text-white"]:hover,
      nav[class*="bg-transparent"] a[class*="text-white"]:hover {
        color: #7c3aed !important;
      }
      </style>
</head>
<body>
  <div id="root"></div>
  <div id="__loading">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid #f0f0f0">
      <div class="bar" style="height:20px;width:120px"></div>
      <div style="display:flex;gap:16px;align-items:center">
        <div class="bar" style="height:14px;width:50px"></div>
        <div class="bar" style="height:14px;width:50px"></div>
        <div class="bar" style="height:14px;width:50px"></div>
        <div class="bar" style="height:32px;width:90px;border-radius:6px"></div>
      </div>
    </div>
    <div style="padding:64px 24px;text-align:center">
      <div class="bar" style="height:12px;width:120px;margin:0 auto 16px"></div>
      <div class="bar" style="height:36px;width:70%;margin:0 auto 8px;max-width:480px"></div>
      <div class="bar" style="height:36px;width:50%;margin:0 auto 16px;max-width:340px"></div>
      <div class="bar" style="height:14px;width:60%;margin:0 auto 8px;max-width:400px"></div>
      <div class="bar" style="height:14px;width:45%;margin:0 auto 24px;max-width:300px"></div>
      <div style="display:flex;gap:12px;justify-content:center">
        <div class="bar" style="height:40px;width:120px;border-radius:6px"></div>
        <div class="bar" style="height:40px;width:120px;border-radius:6px"></div>
      </div>
    </div>
    <div style="padding:40px 24px;border-top:1px solid #f5f5f5">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;max-width:700px;margin:0 auto">
        <div style="padding:16px"><div class="bar" style="height:40px;width:40px;border-radius:8px;margin-bottom:12px"></div><div class="bar" style="height:16px;width:70%;margin-bottom:8px"></div><div class="bar" style="height:12px;width:100%;margin-bottom:4px"></div><div class="bar" style="height:12px;width:80%"></div></div>
        <div style="padding:16px"><div class="bar" style="height:40px;width:40px;border-radius:8px;margin-bottom:12px"></div><div class="bar" style="height:16px;width:60%;margin-bottom:8px"></div><div class="bar" style="height:12px;width:100%;margin-bottom:4px"></div><div class="bar" style="height:12px;width:75%"></div></div>
        <div style="padding:16px"><div class="bar" style="height:40px;width:40px;border-radius:8px;margin-bottom:12px"></div><div class="bar" style="height:16px;width:65%;margin-bottom:8px"></div><div class="bar" style="height:12px;width:100%;margin-bottom:4px"></div><div class="bar" style="height:12px;width:85%"></div></div>
      </div>
    </div>
  </div>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script>
${tailwindExtendScript}
  <\/script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>

  <script id="app-source" type="text/plain">
    // React hooks destructured for component-scope access
    const { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer, useLayoutEffect, useId } = React;
    const Fragment = React.Fragment;
    const createContext = React.createContext;
    const forwardRef = React.forwardRef;
    const memo = React.memo;
    const createElement = React.createElement;
    const Children = React.Children;
    const cloneElement = React.cloneElement;
    const isValidElement = React.isValidElement;
    const createRef = React.createRef;

    // Shims for Next.js components
    const Image = ({ src, alt, width, height, fill, className, priority, sizes, ...rest }: any) => {
      const style = fill
        ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
        : {};
      return React.createElement('img', {
        src: src || '',
        alt: alt || '',
        width: fill ? undefined : width,
        height: fill ? undefined : height,
        className,
        style,
        loading: priority ? 'eager' : 'lazy',
        ...rest,
      });
    };

    const Link = ({ href, children, className, ...props }: any) => {
      return React.createElement('a', { href, className, ...props }, children);
    };

    // Lucide icon SVG paths for rendering real icons
    const __ICON_PATHS__: Record<string, string[]> = ${JSON.stringify(
      // Only include icon paths that are actually used
      Object.fromEntries(
        [...allIconNames]
          .filter((name) => LUCIDE_ICON_PATHS[name])
          .map((name) => [name, LUCIDE_ICON_PATHS[name]])
      )
    )};

    // Lucide icon renderer â creates actual SVG elements
    const createIcon = (name: string) => {
      return ({ className, size, ...props }: any) => {
        const paths = __ICON_PATHS__[name];
        if (!paths) {
          // Fallback: render empty inline-block square for unknown icons
          return React.createElement('span', {
            className: className,
            'aria-hidden': 'true',
            style: { display: 'inline-block', width: size || '1em', height: size || '1em' },
            ...props,
          });
        }
        return React.createElement('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: size || 24,
          height: size || 24,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          className: className,
          'aria-hidden': 'true',
          ...props,
          dangerouslySetInnerHTML: { __html: paths.join('') },
        });
      };
    };

    // Icon shims for all lucide icons used in generated code
${[...allIconNames].map((name) => `    const ${name} = createIcon('${name}');`).join('\n')}

    // clsx / cn / twMerge utility shims
    const clsx = (...args: any[]) => args.flat().filter(Boolean).join(' ');
    const cn = clsx;
    const twMerge = (...args: any[]) => args.flat().filter(Boolean).join(' ');
    const twJoin = (...args: any[]) => args.flat().filter(Boolean).join(' ');

    
        // === Preview Safety Shims ===
        // Provide fallback empty values for commonly referenced variables
        // that exist in the full Next.js app but not in this preview sandbox
        
        // Data array fallbacks
        var __safeArray = [];
        var __safeObj = {};
        var __noopFn = function() { return null; };
        
        if (typeof products === 'undefined') var products = [];
        if (typeof services === 'undefined') var services = [];
        if (typeof properties === 'undefined') var properties = [];
        // Live data injected from the database. Falls back to [] / null
        // when the project has nothing yet. Generated components consume
        // these via the unprefixed globals (testimonials/reviews).
        var __liveData = ${JSON.stringify(liveData)};
        if (typeof testimonials === 'undefined') var testimonials = __liveData.reviews;
        if (typeof reviews === 'undefined') var reviews = __liveData.reviews;
        if (typeof googlePlaces === 'undefined') var googlePlaces = __liveData.googlePlaces;
        if (typeof googleAttribution === 'undefined') var googleAttribution = (__liveData.googlePlaces && __liveData.googlePlaces.attribution_html) || '';
        if (typeof businessInfo === 'undefined') var businessInfo = __liveData.businessInfo;
        if (typeof categories === 'undefined') var categories = [];
        if (typeof posts === 'undefined') var posts = [];
        if (typeof items === 'undefined') var items = [];
        if (typeof data === 'undefined') var data = {};
        if (typeof featuredProducts === 'undefined') var featuredProducts = [];
        if (typeof featuredServices === 'undefined') var featuredServices = [];
        if (typeof menuItems === 'undefined') var menuItems = [];
        if (typeof galleryImages === 'undefined') var galleryImages = [];
        if (typeof teamMembers === 'undefined') var teamMembers = [];
        if (typeof pricingPlans === 'undefined') var pricingPlans = [];
        if (typeof faqs === 'undefined') var faqs = [];
        if (typeof features === 'undefined') var features = [];
        if (typeof blogPosts === 'undefined') var blogPosts = [];
        
        // Safe Zustand/store hook shims
        var __safeStore = function(selector) {
          if (typeof selector === 'function') {
            try { return selector({}); } catch(e) { return undefined; }
          }
          return {};
        };
        __safeStore.getState = function() { return {}; };
        __safeStore.setState = function() {};
        __safeStore.subscribe = function() { return function() {}; };
        
        if (typeof useCartStore === 'undefined') var useCartStore = __safeStore;
        if (typeof useStore === 'undefined') var useStore = __safeStore;
        if (typeof useCart === 'undefined') var useCart = function() { return { items: [], addItem: __noopFn, removeItem: __noopFn, cartCount: 0, total: 0 }; };
        if (typeof useProductStore === 'undefined') var useProductStore = __safeStore;
        if (typeof useAuthStore === 'undefined') var useAuthStore = __safeStore;
        if (typeof useUIStore === 'undefined') var useUIStore = __safeStore;
        
        // Next.js navigation shims
        if (typeof useRouter === 'undefined') var useRouter = function() { return { push: __noopFn, replace: __noopFn, back: __noopFn, forward: __noopFn, refresh: __noopFn, prefetch: __noopFn, pathname: '/' }; };
        if (typeof usePathname === 'undefined') var usePathname = function() { return '/'; };
        if (typeof useSearchParams === 'undefined') var useSearchParams = function() { return new URLSearchParams(); };
        if (typeof useParams === 'undefined') var useParams = function() { return {}; };
        if (typeof notFound === 'undefined') var notFound = __noopFn;
        if (typeof redirect === 'undefined') var redirect = __noopFn;
        
        // Next.js headers shims
        if (typeof cookies === 'undefined') var cookies = function() { return { get: __noopFn, set: __noopFn }; };
        if (typeof headers === 'undefined') var headers = function() { return new Headers(); };
        
        // Form/action shims
        if (typeof useFormState === 'undefined') var useFormState = function(fn, init) { return [init, __noopFn]; };
        if (typeof useFormStatus === 'undefined') var useFormStatus = function() { return { pending: false }; };
        
        // === End Preview Safety Shims ===

        ${componentScripts}

    ${appCode}

    // Error boundary for React errors
    class ErrorBoundary extends React.Component<any, any> {
      constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
      }
      render() {
        if (this.state.hasError) {
          return React.createElement('div', {
            style: { padding: '24px', fontFamily: 'monospace', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', margin: '16px', whiteSpace: 'pre-wrap', fontSize: '13px' }
          }, 'Preview Error:\\n' + String(this.state.error?.message || this.state.error));
        }
        return this.props.children;
      }
    }

    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(React.createElement(ErrorBoundary, null, React.createElement(App)));
      // Fix transparent navbars after React render
      setTimeout(function(){var n=document.querySelector('nav');if(n&&(n.className||'').indexOf('bg-transparent')>-1){n.style.setProperty('background-color','white','important');n.style.setProperty('border-bottom','1px solid #e5e7eb','important');var a=n.querySelectorAll('a,span');for(var i=0;i<a.length;i++){var c=a[i].getAttribute('class')||'';if(c.indexOf('text-white')>-1&&c.indexOf('bg-')===-1)a[i].style.setProperty('color','#111827','important');}}},100);
  <\/script>

  <script>
    // Manually compile and execute the TSX code using Babel standalone
    // This approach lets us catch compilation errors with try/catch
    (function() {
      var sourceEl = document.getElementById('app-source');
      var rootEl = document.getElementById('root');
      var code = sourceEl ? sourceEl.textContent : '';

      try {
        var result = Babel.transform(code, {
          presets: ['react', 'typescript'],
          filename: 'app.tsx',
        });

        // Execute the compiled code with React globals available
        // Hooks are already destructured inside the source code itself
        var fn = new Function('React', 'ReactDOM', result.code);
        fn(React, ReactDOM);

        // Hide the loading skeleton now that React has rendered
        var loadingEl = document.getElementById('__loading');
        if (loadingEl) loadingEl.style.display = 'none';
      } catch (err) {
        console.error('Preview compilation/execution error:', err);
        var loadingEl2 = document.getElementById('__loading');
        if (loadingEl2) loadingEl2.style.display = 'none';
        rootEl.innerHTML = '<div style="padding:24px;font-family:monospace;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin:16px;white-space:pre-wrap;font-size:13px;max-height:80vh;overflow:auto;"><strong>Preview Error:</strong>\\n\\n' + String(err.message || err) + '</div>';
      }
    })();
  <\/script>

  <script>
    // Link interception for multi-page navigation
    // Intercept clicks on internal links and notify the parent frame
    document.addEventListener('click', function(e) {
      var link = e.target.closest ? e.target.closest('a') : null;
      if (!link) return;
      var href = link.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault();
        window.parent.postMessage({ type: 'sitecraft:navigate', page: href }, '*');
      }
    });

    // Also notify parent of available pages
    window.parent.postMessage({
      type: 'sitecraft:pages',
      pages: ${JSON.stringify(availablePages)}
    }, '*');

    // Notify parent of any components that failed parsing so the chat UI
    // can offer a regenerate button instead of a cryptic preview error.
    window.parent.postMessage({
      type: 'sitecraft:broken-components',
      components: ${JSON.stringify(brokenComponents)}
    }, '*');
  <\/script>

  <!-- Google Places attribution: required by ToS whenever Google reviews are displayed.
       Renders only if a Google connection exists for this project. -->
  ${
    liveData.googlePlaces
      ? `<div id="__google_attr" style="position:fixed;right:8px;bottom:8px;z-index:99999;background:rgba(255,255,255,0.96);color:#5f6368;font:11px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:6px 10px;border-radius:14px;border:1px solid #e0e0e0;box-shadow:0 1px 3px rgba(0,0,0,0.08);max-width:260px;pointer-events:auto">
  <span style="display:inline-flex;align-items:center;gap:6px">
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84c.87-2.6 3.3-4.5 6.16-4.5z"/></svg>
    Reviews from Google
  </span>
  ${liveData.googlePlaces.attribution_html ? `<div style="margin-top:2px;opacity:0.85">${liveData.googlePlaces.attribution_html}</div>` : ''}
</div>`
      : ''
  }
</body>
</html>`;
}

/**
 * Process page.tsx code: strip imports, remove export, rename to Page.
 */
function processPageCode(
  pageContent: string,
  availableNames: Set<string>,
  truncatedNames: Set<string>
): string {
  let code = pageContent;

  // Find missing components BEFORE removing imports
  const pageImports = [...code.matchAll(/import\s+(\w+)\s+from\s+['"]@\/components\/(\w+)['"];?\s*\n?/g)];
  const missingComponents = new Set<string>();

  for (const m of pageImports) {
    const importName = m[1];
    const fileName = m[2];
    if (!availableNames.has(fileName) || truncatedNames.has(fileName)) {
      missingComponents.add(importName);
    }
  }

  // Remove 'use client'
  code = code.replace(/['"]use client['"];?\s*\n?/g, '');

  // Remove all import statements
  code = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*\n?/g, '');
  code = code.replace(/import\s+['"][^'"]+['"];?\s*\n?/g, '');

  // Remove JSX for missing/truncated components
  for (const name of missingComponents) {
    code = code.replace(new RegExp(`\\s*<${name}\\s*/>`, 'g'), '');
    code = code.replace(new RegExp(`\\s*<${name}[^>]*>`, 'g'), '');
    code = code.replace(new RegExp(`\\s*</${name}>`, 'g'), '');
  }

  // Rename the default export function to Page
  code = code.replace(/export\s+default\s+function\s+\w+/, 'function Page');

  // Strip any other export keywords that remain
  code = code.replace(/^export\s+function\s+/gm, 'function ');
  code = code.replace(/^export\s+const\s+/gm, 'const ');
  code = code.replace(/^export\s+let\s+/gm, 'let ');
  code = code.replace(/^export\s+var\s+/gm, 'var ');
  code = code.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');

  // Remove TypeScript type annotations
  code = code.replace(/:\s*React\.\w+(?:<[^>]*>)?/g, '');
  code = code.replace(/\bas\s+(?:const|string|number|boolean|any|\w+(?:<[^>]*>)?)/g, '');

  return code;
}

/**
 * Process layout.tsx code: strip imports/metadata/fonts, extract the body content
 * to create a Layout wrapper component that renders children.
 */
function processLayoutCode(
  layoutContent: string,
  availableNames: Set<string>,
  truncatedNames: Set<string>
): string {
  let code = layoutContent;

  // Find component imports from layout (Navbar, Footer, etc.)
  const layoutImports = [...code.matchAll(/import\s+(\w+)\s+from\s+['"]@\/components\/(\w+)['"];?\s*\n?/g)];
  const missingComponents = new Set<string>();

  for (const m of layoutImports) {
    const importName = m[1];
    const fileName = m[2];
    if (!availableNames.has(fileName) || truncatedNames.has(fileName)) {
      missingComponents.add(importName);
    }
  }

  // Remove 'use client'
  code = code.replace(/['"]use client['"];?\s*\n?/g, '');

  // Remove all import statements
  code = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*\n?/g, '');
  code = code.replace(/import\s+['"][^'"]+['"];?\s*\n?/g, '');

  // Remove metadata export
  // Remove metadata export (handle both with and without trailing semicolons)
  code = code.replace(/export\s+const\s+metadata[\s\S]*?\}\s*;?\s*\n?/g, '');

  // Remove JSX for missing components
  for (const name of missingComponents) {
    code = code.replace(new RegExp(`\\s*<${name}\\s*/>`, 'g'), '');
    code = code.replace(new RegExp(`\\s*<${name}[^>]*>`, 'g'), '');
    code = code.replace(new RegExp(`\\s*</${name}>`, 'g'), '');
  }

  // The layout typically wraps content in <html><body>...{children}...</body></html>
  // We need to extract just the inner content structure.
  // Replace the html/body wrapper with a fragment that renders Navbar + children + Footer

  // Rename the default export function to Layout
  code = code.replace(/export\s+default\s+function\s+\w+/, 'function Layout');

  // Strip any remaining export keywords
  code = code.replace(/^export\s+function\s+/gm, 'function ');
  code = code.replace(/^export\s+const\s+/gm, 'const ');
  code = code.replace(/^export\s+let\s+/gm, 'let ');
  code = code.replace(/^export\s+var\s+/gm, 'var ');
  code = code.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');

  // Replace {children} with {props.children} since we'll pass children as props
  code = code.replace(/\{children\}/g, '{props.children}');

  // Strip html/body/head tags â we just want the inner components
  // Replace <html ...>, </html>, <head>...</head>, <body ...>, </body>
  code = code.replace(/<html[^>]*>/g, '<>');
  code = code.replace(/<\/html>/g, '</>');
  code = code.replace(/<head[\s\S]*?<\/head>/g, '');
  code = code.replace(/<body[^>]*>/g, '<div>');
  code = code.replace(/<\/body>/g, '</div>');

  // Handle the function parameter â add props if it uses destructured {children}
  code = code.replace(
    /function Layout\s*\(\s*\{\s*children\s*\}\s*(?::\s*\{[^}]*\})?\s*\)/,
    'function Layout(props: any)'
  );
  // If it's (props: { children: ... })
  code = code.replace(
    /function Layout\s*\(\s*(?:props\s*:\s*\{[^}]*\}|props\s*:\s*\w+)\s*\)/,
    'function Layout(props: any)'
  );
  // Fallback: if no params at all
  if (!/function Layout\s*\(/.test(code)) {
    code = code.replace('function Layout', 'function Layout(props: any)');
  } else if (!/function Layout\s*\(props/.test(code)) {
    // Has params but not `props` â ensure it accepts props
    code = code.replace(/function Layout\s*\([^)]*\)/, 'function Layout(props: any)');
  }

  // Remove TypeScript type annotations
  code = code.replace(/:\s*React\.\w+(?:<[^>]*>)?/g, '');
  code = code.replace(/\bas\s+(?:const|string|number|boolean|any|\w+(?:<[^>]*>)?)/g, '');

  // Remove font variable declarations (next/font doesn't work in preview)
  code = code.replace(/const\s+\w+\s*=\s*\w+\(\{[\s\S]*?\}\);?\s*\n?/g, '');

  // Remove className references to font variables (e.g., `${inter.variable}`)
  code = code.replace(/\$\{\w+\.(?:variable|className)\}/g, '');
  code = code.replace(/\w+\.(?:variable|className)/g, '""');

  return code;
}

/**
 * Clean component code for browser execution:
 * - Remove 'use client'
 * - Remove all import statements
 * - Convert `export default function X` to just `return X`
 * - Remove TypeScript type annotations that Babel standalone can't handle
 */
function cleanComponentCode(code: string): string {
  let result = code;

  // Remove 'use client'
  result = result.replace(/['"]use client['"];?\s*\n?/g, '');

  // Remove all import statements (including multi-line imports with { X, Y })
  result = result.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*\n?/g, '');
  result = result.replace(/import\s+['"][^'"]+['"];?\s*\n?/g, '');

  // Convert export default function to return function
  result = result.replace(
    /export\s+default\s+function\s+(\w+)/,
    'const $1 = function $1'
  );

  // Strip named export keywords (export function X -> function X, export const X -> const X)
  result = result.replace(/^export\s+function\s+/gm, 'function ');
  result = result.replace(/^export\s+const\s+/gm, 'const ');
  result = result.replace(/^export\s+let\s+/gm, 'let ');
  result = result.replace(/^export\s+var\s+/gm, 'var ');
  // Remove re-export and export-list statements entirely
  result = result.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');
  result = result.replace(/^export\s+type\s+/gm, 'type ');

  // Add return statement for the component
  const fnMatch = result.match(/const\s+(\w+)\s*=\s*function\s+\w+/);
  if (fnMatch) {
    result += `\nreturn ${fnMatch[1]};`;
  }

  // Remove TypeScript interfaces and type definitions
  result = result.replace(/interface\s+\w+\s*\{[\s\S]*?\}\s*\n?/g, '');
  result = result.replace(/type\s+\w+\s*=\s*[\s\S]*?;\s*\n?/g, '');

  // Remove React-specific type annotations
  result = result.replace(/:\s*React\.FC(?:<[^>]*>)?/g, '');
  result = result.replace(/:\s*React\.CSSProperties/g, '');
  result = result.replace(/:\s*React\.(?:MouseEvent|FormEvent|ChangeEvent)(?:<[^>]*>)?/g, '');

  // Note: Babel standalone with TypeScript preset handles most TS annotations.
  // These are just safety nets for edge cases.

  // Remove `as Type` assertions (e.g., `as const`, `as string`, `as HTMLElement`)
  result = result.replace(/\bas\s+(?:const|string|number|boolean|any|\w+(?:<[^>]*>)?)/g, '');

  // Fix unescaped apostrophes in single-quoted strings
  // e.g., 'we've' â 'we\'ve'
  result = fixUnescapedApostrophes(result);

  return result;
}

/**
 * Fix unescaped single quotes inside single-quoted string literals.
 * The AI sometimes generates: 'we've' which should be 'we\'ve'
 * Strategy: convert all single-quoted strings to use backticks (template literals)
 * which can contain unescaped single quotes.
 */
function fixUnescapedApostrophes(code: string): string {
  // In JSX text content, apostrophes are valid and should NOT be escaped.
  // The previous implementation was too aggressive and replaced valid
  // apostrophes in JSX text with double quotes, breaking the output.
  // Smart/curly quotes are now handled by sanitizeSmartQuotes() instead.
  return code;
}

/**
 * Strip @layer blocks from CSS (handles nested braces).
 * Also strips any @apply directives that the Tailwind CDN can't process.
 */
function stripLayerBlocks(css: string): string {
  let result = '';
  let i = 0;
  while (i < css.length) {
    // Check for @layer
    if (css.substring(i).match(/^@layer\s+\w+\s*\{/)) {
      // Find the matching closing brace
      const openIdx = css.indexOf('{', i);
      let depth = 1;
      let j = openIdx + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        if (css[j] === '}') depth--;
        j++;
      }
      i = j; // Skip past the entire @layer block
    } else {
      result += css[i];
      i++;
    }
  }
  // Also strip any remaining @apply directives
  result = result.replace(/@apply\s+[^;]+;/g, '');
  return result;
}
