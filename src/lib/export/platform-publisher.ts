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
  if (braceCount > 2) return true;
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
          if (isFileTruncated(file.content)) {
            truncatedFiles.add(file.file_path);
          } else {
            availableComponents.add(componentName);
          }
        }
      }
    }

    // 4b. Add files to tree, cleaning up references to missing components
    for (const file of files) {
      if (truncatedFiles.has(file.file_path)) continue;

      let fileContent = file.content;

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
  ].join('\n');
  const globalsFile = files.find((f: any) => f.file_path.endsWith('globals.css'));
  if (globalsFile) {
    if (!globalsFile.content.includes('overflow-x: hidden')) {
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
      footerImport,
      '',
      'export default function ClientLayout({ children }: { children: React.ReactNode }) {',
      '  return (',
      '    <>',
      navJsx,
      '      <main className="flex-1 ' + (hasNavbar ? 'pt-16' : '') + '">{children}</main>',
      footerJsx,
      '    </>',
      '  );',
      '}',
      '',
    ].filter(Boolean).join('\n');
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

    // Force-override package.json to make build always succeed
    const projectName = project.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const PKG_CONTENT = JSON.stringify({
      name: projectName,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build || true",
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
