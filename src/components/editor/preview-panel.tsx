'use client';

import { useEffect, useRef, useState } from 'react';
import { useGeneratedFiles } from '@/lib/hooks/use-preview';
import { useGenerationStore } from '@/stores/generation-store';
import { PreviewFrame } from '@/components/preview/preview-frame';
import { Monitor, Check, Loader2, Circle } from 'lucide-react';

interface PreviewPanelProps {
  projectId: string;
}

// Simple token coloring for the code viewer
function getLineColor(line: string): string {
  const t = line.trim();
  if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'))
    return '#546e7a';
  if (
    t.startsWith('import ') ||
    t.startsWith('export ') ||
    t.startsWith('const ') ||
    t.startsWith('let ') ||
    t.startsWith('return ') ||
    t.startsWith('function ') ||
    t.startsWith('type ') ||
    t.startsWith('interface ') ||
    t.startsWith('async ') ||
    t.startsWith('await ') ||
    t.startsWith('if (') ||
    t.startsWith('} else') ||
    t.startsWith('class ') ||
    t.startsWith('default ')
  )
    return '#c792ea';
  if (
    t.includes('className=') ||
    t.includes('style=') ||
    t.includes('onClick=')
  )
    return '#82aaff';
  if (/^<[A-Z]/.test(t) || t.startsWith('</')) return '#ffcb6b';
  if (t.startsWith('<') && !t.startsWith('<!')) return '#f07178';
  if (t.includes(': ') || t.includes('= ')) return '#89ddff';
  return '#eeffff';
}

// Generation steps for the checklist
const GENERATION_STEPS = [
  {
    id: 'config-assembly',
    label: 'Preparing Configuration',
    description: 'Setting up your project settings',
  },
  {
    id: 'design-system',
    label: 'Creating Design System',
    description: 'Colors, fonts, and visual tokens',
  },
  {
    id: 'blueprint',
    label: 'Planning Architecture',
    description: 'Page structure and layouts',
  },
  {
    id: 'components',
    label: 'Building Components',
    description: 'Generating React components',
  },
  {
    id: 'assembly',
    label: 'Final Assembly',
    description: 'Combining everything together',
  },
];

