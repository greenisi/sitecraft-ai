const VERCEL_API = 'https://api.vercel.com';

interface VercelDomainConfig {
  token: string;
  teamId?: string;
}

interface DomainInfo {
  name: string;
  configured: boolean;
  verified: boolean;
  verification?: { type: string; domain: string; value: string }[];
}

function buildHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function teamQuery(teamId?: string) {
  return teamId ? `?teamId=${teamId}` : '';
}

/**
 * Add a domain alias to a Vercel project.
 * Uses the project name (not deployment ID) as the project identifier.
 * Handles 409 conflicts gracefully (domain already assigned).
 */
export async function addDomainToProject(
  projectName: string,
  domain: string,
  config: VercelDomainConfig
): Promise<DomainInfo> {
  const response = await fetch(
    `${VERCEL_API}/v10/projects/${encodeURIComponent(projectName)}/domains${teamQuery(config.teamId)}`,
    {
      method: 'POST',
      headers: buildHeaders(config.token),
      body: JSON.stringify({ name: domain }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const code = data.error?.code || '';
    const message = data.error?.message || '';

    // Handle all variants of 'domain already exists' responses:
    // - 409 status code (conflict — domain already on this or another project)
    // - domain_already_in_use error code
    // - DOMAIN_ALREADY_EXISTS error code
    // - Any error message containing 'already'
    if (
      response.status === 409 ||
      code === 'domain_already_in_use' ||
      code === 'DOMAIN_ALREADY_EXISTS' ||
      message.toLowerCase().includes('already')
    ) {
      return {
        name: domain,
        configured: true,
        verified: true,
      };
    }

    throw new Error(
      `Failed to add domain ${domain}: ${data.error?.message || response.statusText}`
    );
  }

  return {
    name: data.name,
    configured: data.configured ?? false,
    verified: data.verified ?? false,
    verification: data.verification,
  };
}

/**
 * Remove a domain alias from a Vercel project.
 */
export async function removeDomainFromProject(
  projectName: string,
  domain: string,
  config: VercelDomainConfig
): Promise<void> {
  const response = await fetch(
    `${VERCEL_API}/v9/projects/${encodeURIComponent(projectName)}/domains/${domain}${teamQuery(config.teamId)}`,
    {
      method: 'DELETE',
      headers: buildHeaders(config.token),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      `Failed to remove domain ${domain}: ${err.error?.message || response.statusText}`
    );
  }
}

/**
 * Get domain configuration and verification status.
 */
export async function getDomainConfig(
  domain: string,
  config: VercelDomainConfig
): Promise<{
  configured: boolean;
  verified: boolean;
  cnames: string[];
  verification?: { type: string; domain: string; value: string }[];
}> {
  const response = await fetch(
    `${VERCEL_API}/v6/domains/${domain}/config${teamQuery(config.teamId)}`,
    {
      headers: buildHeaders(config.token),
    }
  );

  if (!response.ok) {
    // Domain not found or not configured yet
    return { configured: false, verified: false, cnames: [] };
  }

  const data = await response.json();

  return {
    configured: data.configured ?? false,
    verified: data.verified ?? false,
    cnames: data.cnames ?? [],
    verification: data.verification,
  };
}

/**
 * Check if a Vercel project exists by name.
 */
export async function getVercelProject(
  projectName: string,
  config: VercelDomainConfig
): Promise<{ id: string; name: string } | null> {
  const response = await fetch(
    `${VERCEL_API}/v9/projects/${encodeURIComponent(projectName)}${teamQuery(config.teamId)}`,
    {
      headers: buildHeaders(config.token),
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return { id: data.id, name: data.name };
}

/**
 * Wait for a Vercel deployment to reach READY state.
 * Polls the deployment status every few seconds.
 * Returns true if READY, false if timed out or errored.
 */
export async function waitForDeploymentReady(
  deploymentId: string,
  config: VercelDomainConfig,
  maxWaitMs: number = 120000,
  pollIntervalMs: number = 4000
): Promise<{ ready: boolean; state: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetch(
        `${VERCEL_API}/v13/deployments/${deploymentId}${teamQuery(config.teamId)}`,
        {
          headers: buildHeaders(config.token),
        }
      );

      if (!response.ok) {
        // API error — wait and retry
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        continue;
      }

      const data = await response.json();
      const state = data.readyState || data.state || '';

      if (state === 'READY') {
        return { ready: true, state };
      }

      if (state === 'ERROR' || state === 'CANCELED') {
        return { ready: false, state };
      }

      // Still building (QUEUED, BUILDING, INITIALIZING) — keep waiting
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    } catch {
      // Network error — wait and retry
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

  return { ready: false, state: 'TIMEOUT' };
}
