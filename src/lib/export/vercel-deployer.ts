import { VirtualFileTree } from '@/types/generation';
import crypto from 'crypto';

export interface DeploymentResult {
  deploymentId: string;
  url: string;
  readyState: string;
}

export interface DeployConfig {
  vercelToken: string;
  projectName: string;
  teamId?: string;
}

const VERCEL_API = 'https://api.vercel.com';

export async function deployToVercel(
  fileTree: VirtualFileTree,
  config: DeployConfig
): Promise<DeploymentResult> {
  const headers = {
    Authorization: `Bearer ${config.vercelToken}`,
    'Content-Type': 'application/json',
  };

  // Step 1: Upload each file
  const fileEntries: { file: string; sha: string; size: number }[] = [];

  for (const [path, file] of fileTree.entries()) {
    const buffer = Buffer.from(file.content, 'utf-8');
    const sha = crypto.createHash('sha1').update(buffer).digest('hex');

    await fetch(`${VERCEL_API}/v2/files`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/octet-stream',
        'x-vercel-digest': sha,
      },
      body: buffer,
    });

    fileEntries.push({
      file: path,
      sha,
      size: buffer.length,
    });
  }

  // Step 2: Create deployment
  const teamQuery = config.teamId ? `?teamId=${config.teamId}` : '';
  const response = await fetch(
    `${VERCEL_API}/v13/deployments${teamQuery}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: config.projectName,
        files: fileEntries,
        projectSettings: {
          framework: 'nextjs',
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Vercel deployment failed: ${errorData.error?.message || response.statusText}`
    );
  }

  const deployment = await response.json();

  return {
    deploymentId: deployment.id,
    url: `https://${deployment.url}`,
    readyState: deployment.readyState,
  };
}

export async function getDeploymentStatus(
  deploymentId: string,
  vercelToken: string,
  teamId?: string
): Promise<{ readyState: string; url: string }> {
  const teamQuery = teamId ? `?teamId=${teamId}` : '';
  const response = await fetch(
    `${VERCEL_API}/v6/deployments/${deploymentId}${teamQuery}`,
    {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get deployment status');
  }

  const data = await response.json();
  return {
    readyState: data.readyState,
    url: `https://${data.url}`,
  };
}
