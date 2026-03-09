'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useGenerationStore } from '@/stores/generation-store';
import { cn } from '@/lib/utils/cn';
import type { GenerationStage } from '@/types/generation';

interface StepItem {
  id: GenerationStage;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

function getSteps(currentStage: GenerationStage | null): StepItem[] {
  const stages: { id: GenerationStage; label: string }[] = [
    { id: 'config-assembly', label: 'Preparing configuration' },
    { id: 'design-system', label: 'Creating design system' },
    { id: 'blueprint', label: 'Planning page structure' },
    { id: 'components', label: 'Building components' },
    { id: 'assembly', label: 'Final assembly' },
  ];
  const ORDER: Record<string, number> = {
    'config-assembly': 0,
    'design-system': 1,
    blueprint: 2,
    components: 3,
    assembly: 4,
    complete: 5,
    error: -1,
  };
  const currentIdx = currentStage ? ORDER[currentStage] ?? -1 : -1;
  return stages.map((s) => {
    const idx = ORDER[s.id] ?? -1;
    let status: StepItem['status'] = 'pending';
    if (idx < currentIdx || currentStage === 'complete') status = 'complete';
    else if (idx === currentIdx) status = 'active';
    return { ...s, status };
  });
}

const MAX_VISIBLE_COMPONENTS = 8;

function StageChecklist() {
  const { currentStage, progress, components, error, isGenerating } =
    useGenerationStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps = getSteps(currentStage);
  const isComplete = currentStage === 'complete';
  const isError = currentStage === 'error';

  // Component sub-items for the "components" stage
  const componentsList = Array.from(components.values());
  const activeComponent = componentsList.find((c) => c.status === 'generating');
  const completedComponents = componentsList.filter(
    (c) => c.status === 'complete'
  );

  // Show most recent completed + currently generating
  const visibleCompleted = completedComponents.slice(-MAX_VISIBLE_COMPONENTS);
  const hiddenCount = completedComponents.length - visibleCompleted.length;

  // "components" stage step
  const componentsStep = steps.find((s) => s.id === 'components');
  const showComponentsList =
    componentsStep &&
    (componentsStep.status === 'active' || componentsStep.status === 'complete') &&
    componentsList.length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border bg-card/50 overflow-hidden transition-all duration-500',
        isComplete
          ? 'border-green-500/20'
          : isError
          ? 'border-destructive/20'
          : 'border-border/50'
      )}
      style={{
        animation: mounted ? 'slideIn 0.4s ease both' : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg',
            isComplete
              ? 'bg-green-500/10'
              : isError
              ? 'bg-destructive/10'
              : 'bg-primary/10'
          )}
        >
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : isError ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Sparkles
              className="h-4 w-4 text-primary"
              style={{ animation: 'subtlePulse 2s ease-in-out infinite' }}
            />
          )}
        </div>
        <span
          className={cn(
            'text-sm font-semibold',
            isComplete
              ? 'text-green-500'
              : isError
              ? 'text-destructive'
              : 'text-foreground'
          )}
        >
          {isComplete
            ? 'Website built successfully'
            : isError
            ? 'Generation failed'
            : 'Building your website...'}
        </span>
      </div>

      {/* Stage list */}
      <div className="px-3 pb-1">
        {steps.map((step, index) => (
          <div key={step.id}>
            {/* Stage row */}
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg px-2 py-2 transition-all duration-300',
                step.status === 'active' && 'bg-primary/5'
              )}
              style={{
                animation: mounted
                  ? `slideIn 0.3s ease both ${index * 0.06}s`
                  : undefined,
              }}
            >
              {/* Icon */}
              <div className="flex h-5 w-5 items-center justify-center flex-shrink-0">
                {step.status === 'complete' ? (
                  <CheckCircle2
                    className="h-[18px] w-[18px] text-green-500"
                    style={{ animation: 'checkIn 0.35s ease both' }}
                  />
                ) : step.status === 'active' ? (
                  <Loader2 className="h-[18px] w-[18px] animate-spin text-primary" />
                ) : (
                  <Circle className="h-[18px] w-[18px] text-muted-foreground/25" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-sm transition-all duration-300',
                  step.status === 'active'
                    ? 'text-foreground font-medium'
                    : step.status === 'complete'
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/40'
                )}
              >
                {step.label}
                {step.id === 'components' &&
                  step.status === 'active' &&
                  progress.total > 0 && (
                    <span className="text-primary/70 ml-1.5 text-xs font-normal">
                      ({progress.completed}/{progress.total})
                    </span>
                  )}
              </span>
            </div>

            {/* Component sub-items (under "Building components") */}
            {step.id === 'components' && showComponentsList && (
              <div className="ml-5 pl-4 border-l border-border/30 mb-1">
                {hiddenCount > 0 && (
                  <div
                    className="flex items-center gap-2 py-1 px-2"
                    style={{ animation: 'slideIn 0.25s ease both' }}
                  >
                    <span className="text-xs text-muted-foreground/40 font-mono">
                      ... {hiddenCount} more file
                      {hiddenCount > 1 ? 's' : ''} built
                    </span>
                  </div>
                )}
                {visibleCompleted.map((comp) => {
                  const fileName = comp.filePath
                    ? comp.filePath.split('/').pop() || comp.name
                    : comp.name;
                  return (
                    <div
                      key={comp.name}
                      className="flex items-center gap-2 py-1 px-2"
                      style={{ animation: 'slideIn 0.25s ease both' }}
                    >
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-green-500/70 flex-shrink-0"
                        style={{ animation: 'checkIn 0.3s ease both' }}
                      />
                      <span className="text-xs font-mono text-muted-foreground/60 truncate">
                        {fileName}
                      </span>
                    </div>
                  );
                })}
                {activeComponent && (
                  <div
                    className="flex items-center gap-2 py-1 px-2 rounded-md bg-primary/5"
                    style={{ animation: 'slideIn 0.25s ease both' }}
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary flex-shrink-0" />
                    <span className="text-xs font-mono text-foreground/80 truncate">
                      {activeComponent.filePath
                        ? activeComponent.filePath.split('/').pop() ||
                          activeComponent.name
                        : activeComponent.name}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error message with retry */}
      {isError && error && (
        <div className="mx-3 mb-3 rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2.5">
          <p className="text-xs text-destructive/80 mb-2">{error}</p>
          <p className="text-xs text-muted-foreground">
            Try sending your request again, or describe what you want differently.
          </p>
        </div>
      )}

      {/* Overall progress bar at bottom */}
      {isGenerating && progress.total > 0 && (
        <div className="px-4 pb-3">
          <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(Math.round((progress.completed / progress.total) * 100), 100)}%`,
                background: 'linear-gradient(90deg, hsl(var(--primary)), #22c55e)',
              }}
            />
          </div>
        </div>
      )}

      {/* Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes checkIn {
              0% { transform: scale(0); opacity: 0; }
              60% { transform: scale(1.15); }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes subtlePulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
          `,
        }}
      />
    </div>
  );
}

export function GenerationProgress() {
  const { currentStage, isGenerating } = useGenerationStore();
  // Show during generation, when complete, or on error
  if (!isGenerating && currentStage !== 'complete' && currentStage !== 'error')
    return null;

  return (
    <div className="py-2">
      <StageChecklist />
    </div>
  );
}
