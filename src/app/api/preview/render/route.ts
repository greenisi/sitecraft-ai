import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { LUCIDE_ICON_PATHS } from '@/lib/preview/lucide-icons';

export const runtime = 'nodejs';

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
    return new Response('<html><body><p>No generated version found</p>
    <script>
      // Fix transparent navbars - make them visible on light backgrounds
      (function() {
        var nav = document.querySelector('nav');
        if (nav && nav.classList.contains('bg-transparent')) {
          nav.style.setProperty('background-color', 'white', 'important');
          nav.style.setProperty('border-bottom', '1px solid #e5e7eb', 'important');
          nav.style.setProperty('box-shadow', '0 1px 3px rgba(0,0,0,0.05)', 'important');
          var els = nav.querySelectorAll('a, span');
          for (var i = 0; i < els.length; i++) {
            var cls = els[i].getAttribute('class') || '';
            if (cls.indexOf('text-white') !== -1 && cls.indexOf('bg-') === -1) {
              els[i].style.setProperty('color', '#111827', 'important');
            }
          }
        }
      })();
    </script>
    </body></html>', {
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

  // Derive available pages from file structure
  const availablePages = deriveAvailablePages(files);

  // Build the preview HTML for the requested page
  const html = buildPreviewHTML(files, page, availablePages);

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

function buildPreviewHTML(
  files: FileRecord[],
  page: string,
  availablePages: Array<{ path: string; title: string }>
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

  // Process component source code
  const componentScripts = validComponents
    .map((f) => {
      const name = f.file_path.match(/\/([^/]+)\.tsx$/)?.[1];
      if (!name) return '';

      let code = f.content;
      code = cleanComponentCode(code);

      return `
// --- ${name} ---
const ${name}_module = (function() {
  ${code}
})();
const ${name} = ${name}_module;
`;
    })
    .join('\n');

  // Process page.tsx â build the Page component
  let pageCode = processPageCode(pageContent, availableNames, truncatedNames);

  // Process layout.tsx â if it exists, build a Layout wrapper
  let layoutCode = '';
  if (layoutContent) {
    layoutCode = processLayoutCode(layoutContent, availableNames, truncatedNames);
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
        heading: [${JSON.stringify(ds.typography?.fontHeading || 'Space Grotesk')}, 'sans-serif'],
        body: [${JSON.stringify(ds.typography?.fontBody || 'Inter')}, 'sans-serif'],
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
  <\/script>
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
  code = code.replace(/export\s+const\s+metadata[\s\S]*?;\s*\n?/g, '');

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