export function PreviewPanel({ projectId }: PreviewPanelProps) {
  const { data: generated } = useGeneratedFiles(projectId);
  const {
    files: realtimeFiles,
    isGenerating,
    progress,
    currentStage,
    components,
    events,
  } = useGenerationStore();

  const terminalRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const codeBuffer = useRef<string[]>([]);
  const processedEvents = useRef(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Process streaming chunk events into display lines
  const totalEvents = events.length;
  if (totalEvents > processedEvents.current) {
    const newEvs = events.slice(processedEvents.current);
    processedEvents.current = totalEvents;
    for (const ev of newEvs) {
      if (ev.type === 'component-start' && ev.componentName) {
        codeBuffer.current.push(
          '',
          '// ── ' + ev.componentName + ' ────────────────────'
        );
      } else if (ev.type === 'component-chunk' && ev.chunk) {
        const lines = ev.chunk.split('\n');
        for (const l of lines) {
          if (l !== '') codeBuffer.current.push(l);
        }
      } else if (ev.type === 'component-complete' && ev.file) {
        codeBuffer.current.push('// ✓ ' + ev.file.path, '');
      }
    }
  }

  // Track completed stages for the checklist animation
  useEffect(() => {
    if (!currentStage) return;

    const stageIndex = GENERATION_STEPS.findIndex(
      (s) => s.id === currentStage
    );
    if (stageIndex > 0) {
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        for (let i = 0; i < stageIndex; i++) {
          next.add(GENERATION_STEPS[i].id);
        }
        return next;
      });
    }
    if (currentStage === 'complete') {
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        GENERATION_STEPS.forEach((s) => next.add(s.id));
        return next;
      });
    }
  }, [currentStage]);

  // After generation ends, show preview
  useEffect(() => {
    if (!isGenerating && Object.keys(realtimeFiles).length > 0) {
      const t = setTimeout(() => setShowPreview(true), 1200);
      return () => clearTimeout(t);
    }
    if (isGenerating) setShowPreview(false);
  }, [isGenerating, realtimeFiles]);

  // Reset on new generation
  useEffect(() => {
    if (isGenerating && currentStage === 'config-assembly') {
      codeBuffer.current = [];
      processedEvents.current = 0;
      setCompletedSteps(new Set());
      setShowPreview(false);
    }
  }, [isGenerating, currentStage]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current && isGenerating) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  });

  const hasRealtimeFiles = Object.keys(realtimeFiles).length > 0;
  const files = hasRealtimeFiles
    ? realtimeFiles
    : generated?.files || {};
  const hasFiles = Object.keys(files).length > 0;

  // Empty state
  if (!hasFiles && !isGenerating) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4 text-center px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Monitor className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Preview</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Describe your website in the chat and the preview will
              appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---- GENERATION IN PROGRESS: Show live code + checklist ----
  if (isGenerating && !showPreview) {
    const activeComp = Array.from(components.values()).find(
      (c) => c.status === 'generating'
    );
    const activeFile = activeComp?.name ?? '';
    const displayLines = codeBuffer.current.slice(-150);

    return (
      <div className="flex h-full flex-col bg-[#0d1117]">
        {/* Mac-style terminal header */}
        <div className="flex items-center gap-2 border-b border-[#21262d] bg-[#161b22] px-4 py-2.5 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[#8b949e] ml-2 text-[11px]">
            innovated-marketing — building your website
          </span>
          {activeFile && (
            <span className="ml-auto text-[#58a6ff] truncate max-w-[200px] text-[11px]">
              {activeFile}
            </span>
          )}
        </div>

        {/* Main content: checklist + code side by side */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Step-by-step checklist */}
          <div className="w-[280px] flex-shrink-0 border-r border-[#21262d] bg-[#0d1117] p-4 overflow-y-auto hidden md:block">
            <div className="mb-4">
              <h3 className="text-[#e6edf3] text-sm font-semibold mb-1">
                Build Progress
              </h3>
              <p className="text-[#8b949e] text-[11px]">
                {progress.total > 0
                  ? progress.completed +
                    ' of ' +
                    progress.total +
                    ' files generated'
                  : 'Starting generation...'}
              </p>
            </div>

            <div className="space-y-1">
              {GENERATION_STEPS.map((step) => {
                const isCompleted = completedSteps.has(step.id);
                const isActive = currentStage === step.id;
                const isPending = !isCompleted && !isActive;

                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-500 ${
                      isActive
                        ? 'bg-[#1f6feb]/10 border border-[#1f6feb]/30'
                        : isCompleted
                        ? 'bg-[#238636]/8'
                        : 'opacity-40'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isCompleted ? (
                        <div className="h-5 w-5 rounded-full bg-[#238636] flex items-center justify-center animate-in zoom-in duration-300">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      ) : isActive ? (
                        <div className="h-5 w-5 rounded-full border-2 border-[#1f6feb] flex items-center justify-center">
                          <Loader2 className="h-3 w-3 text-[#58a6ff] animate-spin" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-[#30363d] flex items-center justify-center">
                          <Circle className="h-2.5 w-2.5 text-[#484f58]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-[13px] font-medium leading-tight ${
                          isCompleted
                            ? 'text-[#3fb950]'
                            : isActive
                            ? 'text-[#e6edf3]'
                            : 'text-[#8b949e]'
                        }`}
                      >
                        {step.label}
                        {isActive &&
                          step.id === 'components' &&
                          progress.total > 0 &&
                          ' (' +
                            progress.completed +
                            '/' +
                            progress.total +
                            ')'}
                      </p>
                      <p className="text-[11px] text-[#8b949e] leading-tight mt-0.5">
                        {isCompleted
                          ? 'Completed'
                          : isActive
                          ? step.description
                          : 'Waiting...'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall progress bar */}
            <div className="mt-5">
              <div className="h-1.5 w-full rounded-full bg-[#21262d] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: getOverallWidth(currentStage, progress),
                    background:
                      'linear-gradient(90deg, #238636, #3fb950)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: Live code stream */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile: compact progress bar */}
            <div className="md:hidden border-b border-[#21262d] bg-[#161b22] px-3 py-2">
              <div className="flex items-center justify-between text-[10px] text-[#8b949e] mb-1">
                <span>
                  {currentStage
                    ? GENERATION_STEPS.find(
                        (s) => s.id === currentStage
                      )?.label ?? 'Building...'
                    : 'Starting...'}
                </span>
                {progress.total > 0 && (
                  <span className="text-[#3fb950]">
                    {progress.completed}/{progress.total}
                  </span>
                )}
              </div>
              <div className="h-1 w-full rounded-full bg-[#21262d] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: getOverallWidth(currentStage, progress),
                    background:
                      'linear-gradient(90deg, #238636, #3fb950)',
                  }}
                />
              </div>
            </div>

            {/* Scrolling code output */}
            <div
              ref={terminalRef}
              className="flex-1 overflow-y-auto px-4 py-3 leading-5 font-mono text-xs"
              style={{ overflowAnchor: 'none' }}
            >
              {displayLines.map((line, i) => {
                const isHeader =
                  line.startsWith('// ──') ||
                  line.startsWith('// ✓');
                return (
                  <div
                    key={i}
                    className="whitespace-pre-wrap break-all leading-[1.5]"
                    style={{
                      color: isHeader
                        ? line.startsWith('// ✓')
                          ? '#3fb950'
                          : '#58a6ff'
                        : getLineColor(line),
                      opacity:
                        i < displayLines.length - 60 ? 0.35 : 1,
                      transition: 'opacity 0.3s',
                    }}
                  >
                    {line || '\u00a0'}
                  </div>
                );
              })}
              <span className="inline-block h-[14px] w-[7px] bg-[#58a6ff] animate-pulse align-middle" />
            </div>
          </div>
        </div>

        {/* Footer status bar */}
        <div className="border-t border-[#21262d] bg-[#161b22] px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#3fb950] animate-pulse" />
              <span className="text-[#8b949e]">
                {activeFile
                  ? 'Generating: ' + activeFile
                  : currentStage
                  ? GENERATION_STEPS.find(
                      (s) => s.id === currentStage
                    )?.label ?? 'Building...'
                  : 'Starting...'}
              </span>
            </div>
            {progress.total > 0 && (
              <span className="text-[#3fb950] font-medium">
                {progress.completed}/{progress.total} files
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- PREVIEW (after generation or existing files) ----
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <PreviewFrame files={files} projectId={projectId} />
      </div>
    </div>
  );
}

// Helper to compute overall progress bar width
function getOverallWidth(
  stage: string | null,
  progress: { total: number; completed: number }
): string {
  if (!stage) return '2%';
  const pct =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;
  const weights: Record<string, { start: number; end: number }> = {
    'config-assembly': { start: 0, end: 8 },
    'design-system': { start: 8, end: 22 },
    blueprint: { start: 22, end: 38 },
    components: { start: 38, end: 92 },
    assembly: { start: 92, end: 100 },
    complete: { start: 100, end: 100 },
  };
  const w = weights[stage];
  if (!w) return '2%';
  if (stage === 'components') {
    return Math.round(w.start + ((w.end - w.start) * pct) / 100) + '%';
  }
  return w.end + '%';
}
