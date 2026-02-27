import { createAdminClient } from '@/lib/supabase/admin';
import { deployToVercel } from '@/lib/export/vercel-deployer';
import { buildScaffoldingTree } from '@/lib/export/file-tree';
import { addDomainToProject, getVercelProject } from '@/lib/export/vercel-domains';
import type { DesignSystem } from '@/types/project';

const PLATFORM_TOKEN = process.env.VERCEL_PLATFORM_TOKEN!;
const TEAM_ID = process.env.VERCEL_TEAM_ID!;
const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN || 'innovated.site';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a TSX/TS file appears to be truncated or incomplete.
 */
function isFileTruncated(content: string): boolean {
  const trimmed = content.trimEnd();
  if (!trimmed) return true;
  const lastLine = trimmed.split('\n').pop()?.trim() || '';
  const validEndings = ['}', ')', ';', '/>', 'export default'];
  const looksComplete = validEndings.some(
    (e) => lastLine.endsWith(e) || lastLine.startsWith(e)
  );
  if (!looksComplete) return true;
  let braceCount = 0;
  for (const ch of trimmed) {
    if (ch === '{') braceCount++;
    if (ch === '}') braceCount--;
  }
  if (braceCount > 0) return true;

  // Check paren balance
  let parenCount = 0;
  for (const ch of trimmed) {
    if (ch === '(') parenCount++;
    if (ch === ')') parenCount--;
  }
  if (parenCount > 0) return true;

  // Must have an export (default or named)
  if (!trimmed.includes('export ')) return true;
  return false;
}

/**
 * Remove references to missing components from page files.
 */
function cleanPageFile(content: string, availableComponents: Set<string>): string {
  let result = content;
  const importRegex = /import\s+(\w+)\s+from\s+['"]@\/components\/(\w+)['"];?\s*\n?/g;
  const missing: string[] = [];
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    if (!availableComponents.has(m[2])) missing.push(m[1]);
  }
  for (const name of missing) {
    result = result.replace(new RegExp(`import\\s+${name}\\s+from\\s+['"][^'"]+['"];?\\s*\\n?`, 'g'), '');
    result = result.replace(new RegExp(`\\s*<${name}\\s*/>`, 'g'), '');
    result = result.replace(new RegExp(`\\s*<${name}[^>]*>`, 'g'), '');
    result = result.replace(new RegExp(`\\s*</${name}>`, 'g'), '');
  }
  return result;
}

/**
 * Generate a custom not-found page for graceful 404 handling.
 */
function generateNotFoundPage(): string {
  return `export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <a href="/" className="inline-flex items-center px-6 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors">
          Back to Home
        </a>
      </div>
    </div>
  );
}
`;
}

/**
 * Generate a fallback Navbar component when the AI-generated one is truncated or missing.
 */
function generateFallbackNavbar(config: any): string {
  const name = config?.businessName || config?.name || 'My Website';
  const pages = config?.pages || ['Home', 'About', 'Services', 'Contact'];
  const navLinks = pages.map((p: string) => {
    const href = p.toLowerCase() === 'home' ? '/' : '/' + p.toLowerCase().replace(/\s+/g, '-');
    return `          <a href="${href}" className="text-gray-300 hover:text-white transition-colors">${p}</a>`;
  }).join('\n');

  return `'use client';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="text-xl font-bold text-white">${name}</a>
          <div className="hidden md:flex items-center space-x-8">
${navLinks}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-300 hover:text-white"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-4 space-y-3">
${navLinks.replace(/hidden md:flex/g, 'flex flex-col')}
        </div>
      )}
    </nav>
  );
}
`;
}

/**
 * Generate a fallback Footer component when the AI-generated one is truncated or missing.
 */
function generateFallbackFooter(config: any): string {
  const name = config?.businessName || config?.name || 'My Website';
  const year = new Date().getFullYear();
  const pages = config?.pages || ['Home', 'About', 'Services', 'Contact'];
  const footerLinks = pages.map((p: string) => {
    const href = p.toLowerCase() === 'home' ? '/' : '/' + p.toLowerCase().replace(/\s+/g, '-');
    return `            <a href="${href}" className="text-gray-400 hover:text-white transition-colors">${p}</a>`;
  }).join('\n');

  return `export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-8 border-b border-gray-800">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">${name}</h3>
          </div>
          <div className="flex flex-wrap gap-6">
${footerLinks}
          </div>
        </div>
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; ${year} ${name}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
`;
}



export interface PublishResult {
  url: string;
  domain: string;
  deploymentId: string;
  vercelProjectName: string;
}

/**
 * Publish a project to a temporary subdomain: <slug>.innovated.site
 */
