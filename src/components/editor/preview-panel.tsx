'use client';

import { useGeneratedFiles } from '@/lib/hooks/use-preview';
import { useGenerationStore } from '@/stores/generation-store';
import { PreviewFrame } from '@/components/preview/preview-frame';
import { Loader2, Monitor } from 'lucide-react';

interface PreviewPanelProps {
  projectId: string;
}

export function PreviewPanel({ projectId }: PreviewPanelProps) {
  const { data: generated } = useGeneratedFiles(projectId);
  const { files: realtimeFiles, isGenerating, progress } = useGenerationStore();

  // Use real-time files during generation, persisted files after
  const hasRealtimeFiles = Object.keys(realtimeFiles).length > 0;
  const files = isGenerating || hasRealtimeFiles
    ? realtimeFiles
    : (generated?.files || {});
  const hasFiles = Object.keys(files).length > 0;

  if (!hasFiles) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4 text-center px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Monitor className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Preview</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Describe your website in the chat and the preview will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {isGenerating && (
        <div className="flex items-center gap-2 border-b px-4 py-2 bg-primary/5">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">
            Generating... ({progress.completed}/{progress.total} components)
          </span>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <PreviewFrame files={files} projectId={projectId} />
      </div>
    </div>
  );
}
