import type { Project } from './project';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface CreateProjectRequest {
  name: string;
  site_type: Project['site_type'];
}

export interface UpdateProjectRequest {
  name?: string;
  generation_config?: Project['generation_config'];
}

export interface GenerateRequest {
  projectId: string;
}

export interface ExportDownloadRequest {
  projectId: string;
}

export interface DeployRequest {
  projectId: string;
  vercelToken: string;
  projectName: string;
  teamId?: string;
}

export interface DeploymentResult {
  deploymentId: string;
  url: string;
  readyState: string;
}
