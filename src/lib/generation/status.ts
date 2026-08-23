'use client';

export interface GenerationStatus {
  projectStatus: string;
  lastGeneratedAt: string | null;
  latestVersion: {
    id: string;
    versionNumber: number;
    status: string;
    generationTimeMs: number | null;
    completedAt: string | null;
    createdAt: string;
  } | null;
  fileCount: number;
}

interface PollOptions {
  maxAttempts?: number;
  intervalMs?: number;
}

export async function fetchGenerationStatus(
  projectId: string
): Promise<GenerationStatus> {
  const response = await fetch(
    `/api/generate/status?projectId=${encodeURIComponent(projectId)}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch generation status (${response.status})`);
  }

  return (await response.json()) as GenerationStatus;
}

export function isTerminalGenerationStatus(status: string | null | undefined) {
  return status === 'complete' || status === 'error';
}

export function isGenerationComplete(status: GenerationStatus) {
  return (
    status.fileCount > 0 &&
    (status.projectStatus === 'generated' ||
      status.latestVersion?.status === 'complete')
  );
}

export function isGenerationError(status: GenerationStatus) {
  return (
    status.projectStatus === 'error' || status.latestVersion?.status === 'error'
  );
}

export function isGenerationInFlight(status: GenerationStatus) {
  return status.latestVersion?.status === 'generating';
}

export async function pollForTerminalGenerationStatus(
  projectId: string,
  versionCreatedAfter?: string,
  options: PollOptions = {}
): Promise<GenerationStatus | null> {
  const maxAttempts = options.maxAttempts ?? 60;
  const intervalMs = options.intervalMs ?? 5_000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    try {
      const status = await fetchGenerationStatus(projectId);

      if (
        versionCreatedAfter &&
        status.latestVersion &&
        status.latestVersion.createdAt < versionCreatedAfter
      ) {
        continue;
      }

      if (
        isTerminalGenerationStatus(status.latestVersion?.status) ||
        status.projectStatus === 'generated' ||
        status.projectStatus === 'error'
      ) {
        return status;
      }
    } catch {
      // Keep polling through transient fetch failures.
    }
  }

  return null;
}
