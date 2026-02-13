'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Rocket,
  Loader2,
  ExternalLink,
  CheckCircle2,
  MousePointerClick,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProject } from '@/lib/hooks/use-project';
import { useVisualEditorStore } from '@/stores/visual-editor-store';
import { toast } from 'sonner';

interface EditorTopbarProps {
  projectId: string;
}

export function EditorTopbar({ projectId }: EditorTopbarProps) {
  const router = useRouter();
  const { data: project } = useProject(projectId);

  const [downloading, setDownloading] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [vercelToken, setVercelToken] = useState('');
  const [vercelProjectName, setVercelProjectName] = useState('');

  const { isVisualEditorActive, toggleVisualEditor, hasUnsavedChanges } =
    useVisualEditorStore();

  const isExportable =
    project && ['generated', 'deployed'].includes(project.status);

  const isEditable =
    project && ['generated', 'deployed'].includes(project.status);

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

  const handleDeploy = async () => {
    if (!vercelToken || !vercelProjectName) {
      toast.error('Please fill in all fields');
      return;
    }

    setDeploying(true);
    try {
      const response = await fetch('/api/export/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          vercelToken,
          projectName: vercelProjectName,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Deployment failed');
      }

      const { data } = await response.json();
      setDeployUrl(data.url);
      toast.success('Deployed successfully!');
    } catch (error) {
      toast.error('Deployment failed', {
        description:
          error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <>
      <div className="flex h-12 md:h-14 items-center justify-between border-b px-2 md:px-4 bg-background flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-semibold truncate max-w-[120px] md:max-w-[200px]">
            {project?.name || 'Untitled Project'}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          <Button
            variant={isVisualEditorActive ? 'default' : 'outline'}
            size="sm"
            className={`h-8 px-2 md:px-3 relative ${
              isVisualEditorActive
                ? 'bg-primary text-primary-foreground'
                : ''
            }`}
            onClick={toggleVisualEditor}
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
            onClick={() => setDeployDialogOpen(true)}
            disabled={!isExportable}
          >
            <Rocket className="h-3 w-3 md:mr-2" />
            <span className="hidden md:inline">Deploy</span>
          </Button>
        </div>
      </div>

      <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy to Vercel</DialogTitle>
            <DialogDescription>
              Deploy your generated website live with one click.
            </DialogDescription>
          </DialogHeader>

          {deployUrl ? (
            <div className="flex items-center gap-3 rounded-lg border bg-green-50 dark:bg-green-950/30 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Deployed successfully!</p>
                <a
                  href={deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {deployUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Vercel API Token
                </label>
                <Input
                  type="password"
                  placeholder="Enter your Vercel token"
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Create a token at vercel.com/account/tokens
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  placeholder="my-awesome-site"
                  value={vercelProjectName}
                  onChange={(e) => setVercelProjectName(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {!deployUrl && (
              <Button
                onClick={handleDeploy}
                disabled={
                  deploying || !vercelToken || !vercelProjectName
                }
              >
                {deploying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="mr-2 h-4 w-4" />
                )}
                {deploying ? 'Deploying...' : 'Deploy'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
