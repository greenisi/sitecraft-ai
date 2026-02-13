'use client';

import { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Code2,
  Palette,
  LayoutTemplate,
  Package,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGenerationStore, type ComponentStatus } from '@/stores/generation-store';
import type { GenerationStage } from '@/types/generation';

// --------------------------------------------------------------------------
// Stage metadata
// --------------------------------------------------------------------------

interface StageInfo {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGE_INFO: Record<string, StageInfo> = {
  'config-assembly': {
    label: 'Preparing',
    description: 'Assembling generation configuration',
    icon: Package,
  },
  'design-system': {
    label: 'Design System',
    description: 'Generating colors, typography, and tokens',
    icon: Palette,
  },
  blueprint: {
    label: 'Blueprint',
    description: 'Planning site architecture and pages',
    icon: LayoutTemplate,
  },
  components: {
    label: 'Components',
    description: 'Building React components',
    icon: Code2,
  },
  assembly: {
    label: 'Assembly',
    description: 'Combining files into final project',
    icon: Package,
  },
  complete: {
    label: 'Complete',
    description: 'Generation finished successfully',
    icon: Sparkles,
  },
};

const STAGE_ORDER: GenerationStage[] = [
  'config-assembly',
  'design-system',
  'blueprint',
  'components',
  'assembly',
  'complete',
];

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export default function GenerationProgress() {
  const {
    currentStage,
    progress,
    components,
    isGenerating,
    error,
    events,
  } = useGenerationStore();

  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll event log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  const currentStageIndex = currentStage
    ? STAGE_ORDER.indexOf(currentStage)
    : -1;

  const progressPercent =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Stage Pipeline */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Generation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stage steps */}
          <div className="space-y-3">
            {STAGE_ORDER.filter((s) => s !== 'complete').map((stage, index) => {
              const info = STAGE_INFO[stage];
              const stageIdx = STAGE_ORDER.indexOf(stage);
              const isActive = currentStage === stage;
              const isCompleted = currentStageIndex > stageIdx;
              const isError = currentStage === 'error' && isActive;
              const Icon = info.icon;

              return (
                <div
                  key={stage}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
                    isActive && !isError && 'border-primary/50 bg-primary/5',
                    isCompleted && 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950',
                    isError && 'border-destructive/50 bg-destructive/5',
                    !isActive && !isCompleted && !isError && 'border-muted opacity-60'
                  )}
                >
                  <StageStatusIcon
                    isActive={isActive}
                    isCompleted={isCompleted}
                    isError={isError}
                  />
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{info.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {info.description}
                    </p>
                  </div>
                  {isActive && stage === 'components' && progress.total > 0 && (
                    <Badge variant="secondary" className="shrink-0">
                      {progress.completed}/{progress.total}
                    </Badge>
                  )}
                  {isCompleted && (
                    <Badge variant="success" className="shrink-0">
                      Done
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall progress bar */}
          {isGenerating && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>
                  {currentStage && STAGE_INFO[currentStage]
                    ? STAGE_INFO[currentStage].label
                    : 'Starting...'}
                </span>
                {currentStage === 'components' && progress.total > 0 && (
                  <span>{progressPercent}%</span>
                )}
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500 ease-out',
                    error
                      ? 'bg-destructive'
                      : 'bg-primary'
                  )}
                  style={{
                    width: getOverallProgress(currentStage, progressPercent),
                  }}
                />
              </div>
            </div>
          )}

          {/* Completion state */}
          {currentStage === 'complete' && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Generation Complete
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {progress.total} files generated successfully
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Generation Failed
                </p>
                <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component list (visible during/after component generation) */}
      {components.size > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(components.values()).map((comp) => (
                <div
                  key={comp.name}
                  className="flex items-center gap-3 text-sm"
                >
                  <ComponentStatusIcon status={comp.status} />
                  <span
                    className={cn(
                      'flex-1 min-w-0 truncate',
                      comp.status === 'complete' && 'text-muted-foreground'
                    )}
                  >
                    {comp.name}
                  </span>
                  {comp.filePath && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {comp.filePath}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event log */}
      {events.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Generation Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48 w-full rounded-md border bg-muted/30">
              <div className="p-3 font-mono text-xs space-y-1">
                {events
                  .filter(
                    (e) =>
                      e.type !== 'component-chunk' // Filter out noisy chunk events
                  )
                  .map((event, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex gap-2',
                        event.type === 'error' && 'text-destructive'
                      )}
                    >
                      <span className="text-muted-foreground shrink-0">
                        {formatEventType(event.type)}
                      </span>
                      <span className="truncate">
                        {formatEventMessage(event)}
                      </span>
                    </div>
                  ))}
                <div ref={logEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

function StageStatusIcon({
  isActive,
  isCompleted,
  isError,
}: {
  isActive: boolean;
  isCompleted: boolean;
  isError: boolean;
}) {
  if (isError) {
    return <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />;
  }
  if (isCompleted) {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />;
  }
  if (isActive) {
    return <Loader2 className="h-4 w-4 shrink-0 text-primary animate-spin" />;
  }
  return <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />;
}

function ComponentStatusIcon({ status }: { status: ComponentStatus }) {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />;
    case 'generating':
      return <Loader2 className="h-3.5 w-3.5 shrink-0 text-primary animate-spin" />;
    case 'error':
      return <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />;
    default:
      return <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />;
  }
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function getOverallProgress(
  stage: GenerationStage | null,
  componentPercent: number
): string {
  if (!stage) return '0%';

  // Each stage gets a portion of the overall progress bar
  const stageWeights: Record<string, { start: number; end: number }> = {
    'config-assembly': { start: 0, end: 5 },
    'design-system': { start: 5, end: 20 },
    blueprint: { start: 20, end: 35 },
    components: { start: 35, end: 90 },
    assembly: { start: 90, end: 100 },
    complete: { start: 100, end: 100 },
    error: { start: 0, end: 0 },
  };

  const weight = stageWeights[stage];
  if (!weight) return '0%';

  if (stage === 'components') {
    const stageProgress = weight.start + ((weight.end - weight.start) * componentPercent) / 100;
    return `${Math.round(stageProgress)}%`;
  }

  // For non-component stages, show the end of that stage's range
  return `${weight.end}%`;
}

function formatEventType(type: string): string {
  const labels: Record<string, string> = {
    'stage-start': '[STAGE]',
    'stage-complete': '[DONE]',
    'component-start': '[BUILD]',
    'component-complete': '[FILE]',
    'generation-complete': '[OK]',
    error: '[ERR]',
  };
  return labels[type] ?? `[${type.toUpperCase()}]`;
}

function formatEventMessage(event: {
  type: string;
  stage?: string;
  componentName?: string;
  file?: { path: string };
  error?: string;
  totalFiles?: number;
}): string {
  switch (event.type) {
    case 'stage-start':
      return `Starting ${STAGE_INFO[event.stage ?? '']?.label ?? event.stage}`;
    case 'stage-complete':
      return `Completed ${STAGE_INFO[event.stage ?? '']?.label ?? event.stage}`;
    case 'component-start':
      return `Generating ${event.componentName}`;
    case 'component-complete':
      return `${event.file?.path ?? event.componentName}`;
    case 'generation-complete':
      return `All ${event.totalFiles} files generated`;
    case 'error':
      return event.error ?? 'Unknown error';
    default:
      return event.stage ?? '';
  }
}
