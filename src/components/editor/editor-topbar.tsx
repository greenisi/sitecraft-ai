'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Globe,
  Loader2,
  ExternalLink,
  CheckCircle2,
  MousePointerClick,
  Copy,
  RefreshCw,
  Link2,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProject } from '@/lib/hooks/use-project';
import { usePublish } from '@/lib/hooks/use-publish';
import { useVisualEditorStore } from '@/stores/visual-editor-store';
import { useVisualEditorSave } from '@/lib/hooks/use-visual-editor-save';
import { isGenerating as bgIsGenerating } from '@/lib/generation/background-generation';
import { toast } from 'sonner';

interface EditorTopbarProps {
  projectId: string;
}

export function EditorTopbar({ projectId }: EditorTopbarProps) {
  const router = useRouter();
  const { data: project } = useProject(projectId);
  const { publish, isPublishing, reset: resetPublish } = usePublish(projectId);
  const [downloading, setDownloading] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDomainOptions, setShowDomainOptions] = useState(false);

  const {
    isVisualEditorActive,
    toggleVisualEditor,
    hasUnsavedChanges,
    pendingChanges,
    clearPendingChanges,
  } = useVisualEditorStore();
  const { save } = useVisualEditorSave(projectId);

  const isExportable =
    project &&
    ['generated', 'deployed', 'published'].includes(project.status);
  const isEditable =
    project &&
    ['generated', 'deployed', 'published'].includes(project.status);
  const isPublishable =
    project &&
    ['generated', 'deployed', 'published'].includes(project.status);
  const isAlreadyPublished =
    project?.status === 'published' && project?.published_url;

  const handleBack = useCallback(() => {
    if (bgIsGenerating(projectId)) {
      toast.info('Generation continues in the background', {
        description: 'Your website is still being built. Come back anytime to check progress.',
        duration: 4000,
      });
    }
    router.push('/dashboard');
  }, [projectId, router]);

  const handleToggleEditor = useCallback(() => {
    if (isVisualEditorActive && hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
    } else {
      toggleVisualEditor();
    }
  }, [isVisualEditorActive, hasUnsavedChanges, toggleVisualEditor]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/export/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Download failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (project?.slug || 'project') + '.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Project downloaded successfully');
    } catch (error) {
      toast.error('Download failed', {
        description:
          error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePublish = async () => {
    try {
      const result = await publish();
      if (result?.url) {
        setPublishedUrl(result.url);
      }
    } catch (error) {
      // Error toast is shown by the hook's onError handler
      console.error('Publish failed:', error);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const handleOpenPublishDialog = () => {
    // Reset state when opening
    if (isAlreadyPublished) {
      setPublishedUrl(project.published_url);
    } else {
      setPublishedUrl(null);
    }
    resetPublish();
    setShowDomainOptions(false);
    setPublishDialogOpen(true);
  };

  const platformDomain = 'innovated.site';
  const previewSubdomain = project?.slug
    ? `${project.slug}.${platformDomain}`
    : null;

  return (
    <>
      <div className="flex h-12 md:h-14 items-center justify-between border-b px-2 md:px-4 bg-background flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-semibold truncate max-w-[120px] md:max-w-[200px]">
            {project?.name || 'Untitled Project'}
          </h1>
          {isAlreadyPublished && (
            <a
              href={project.published_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="h-3 w-3" />
              Live
            </a>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          <Button
            variant={isVisualEditorActive ? 'default' : 'outline'}
            size="sm"
            className={`h-8 px-2 md:px-3 relative ${
              isVisualEditorActive ? 'bg-primary text-primary-foreground' : ''
            }`}
            onClick={handleToggleEditor}
            disabled={!isEditable}
          >
            <MousePointerClick className="h-3 w-3 md:mr-2" />
            <span className="hidden md:inline">Edit</span>
            {hasUnsavedChanges() && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange-500 border-2 border-background" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 md:px-3"
            onClick={handleDownload}
            disabled={!isExportable || downloading}
          >
            {downloading ? (
              <Loader2 className="h-3 w-3 animate-spin md:mr-2" />
            ) : (
              <Download className="h-3 w-3 md:mr-2" />
            )}
            <span className="hidden md:inline">Export</span>
          </Button>
          <Button
            size="sm"
            className="h-8 px-2 md:px-3"
            onClick={handleOpenPublishDialog}
            disabled={!isPublishable}
          >
            {isPublishing ? (
              <Loader2 className="h-3 w-3 animate-spin md:mr-2" />
            ) : (
              <Globe className="h-3 w-3 md:mr-2" />
            )}
            <span className="hidden md:inline">
              {isAlreadyPublished ? 'Published' : 'Publish'}
            </span>
          </Button>
        </div>
      </div>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {publishedUrl || isAlreadyPublished
                ? 'Your Site is Live!'
                : 'Publish Website'}
            </DialogTitle>
            <DialogDescription>
              {publishedUrl || isAlreadyPublished
                ? 'Your website is live and accessible at the URL below.'
                : 'Publish your website to a live URL with one click.'}
            </DialogDescription>
          </DialogHeader>

          {publishedUrl || isAlreadyPublished ? (
            <div className="space-y-4">
              {/* Success state */}
              <div className="flex items-center gap-3 rounded-lg border bg-green-50 dark:bg-green-950/30 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Published successfully!</p>
                  <a
                    href={publishedUrl || project?.published_url || ''}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    {publishedUrl || project?.published_url}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() =>
                    handleCopyUrl(publishedUrl || project?.published_url || '')
                  }
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Re-publish button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isPublishing
                  ? 'Re-publishing...'
                  : 'Re-publish with Latest Changes'}
              </Button>

              {/* Domain options */}
              {!showDomainOptions ? (
                <button
                  onClick={() => setShowDomainOptions(true)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center py-2"
                >
                  Want a custom domain?
                </button>
              ) : (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-medium">Custom Domain Options</p>
                  <div className="grid gap-2">
                    <button
                      onClick={() => {
                        setPublishDialogOpen(false);
                        router.push(
                          `/projects/${projectId}?tab=domains&action=search`
                        );
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Buy a Domain</p>
                        <p className="text-xs text-muted-foreground">
                          Search and register a new domain
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setPublishDialogOpen(false);
                        router.push(
                          `/projects/${projectId}?tab=domains&action=connect`
                        );
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Connect Your Domain
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Use a domain you already own
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Pre-publish info */}
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">
                  Your site will be published at:
                </p>
                <div className="flex items-center gap-2 bg-background rounded-md px-3 py-2 border">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <code className="text-sm text-primary truncate">
                    {previewSubdomain || 'your-site.innovated.site'}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can add a custom domain after publishing.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {!publishedUrl && !isAlreadyPublished && (
              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full sm:w-auto"
              >
                {isPublishing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="mr-2 h-4 w-4" />
                )}
                {isPublishing ? 'Publishing...' : 'Publish Now'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have {pendingChanges.length} unsaved{' '}
              {pendingChanges.length === 1 ? 'change' : 'changes'}. What would
              you like to do?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                clearPendingChanges();
                toggleVisualEditor();
                setShowUnsavedDialog(false);
              }}
            >
              Discard Changes
            </Button>
            <Button
              onClick={async () => {
                await save();
                toggleVisualEditor();
                setShowUnsavedDialog(false);
              }}
            >
              Save & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
                          }
