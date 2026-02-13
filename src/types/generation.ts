export interface GeneratedFile {
  id: string;
  project_id: string;
  version_id: string;
  file_path: string;
  content: string;
  file_type: 'component' | 'page' | 'config' | 'style' | 'data';
  section_type: string | null;
  tokens_used: number | null;
  created_at: string;
}

export interface GenerationVersion {
  id: string;
  project_id: string;
  version_number: number;
  status: 'pending' | 'generating' | 'complete' | 'error';
  trigger_type: 'initial' | 'full-regenerate' | 'section-edit' | 'style-change';
  trigger_details: Record<string, unknown> | null;
  total_tokens_used: number;
  generation_time_ms: number | null;
  model_used: string | null;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

export type GenerationStage =
  | 'config-assembly'
  | 'design-system'
  | 'blueprint'
  | 'components'
  | 'assembly'
  | 'complete'
  | 'error';

export interface GenerationEvent {
  type:
    | 'stage-start'
    | 'stage-complete'
    | 'component-start'
    | 'component-chunk'
    | 'component-complete'
    | 'generation-complete'
    | 'error';
  stage?: GenerationStage;
  componentName?: string;
  chunk?: string;
  file?: { path: string; content: string };
  totalFiles?: number;
  completedFiles?: number;
  error?: string;
}

export interface VirtualFile {
  path: string;
  content: string;
  type: 'component' | 'page' | 'config' | 'style' | 'data';
}

export class VirtualFileTree {
  private files: Map<string, VirtualFile> = new Map();

  addFile(path: string, content: string, type: VirtualFile['type'] = 'component') {
    this.files.set(path, { path, content, type });
  }

  getFile(path: string): VirtualFile | undefined {
    return this.files.get(path);
  }

  removeFile(path: string) {
    this.files.delete(path);
  }

  entries(): IterableIterator<[string, VirtualFile]> {
    return this.files.entries();
  }

  toRecord(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [path, file] of this.files) {
      result[path] = file.content;
    }
    return result;
  }

  get size(): number {
    return this.files.size;
  }
}
