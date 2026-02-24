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

  for (const file of files) {
    tree.addFile(file.file_path, file.content, file.file_type);
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

