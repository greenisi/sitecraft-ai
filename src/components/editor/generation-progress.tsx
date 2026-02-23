'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  Code2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useGenerationStore, type ComponentState } from '@/stores/generation-store';
import type { GenerationStage } from '@/types/generation';

interface StepItem {
  id: GenerationStage;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

function getSteps(currentStage: GenerationStage | null): StepItem[] {
  const stages: { id: GenerationStage; label: string }[] = [
    { id: 'config-assembly', label: 'Preparing configuration' },
    { id: 'design-system', label: 'Generating design system' },
    { id: 'blueprint', label: 'Planning page structure' },
    { id: 'components', label: 'Building components' },
    { id: 'assembly', label: 'Assembling project' },
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

function StepIcon({ status }: { status: StepItem['status'] }) {
  if (status === 'complete') {
    return <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />;
  }
  if (status === 'active') {
    return (
      <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
    );
  }
  return <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />;
}

function LiveCodeViewer() {
  const { components } = useGenerationStore();
  const codeRef = useRef<HTMLPreElement>(null);
  const [expanded, setExpanded] = useState(true);

  // Get current streaming component
  const activeComponent = Array.from(components.values()).find(
    (c) => c.status === 'generating'
  );
  const latestComplete = Array.from(components.values())
    .filter((c) => c.status === 'complete')
    .pop();
  const displayComponent = activeComponent || latestComplete;

  // Auto-scroll code viewer
  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [displayComponent?.chunks]);

  const codeContent = displayComponent
    ? displayComponent.chunks.join('')
    : '';

  const displayName = displayComponent?.name || 'Waiting...';

  if (!codeContent) return null;

  return (
    <div className="mt-3 rounded-lg border border-border/50 overflow-hidden bg-[#0d1117]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs bg-[#161b22] text-gray-400 hover:text-gray-300 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Code2 className="h-3 w-3" />
          <span className="font-mono">{displayName}</span>
          {activeComponent && (
            <span className="flex items-center gap-1 text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              writing
            </span>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
      {expanded && (
        <pre
          ref={codeRef}
          className="p-3 text-[11px] leading-relaxed font-mono text-gray-300 max-h-48 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        >
          {codeContent}
          {activeComponent && (
            <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </pre>
      )}
    </div>
  );
}

export function GenerationProgress() {
  const { currentStage, progress, isGenerating, components } =
    useGenerationStore();

  if (!isGenerating && currentStage !== 'complete') return null;

  const steps = getSteps(currentStage);
  const completedFiles = Array.from(components.values()).filter(
    (c) => c.status === 'complete'
  );

  return (
    <div className="py-3">
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            <span className="text-sm font-medium">
              {isGenerating ? 'Building your website...' : 'Build complete!'}
            </span>
          </div>
          {progress.total > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              {progress.completed}/{progress.total} files
            </span>
          )}
        </div>

        {/* Progress bar */}
        {progress.total > 0 && (
          <div className="h-1 bg-muted/30">
            <div
              className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500 ease-out"
              style={{
                width: `${Math.round(
                  (progress.completed / progress.total) * 100
                )}%`,
              }}
            />
          </div>
        )}

        {/* Checklist */}
        <div className="px-4 py-3 space-y-2">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`flex items-center gap-2.5 transition-all duration-500 ${
                step.status === 'pending'
                  ? 'opacity-40'
                  : step.status === 'active'
                  ? 'opacity-100'
                  : 'opacity-70'
              }`}
              style={{
                animationDelay: `${i * 100}ms`,
              }}
            >
              <StepIcon status={step.status} />
              <span
                className={`text-xs ${
                  step.status === 'active'
                    ? 'text-foreground font-medium'
                    : step.status === 'complete'
                    ? 'text-muted-foreground line-through'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
                {step.id === 'components' &&
                  step.status === 'active' &&
                  progress.total > 0 &&
                  ` (${progress.completed}/${progress.total})`}
              </span>
            </div>
          ))}
        </div>

        {/* Completed files list */}
        {completedFiles.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-1">
              {completedFiles.slice(-8).map((file) => (
                <span
                  key={file.name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[10px] font-mono"
                >
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {file.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Live Code Viewer */}
        <div className="px-4 pb-3">
          <LiveCodeViewer />
        </div>
      </div>
    </div>
  );
      }