export async function publishToSubdomain(
  projectId: string,
  userId: string
): Promise<PublishResult> {
  const admin = createAdminClient();

  // 1. Fetch project
  const { data: project, error: projectError } = await admin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found');
  }

  // 2. Get latest completed generation version
  const { data: version } = await admin
    .from('generation_versions')
    .select('id')
    .eq('project_id', projectId)
    .eq('status', 'complete')
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (!version) {
    throw new Error('No completed generation found. Generate a website first.');
  }

  // 3. Get generated files
  const { data: files } = await admin
    .from('generated_files')
    .select('file_path, content, file_type')
    .eq('version_id', version.id);

  if (!files || files.length === 0) {
    throw new Error('No generated files found');
  }

  // 4. Build file tree
  const defaultDesignSystem: DesignSystem = {
    colors: { primary: {}, secondary: {}, accent: {}, neutral: {} },
    typography: { headingFont: 'Inter', bodyFont: 'Inter', scale: {} },
    spacing: {},
    borderRadius: {},
    shadows: {},
  };

  const tree = buildScaffoldingTree(
    project.generation_config,
    project.design_system || defaultDesignSystem
  );

    // 4a. Validate files: detect truncated components
    const availableComponents = new Set<string>();
    const truncatedFiles = new Set<string>();

    for (const file of files) {
      if (file.file_path.startsWith('src/components/') && file.file_path.endsWith('.tsx')) {
        const componentName = file.file_path.match(/\/([^/]+)\.tsx$/)?.[1];
        if (componentName) {
          const isCritical = componentName === 'Navbar' || componentName === 'Footer';
          if (isFileTruncated(file.content) && !isCritical) {
            truncatedFiles.add(file.file_path);
          } else {
            availableComponents.add(componentName);
          }
        }
      }
    }

    
  // 4a-ii. Ensure critical components (Navbar & Footer) always exist
  const criticalComponents = ['Navbar', 'Footer'];
  for (const comp of criticalComponents) {
    const filePath = `src/components/${comp}.tsx`;
    const existingFile = files.find((f: any) => f.file_path === filePath);
    if (!existingFile || isFileTruncated(existingFile.content)) {
      // Generate fallback component
      const fallbackContent = comp === 'Navbar'
        ? generateFallbackNavbar(project.generation_config)
        : generateFallbackFooter(project.generation_config);
      if (existingFile) {
        existingFile.content = fallbackContent; // Replace truncated content
      } else {
        files.push({ file_path: filePath, content: fallbackContent, file_type: 'component' });
      }
      availableComponents.add(comp);
    }
  }

  
  // 4a-iii. Fix navbar: use inline styles for reliable theme-colored sticky header
    const navbarFile = files.find((f: any) => f.file_path === 'src/components/Navbar.tsx');
    if (navbarFile) {
      try {
        // Tailwind color map for converting classes to real CSS colors
        const twColors: Record<string, string> = {
          'slate-900': '15,23,42', 'slate-800': '30,41,59',
          'gray-900': '17,24,39', 'gray-800': '31,41,55',
          'zinc-900': '24,24,27', 'zinc-800': '39,39,42',
          'neutral-900': '23,23,23', 'neutral-800': '38,38,38',
          'stone-900': '28,25,23', 'stone-800': '41,37,36',
          'red-900': '127,29,29', 'red-800': '153,27,27', 'red-700': '185,28,28',
          'orange-900': '124,45,18', 'orange-800': '154,52,18', 'orange-700': '194,65,12',
          'amber-900': '120,53,15', 'amber-800': '146,64,14', 'amber-700': '180,83,9',
          'amber-600': '217,119,6', 'amber-500': '245,158,11',
          'yellow-900': '113,63,18', 'yellow-800': '133,77,14',
          'green-900': '20,83,45', 'green-800': '22,101,52', 'green-700': '21,128,61',
          'emerald-900': '6,78,59', 'emerald-800': '6,95,70', 'emerald-700': '4,120,87',
          'teal-900': '19,78,74', 'teal-800': '17,94,89',
          'cyan-900': '22,78,99', 'cyan-800': '21,94,117',
          'sky-900': '12,74,110', 'sky-800': '7,89,133',
          'blue-900': '30,58,138', 'blue-800': '30,64,175', 'blue-700': '29,78,216',
          'indigo-900': '49,46,129', 'indigo-800': '55,48,163', 'indigo-700': '67,56,202',
          'violet-900': '76,29,149', 'violet-800': '91,33,182', 'violet-700': '109,40,217',
          'purple-900': '88,28,135', 'purple-800': '107,33,168', 'purple-700': '126,34,206',
          'purple-600': '147,51,234', 'purple-500': '168,85,247',
          'fuchsia-900': '112,26,117', 'fuchsia-800': '134,25,143',
          'pink-900': '131,24,67', 'pink-800': '157,23,77',
          'rose-900': '136,19,55', 'rose-800': '159,18,57',
          'black': '0,0,0', 'white': '255,255,255',
        };
        // --- Parse custom theme colors from generated tailwind.config.js ---
        // The AI generates a tailwind.config.js with custom colors (primary, secondary, accent).
        // We need to add these to twColors so the standard scanning in STEPs 1-3 can resolve them.
        const twGenFile = files.find((f: any) => f.file_path === 'tailwind.config.js' || f.file_path.endsWith('/tailwind.config.js'));
        const twConfigContent = twGenFile?.content || tree.getFile('tailwind.config.js')?.content || '';
        if (twConfigContent) {
          const themeGroups = ['primary', 'secondary', 'accent'];
          for (const tg of themeGroups) {
            // Find the block: primary: { "50": "#hex", ... }
            // Use a regex that matches the theme name followed by a colon and opening brace
            const blockStartIdx = twConfigContent.indexOf(tg + ':');
            if (blockStartIdx === -1) continue;
            const braceStart = twConfigContent.indexOf('{', blockStartIdx);
            if (braceStart === -1 || braceStart > blockStartIdx + 50) continue;
            // Find matching closing brace
            let depth = 0;
            let braceEnd = braceStart;
            for (let ci = braceStart; ci < twConfigContent.length; ci++) {
              if (twConfigContent[ci] === '{') depth++;
              if (twConfigContent[ci] === '}') depth--;
              if (depth === 0) { braceEnd = ci; break; }
            }
            const block = twConfigContent.substring(braceStart, braceEnd + 1);
            // Extract "shade": "#hex" pairs
            const shadeRe = /["']?(\d+)["']?\s*:\s*["']#([0-9a-fA-F]{6})["']/g;
            let sm;
            while ((sm = shadeRe.exec(block)) !== null) {
              const shade = sm[1];
              const hex = sm[2];
              const r = parseInt(hex.slice(0,2), 16);
              const g = parseInt(hex.slice(2,4), 16);
              const b = parseInt(hex.slice(4,6), 16);
              twColors[tg + '-' + shade] = r + ',' + g + ',' + b;
            }
          }
        }


        // DEBUG: Log custom color resolution
        const customColorCount = Object.keys(twColors).filter(k => k.startsWith('primary-') || k.startsWith('secondary-') || k.startsWith('accent-')).length;
        const twConfigLen = twConfigContent?.length || 0;
        const hasTwGenFile = !!twGenFile;
        const treeConfigLen = tree.getFile('tailwind.config.js')?.content?.length || 0;
        const dsIsNull = project.design_system === null;
        const dsColorKeys = project.design_system ? Object.keys(project.design_system.colors?.primary || {}) : [];
        console.error('[NavbarFix-Debug] customColors=' + customColorCount + ' twConfigLen=' + twConfigLen + ' hasTwGenFile=' + hasTwGenFile + ' treeConfigLen=' + treeConfigLen + ' dsIsNull=' + dsIsNull + ' dsColorKeys=' + dsColorKeys.join(','));

        // STEP 1: Look at the homepage hero section for the dominant theme color.
        // This is more reliable than the navbar's own scrolled-state color, because
        // the navbar often uses an accent color for its scrolled state while the
        // hero/page uses the actual theme color.
        let heroThemeColor = '';
        // Scan Hero component and page files for the dominant theme gradient color
        const heroFile = files.find((f: any) => f.file_path === 'src/components/Hero.tsx');
        const homepageFile = files.find((f: any) =>
          f.file_path === 'src/app/page.tsx' || f.file_path === 'src/app/(main)/page.tsx'
        );
        // Build a combined text from Hero + homepage + all component files to find theme colors
        const colorScanText = [
          heroFile?.content || '',
          homepageFile?.content || '',
          ...files.filter((f: any) => f.file_path.startsWith('src/components/') && f.file_path.endsWith('.tsx')).map((f: any) => f.content)
        ].join('\n');

        // Look for gradient 'from-' colors (strongest indicator of theme)
        const heroSectionMatch = colorScanText.match(/from-((?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+)/);
        if (heroSectionMatch && twColors[heroSectionMatch[1]]) {
          heroThemeColor = heroSectionMatch[1];
        }
        // Also check bg-COLOR patterns if no gradient found
        if (!heroThemeColor) {
          const bgMatch = colorScanText.match(/bg-((?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+)/);
          if (bgMatch && twColors[bgMatch[1]]) {
            heroThemeColor = bgMatch[1];
          }
        }

        // STEP 1b: If still no color, check for custom theme colors (primary/secondary/accent)
        // These are defined in the project's design_system and won't be in twColors
        if (!heroThemeColor) {
          const customColorMatch = colorScanText.match(/from-((?:primary|secondary|accent)-\d+)/);
          if (customColorMatch) {
            heroThemeColor = customColorMatch[1]; // e.g. "primary-600"
          }
        }
        if (!heroThemeColor) {
          const customBgMatch = colorScanText.match(/bg-((?:primary|secondary|accent)-\d+)/);
          if (customBgMatch) {
            heroThemeColor = customBgMatch[1];
          }
        }

        // STEP 2: If no hero color found, check the navbar's scrolled-state ternary
        let navbarOwnColor = '';
        const ternaryPatterns = [
          /\$\{\w+\s*\?\s*['"]([^'"]*bg-[\w-]+[^'"]*)['"]\s*:\s*['"][^'"]*bg-transparent[^'"]*['"]/,
          /\$\{\w+\s*\?\s*['"][^'"]*bg-transparent[^'"]*['"]\s*:\s*['"]([^'"]*bg-[\w-]+[^'"]*)['"]\}/,
        ];
        for (const pat of ternaryPatterns) {
          const m = navbarFile.content.match(pat);
          if (m && m[1]) {
            const colorMatch = m[1].match(/bg-((?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+)/);
            if (colorMatch) {
              navbarOwnColor = colorMatch[1];
              break;
            }
          }
        }

        // STEP 3: If neither found, scan for the most prominent bg color in the navbar file
        if (!navbarOwnColor) {
          const allBgColors = navbarFile.content.match(/bg-((?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+)/g) || [];
          const colorCounts: Record<string, number> = {};
          for (const c of allBgColors) {
            const name = c.replace('bg-', '');
            if (name !== 'transparent') {
              colorCounts[name] = (colorCounts[name] || 0) + 1;
            }
          }
          const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
          if (sorted.length > 0) navbarOwnColor = sorted[0][0];
        }

        // STEP 4: Pick the best color — prefer hero theme, darken it for the navbar
        // For dark themes (900/800), use directly. For lighter ones, bump to 900 variant.
        let chosenColor = heroThemeColor || navbarOwnColor;
        if (chosenColor) {
          // Prefer the darkest variant of the hue for a navbar (looks professional)
          const hueMatch = chosenColor.match(/^(\w+)-\d+$/);
          if (hueMatch) {
            const hue = hueMatch[1];
            const dark900 = hue + '-900';
            const dark800 = hue + '-800';
            if (twColors[dark900]) chosenColor = dark900;
            else if (twColors[dark800]) chosenColor = dark800;
          }
        }

        // Convert to RGB or use a dark fallback
        // Resolve the chosen color to RGB values
        let rgb = twColors[chosenColor] || '';
        
        // Custom theme colors are pre-populated in twColors above.
            // If still not resolved, fall through to navbarOwnColor and branding fallbacks.

            // Try 2b: If custom theme color couldn't be resolved, fall back to navbar's own standard color
            if (!rgb && navbarOwnColor && twColors[navbarOwnColor]) {
              // Prefer darkest variant of the navbar's own color
              const navHue = navbarOwnColor.match(/^(\w+)-\d+$/)?.[1];
              if (navHue) {
                const nDark = navHue + '-900';
                if (twColors[nDark]) { rgb = twColors[nDark]; chosenColor = nDark; }
                else if (twColors[navbarOwnColor]) { rgb = twColors[navbarOwnColor]; }
              } else {
                rgb = twColors[navbarOwnColor];
              }
            }

            // Try 3: Use branding colors from generation_config (most reliable source)
            if (!rgb && project.generation_config?.branding) {
              const branding = project.generation_config.branding as any;
              // chosenColor tells us which theme key we want (primary/secondary/accent)
              const themeKey = chosenColor?.match(/^(primary|secondary|accent)/)?.[1] || 'primary';
              const colorMap: Record<string, string> = {
                primary: branding.primaryColor,
                secondary: branding.secondaryColor,
                accent: branding.accentColor,
              };
              let hexColor = colorMap[themeKey] || branding.primaryColor || '';
              if (hexColor && hexColor.startsWith('#') && hexColor.length >= 7) {
                const h = hexColor.slice(1);
                // Darken the color by 40% for navbar (professional look)
                const r = Math.round(parseInt(h.slice(0,2), 16) * 0.6);
                const g = Math.round(parseInt(h.slice(2,4), 16) * 0.6);
                const b = Math.round(parseInt(h.slice(4,6), 16) * 0.6);
                rgb = r + ',' + g + ',' + b;
              }
            }
            if (!rgb) rgb = '17,24,39';

        console.error('[NavbarFix] chosenColor=' + chosenColor + ' rgb=' + rgb + ' hasBranding=' + !!project.generation_config?.branding);

        // STEP 5: Remove scroll-based bg ternaries
        navbarFile.content = navbarFile.content.replace(/\$\{\w+\s*\?\s*['"][^'"]*bg-[^'"]*['"]\s*:\s*['"][^'"]*['"]}\}/g, '');
        navbarFile.content = navbarFile.content.replace(/\$\{\w+\s*\?\s*"[^"]*bg-[^"]*"\s*:\s*"[^"]*"\}/g, '');

        // STEP 6: Strip all bg-transparent and any bg-XYZ/opacity classes from the nav className
        navbarFile.content = navbarFile.content.replace(/bg-transparent/g, '');
        navbarFile.content = navbarFile.content.replace(/bg-[\w-]+\/\d+/g, '');
        navbarFile.content = navbarFile.content.replace(/bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/g, '');

        // STEP 7: Inject inline style on the <nav element for guaranteed background color
        const navStyleStr = `style={{ backgroundColor: 'rgba(${rgb}, 0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}`;
        // Add style to the <nav element (handles <nav className=... pattern)
        if (!navbarFile.content.includes('backgroundColor')) {
          navbarFile.content = navbarFile.content.replace(
            /<nav\s+className=/,
            `<nav ${navStyleStr} className=`
          );
        }
      // STEP 8: Fix mobile menu dropdown — backdrop-filter on nav creates a
      // containing block, so fixed children with bottom-0 get 0 height.
      // Remove bottom-0 and add explicit height via inline style.
      navbarFile.content = navbarFile.content.replace(
        /className="([^"]*?)\bbottom-0\b([^"]*?)"/g,
        'className="$1$2" style={{ height: "calc(100vh - 4rem)" }}'
      );
} catch (navFixError) {
        // Silently continue — don't break publishing if navbar fix fails
        console.error('Navbar color fix error:', navFixError);
      }
    }

    // 4b. Add files to tree, cleaning up references to missing components
    for (const file of files) {
      if (truncatedFiles.has(file.file_path)) continue;

      let fileContent = file.content;
      // Replace PROJECT_ID placeholder with actual project ID
      fileContent = fileContent.replace(/PROJECT_ID/g, projectId);


      if (file.file_path.endsWith('page.tsx') || file.file_path.endsWith('layout.tsx')) {
        fileContent = cleanPageFile(fileContent, availableComponents);
      }

      if (
        (file.file_path.endsWith('page.tsx') || file.file_path.endsWith('page.ts')) &&
        !fileContent.includes('force-dynamic')
      ) {
        if (
          fileContent.trimStart().startsWith("'use client'") ||
          fileContent.trimStart().startsWith('"use client"')
        ) {
          fileContent = fileContent.replace(
            /(['"]use client['"];?\s*\n)/,
            "$1export const dynamic = 'force-dynamic';\n"
          );
        } else {
          fileContent = "export const dynamic = 'force-dynamic';\n" + fileContent;
        }
      }

      tree.addFile(file.file_path, fileContent, file.file_type);
    }

    // 4c. Add not-found page for graceful 404 handling
    tree.addFile('src/app/not-found.tsx', generateNotFoundPage(), 'page');

  // Force-inject overflow prevention CSS for mobile devices
  const OVERFLOW_FIX_CSS = [
    '',
    '/* Mobile overflow prevention — injected by publisher */',
    'html, body { overflow-x: hidden !important; max-width: 100vw !important; }',
    'section { overflow-x: hidden; max-width: 100vw; }',
    'img, video, iframe { max-width: 100%; height: auto; }',
    '',
    '/* Sticky navbar enforcement — injected by publisher */',
    'nav { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; width: 100% !important; z-index: 9999 !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; }',

    '',
    '/* Fix mobile menu dropdown inside backdrop-filter nav */',
    'nav > div[class*="fixed"], nav > div[class*="absolute"] { bottom: auto !important; height: calc(100vh - 4rem) !important; min-height: calc(100vh - 4rem) !important; }',  ].join('\n');
  const globalsFile = files.find((f: any) => f.file_path.endsWith('globals.css'));
  if (globalsFile) {
    {
        // Always strip old publisher CSS and re-inject with latest rules
        const pubMarker = '/* Mobile overflow prevention';
        const mIdx = globalsFile.content.indexOf(pubMarker);
        if (mIdx >= 0) {
          globalsFile.content = globalsFile.content.substring(0, mIdx).trimEnd();
        }
        globalsFile.content += OVERFLOW_FIX_CSS;
      }
  }

    
  // Force-inject Navbar & Footer into root layout if components exist
  const hasNavbar = availableComponents.has('Navbar');
  const hasFooter = availableComponents.has('Footer');
  if (hasNavbar || hasFooter) {
    const navImport = hasNavbar ? "import Navbar from '@/components/Navbar';" : '';
    const footerImport = hasFooter ? "import Footer from '@/components/Footer';" : '';
    const navJsx = hasNavbar ? '      <Navbar />' : '';
    const footerJsx = hasFooter ? '      <Footer />' : '';
    const clientLayout = [
      "'use client';",
      navImport,
      "import FormAutoWire from '@/components/FormAutoWire';",
      footerImport,
      '',
      'export default function ClientLayout({ children }: { children: React.ReactNode }) {',
      '  return (',
      '    <>',
      navJsx,
      `      <FormAutoWire projectId="${projectId}" />`,
      '      <main style={{ flex: 1 }}>{children}</main>',
      footerJsx,
      '    </>',
      '  );',
      '}',
      '',
    ].filter(Boolean).join('\n');
    // Generate form auto-wire component that submits forms to the backend API
    const formAutoWire = [
      "'use client';",
      "import { useEffect } from 'react';",
      "",
      "export default function FormAutoWire({ projectId }: { projectId: string }) {",
      "  useEffect(() => {",
      "    const API_BASE = 'https://app.innovated.marketing/api/sites/' + projectId;",
      "    const wired = new WeakSet<HTMLFormElement>();",
      "",
      "    function wireForm(form: HTMLFormElement) {",
      "      if (wired.has(form)) return;",
      "      wired.add(form);",
      "      form.addEventListener('submit', async (e) => {",
      "        e.preventDefault();",
      "        const formData = new FormData(form);",
      "        const data: Record<string, string> = {};",
"        formData.forEach((v, k) => { if (k) data[k] = String(v); });",
      "        // Also collect inputs without name attributes using type/placeholder heuristics",
      "        form.querySelectorAll('input, textarea, select').forEach((el: Element) => {",
      "          const inp = el as HTMLInputElement;",
      "          if (inp.name && data[inp.name]) return; // already collected",
      "          const val = inp.value;",
      "          if (!val) return;",
      "          if (inp.type === 'email') data.email = val;",
      "          else if (inp.type === 'tel') data.phone = val;",
      "          else if (inp.type === 'text') {",
      "            const ph = (inp.placeholder || '').toLowerCase();",
      "            if (ph.includes('name')) data.name = val;",
      "            else if (ph.includes('subject')) data.service_needed = val;",
      "            else if (ph.includes('company')) data.name = data.name ? data.name + ' (' + val + ')' : val;",
      "            else if (!data.name) data.name = val;",
      "          }",
      "          else if (inp.tagName === 'TEXTAREA') data.message = val;",
      "        });",
      "        // Detect form type from fields",
      "        const hasItems = !!data.items;",
      "        const endpoint = hasItems ? API_BASE + '/orders' : API_BASE + '/submit-form';",
      "        // Add form_type if not present",
      "        if (!hasItems && !data.form_type) {",
      "          data.form_type = 'contact';",
      "          data.source_page = window.location.pathname;",
      "        }",
      "        const submitBtn = form.querySelector('button[type=submit], button:not([type])') as HTMLButtonElement | null;",
      "        const originalText = submitBtn?.textContent || '';",
      "        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }",
      "        try {",
      "          const res = await fetch(endpoint, {",
      "            method: 'POST',",
      "            headers: { 'Content-Type': 'application/json' },",
      "            body: JSON.stringify(data),",
      "          });",
      "          if (res.ok) {",
      "            form.reset();",
      "            if (submitBtn) { submitBtn.textContent = 'Sent!'; submitBtn.classList.add('bg-green-600'); }",
      "            setTimeout(() => { if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; submitBtn.classList.remove('bg-green-600'); } }, 3000);",
      "          } else {",
      "            if (submitBtn) { submitBtn.textContent = 'Error - Try Again'; submitBtn.disabled = false; }",
      "            setTimeout(() => { if (submitBtn) submitBtn.textContent = originalText; }, 3000);",
      "          }",
      "        } catch {",
      "          if (submitBtn) { submitBtn.textContent = 'Error - Try Again'; submitBtn.disabled = false; }",
      "          setTimeout(() => { if (submitBtn) submitBtn.textContent = originalText; }, 3000);",
      "        }",
      "      });",
      "    }",
      "",
      "    // Wire existing forms",
      "    document.querySelectorAll('form').forEach((f) => wireForm(f as HTMLFormElement));",
      "",
      "    // Watch for dynamically added forms",
      "    const observer = new MutationObserver(() => {",
      "      document.querySelectorAll('form').forEach((f) => wireForm(f as HTMLFormElement));",
      "    });",
      "    observer.observe(document.body, { childList: true, subtree: true });",
      "",
      "    return () => observer.disconnect();",
      "  }, [projectId]);",
      "",
      "  return null;",
      "}",
    ].join('\n');
    tree.addFile('src/components/FormAutoWire.tsx', formAutoWire, 'component');

    tree.addFile('src/components/ClientLayout.tsx', clientLayout, 'component');

    // Patch the root layout to wrap children with ClientLayout
    const layoutVFile = tree.getFile('src/app/layout.tsx');
    if (layoutVFile && !layoutVFile.content.includes('ClientLayout')) {
      const patched = layoutVFile.content
        .replace(
          '{children}',
          '<ClientLayout>{children}</ClientLayout>'
        )
        .replace(
          "import './globals.css';",
          "import './globals.css';\nimport ClientLayout from '@/components/ClientLayout';"
        );
      tree.addFile('src/app/layout.tsx', patched, 'page');
    }
  }

// Force-override next.config.js to skip TS/ESLint errors in AI-generated code
  const NC_CONTENT = [
    "/** @type {import('next').NextConfig} */",
    "const nextConfig = {",
    "  typescript: { ignoreBuildErrors: true },",
    "  eslint: { ignoreDuringBuilds: true },",
    "  images: {",
    "    remotePatterns: [",
    "      { protocol: 'https', hostname: 'images.unsplash.com' },",
    "      { protocol: 'https', hostname: 'via.placeholder.com' },",
    "    ],",
    "  },",
    "};",
    "",
    "module.exports = nextConfig;",
    ""
  ].join('\n');
  tree.addFile('next.config.js', NC_CONTENT, 'config');

  // Add build-retry.js for resilient builds
  const BUILD_RETRY = "const { execSync } = require('child_process');\nconst fs = require('fs');\nconst path = require('path');\n\nconst MAX_RETRIES = 5;\n\nfunction findErrorFile(stderr) {\n  const patterns = [\n    /\\.\\/src\\/components\\/([\\w]+)\\.tsx/,\n    /\\/src\\/components\\/([\\w]+)\\.tsx/,\n  ];\n  for (const p of patterns) {\n    const m = stderr.match(p);\n    if (m) return m[1];\n  }\n  return null;\n}\n\nfunction removeComponentFromPages(componentName) {\n  const appDir = path.join(__dirname, 'src', 'app');\n  if (!fs.existsSync(appDir)) return;\n  function walkDir(dir) {\n    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {\n      const fp = path.join(dir, f.name);\n      if (f.isDirectory()) { walkDir(fp); continue; }\n      if (!f.name.endsWith('.tsx') && !f.name.endsWith('.ts')) continue;\n      let content = fs.readFileSync(fp, 'utf8');\n      const re1 = new RegExp(\"import\\\\s+\" + componentName + \"\\\\s+from\\\\s+['\\\"][^'\\\"]+['\\\"];?\\\\s*\\\\n?\", 'g');\n      const re2 = new RegExp(\"\\\\s*<\" + componentName + \"[^>]*/?>\", 'g');\n      const re3 = new RegExp(\"\\\\s*</\" + componentName + \">\", 'g');\n      const newContent = content.replace(re1, '').replace(re2, '').replace(re3, '');\n      if (newContent !== content) {\n        fs.writeFileSync(fp, newContent);\n        console.log('Cleaned ' + componentName + ' from ' + fp);\n      }\n    }\n  }\n  walkDir(appDir);\n}\n\nfor (let attempt = 0; attempt < MAX_RETRIES; attempt++) {\n  try {\n    console.log('Build attempt ' + (attempt + 1) + '...');\n    execSync('npx next build', { stdio: ['pipe', 'inherit', 'pipe'] });\n    console.log('Build succeeded!');\n    process.exit(0);\n  } catch (err) {\n    const stderr = (err.stderr || '').toString();\n    const componentName = findErrorFile(stderr);\n    if (!componentName) {\n      console.error('Build failed, could not find problematic file.');\n      if (attempt === MAX_RETRIES - 1) process.exit(0);\n      continue;\n    }\n    console.log('Removing broken component: ' + componentName);\n    const compPath = path.join(__dirname, 'src', 'components', componentName + '.tsx');\n    if (fs.existsSync(compPath)) fs.unlinkSync(compPath);\n    removeComponentFromPages(componentName);\n  }\n}\nprocess.exit(0);\n";
  tree.addFile('build-retry.js', BUILD_RETRY, 'config');

    // Force-override package.json to make build always succeed
    const projectName = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const PKG_CONTENT = JSON.stringify({
      name: projectName,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "node build-retry.js",
        start: "next start",
        lint: "next lint"
      },
      dependencies: {
        next: "^14.2.0",
        react: "^18.3.0",
        "react-dom": "^18.3.0",
        tailwindcss: "^3.4.0",
        autoprefixer: "^10.4.0",
        postcss: "^8.4.0",
        clsx: "^2.1.0",
        "tailwind-merge": "^2.4.0",
        "lucide-react": "^0.400.0"
      },
      devDependencies: {
        "@types/node": "^20.0.0",
        "@types/react": "^18.3.0",
        "@types/react-dom": "^18.3.0",
        typescript: "^5.4.0",
        eslint: "^8.57.0",
        "eslint-config-next": "^14.2.0"
      }
    }, null, 2);
    tree.addFile('package.json', PKG_CONTENT, 'config');

  // 5. Derive Vercel project name from slug (must be unique, lowercase, alphanumeric + hyphens)
  const vercelProjectName = project.vercel_project_name || `sc-${project.slug}`;
  const subdomain = `${project.slug}.${PLATFORM_DOMAIN}`;

  // 6. Deploy to Vercel using platform token
  const deployment = await deployToVercel(tree, {
    vercelToken: PLATFORM_TOKEN,
    projectName: vercelProjectName,
    teamId: TEAM_ID,
  });

  // 7. Brief wait for Vercel to index the new project, then add domain
  // The deployment builds asynchronously — we don't need to wait for READY
  // to add the domain alias. Vercel will serve it once the build finishes.
  await sleep(2000);

  // 8. Get the actual Vercel project ID (not deployment ID)
  let vercelProjectId = deployment.deploymentId; // fallback
  try {
    const vercelProject = await getVercelProject(vercelProjectName, {
      token: PLATFORM_TOKEN,
      teamId: TEAM_ID,
    });
    if (vercelProject) {
      vercelProjectId = vercelProject.id;
    }
  } catch {
    // Use deployment ID as fallback
  }

  // 9. Add subdomain alias to the Vercel project with retry
  let domainAdded = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await addDomainToProject(vercelProjectName, subdomain, {
        token: PLATFORM_TOKEN,
        teamId: TEAM_ID,
      });
      domainAdded = true;
      break;
    } catch (domainError) {
      const msg = (domainError as Error).message || '';
      // Domain already exists on this project — that's fine
      if (msg.includes('already') || msg.includes('DOMAIN_ALREADY_EXISTS')) {
        domainAdded = true;
        break;
      }
      // Project not ready yet, wait and retry
      if (attempt < 2) {
        await sleep(2000);
      }
    }
  }

  if (!domainAdded) {
    console.error(`Failed to add domain alias ${subdomain} to project ${vercelProjectName}`);
  }

  // 10. Update project in DB
  await admin
    .from('projects')
    .update({
      status: 'published',
      published_url: `https://${subdomain}`,
      published_at: new Date().toISOString(),
      vercel_project_name: vercelProjectName,
      vercel_project_id: vercelProjectId,
      vercel_deployment_url: deployment.url,
    })
    .eq('id', projectId);

  // 11. Upsert domain record
  // Delete any existing temporary domain for this project first
  await admin
    .from('domains')
    .delete()
    .eq('project_id', projectId)
    .eq('domain_type', 'temporary');

  await admin.from('domains').insert({
    project_id: projectId,
    user_id: userId,
    domain: subdomain,
    domain_type: 'temporary',
    status: domainAdded ? 'active' : 'pending',
    dns_configured: domainAdded,
  });

  return {
    url: `https://${subdomain}`,
    domain: subdomain,
    deploymentId: deployment.deploymentId,
    vercelProjectName,
  };
}

/**
 * Add a custom domain to an already-published project.
 */
export async function addCustomDomain(
  projectId: string,
  userId: string,
  customDomain: string,
  domainType: 'purchased' | 'external'
): Promise<{ verificationNeeded: boolean; instructions?: string[] }> {
  const admin = createAdminClient();

  // Get project's Vercel project name
  const { data: project } = await admin
    .from('projects')
    .select('vercel_project_name')
    .eq('id', projectId)
    .single();

  if (!project?.vercel_project_name) {
    throw new Error('Project must be published first');
  }

  // Add domain to Vercel
  const domainInfo = await addDomainToProject(
    project.vercel_project_name,
    customDomain,
    { token: PLATFORM_TOKEN, teamId: TEAM_ID }
  );

  // Create domain record
  const verificationToken = crypto.randomUUID();
  await admin.from('domains').insert({
    project_id: projectId,
    user_id: userId,
    domain: customDomain,
    domain_type: domainType,
    status: domainInfo.verified ? 'active' : 'pending',
    dns_configured: domainInfo.configured,
    verification_token: verificationToken,
  });

  // Update project custom_domain
  await admin
    .from('projects')
    .update({ custom_domain: customDomain })
    .eq('id', projectId);

  if (!domainInfo.verified) {
    return {
      verificationNeeded: true,
      instructions: [
        `Add a CNAME record for "${customDomain}" pointing to "cname.vercel-dns.com"`,
        `DNS propagation typically takes 5-30 minutes`,
        `Click "Verify" once you've added the DNS record`,
      ],
    };
  }

  return { verificationNeeded: false };
}
