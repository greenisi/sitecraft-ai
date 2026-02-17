'use client';

import { useEffect, useRef, useState } from 'react';
import { useGeneratedFiles } from '@/lib/hooks/use-preview';
import { useGenerationStore } from '@/stores/generation-store';
import { PreviewFrame } from '@/components/preview/preview-frame';
import { Monitor } from 'lucide-react';

interface PreviewPanelProps {
  projectId: string;
}

// Syntax-highlight token categories for coloring
function tokenColor(line: string): string {
  if (/^(import|export|from|const|let|var|function|return|default|type|interface|class|extends|implements|async|await|if|else|for|while|switch|case|break|new|typeof|keyof|void|null|undefined|true|false)\b/.test(line.trim())) return '#c792ea';
  if (/^(//|/*)/.test(line.trim())) return '#546e7a';
  if (/className=|style=|onClick=|onChange=/.test(line)) return '#82aaff';
  if (/<[A-Z]/.test(line)) return '#ffcb6b';
  return '#eeffff';
}

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

  // Collect streaming code lines from component-chunk events
  const codeLines = useRef<string[]>([]);
  const lastEventCount = useRef(0);

  // Process new chunk events into lines
  const chunkEvents = events.filter(e => e.type === 'component-chunk' || e.type === 'component-complete' || e.type === 'component-start' || e.type === 'stage-start');
  if (chunkEvents.length > lastEventCount.current) {
    const newEvents = chunkEvents.slice(lastEventCount.current);
    lastEventCount.current = chunkEvents.length;
    for (const ev of newEvents) {
      if (ev.type === 'stage-start' && ev.stage) {
        codeLines.current.push(``, `// ── Stage: ${ev.stage} ───────────────────────────────────────`, ``);
      } else if (ev.type === 'component-start' && ev.componentName) {
        codeLines.current.push(``, `// ┌─ ${ev.componentName} ─────────────────────────────────────`);
      } else if (ev.type === 'component-complete' && ev.file) {
        codeLines.current.push(`// └─ ${ev.file.path} ✓`, ``);
      } else if (ev.type === 'component-chunk' && ev.chunk) {
        const raw = ev.chunk.replace(/\r/g, '');
        const parts = raw.split('\n');
        for (const part of parts) {
          if (part !== '') codeLines.current.push(part);
        }
      }
    }
  }

  // When generation completes, wait a beat then show preview
  useEffect(() => {
    if (!isGenerating && Object.keys(realtimeFiles).length > 0) {
      const timer = setTimeout(() => setShowPreview(true), 800);
      return () => clearTimeout(timer);
    }
    if (isGenerating) {
      setShowPreview(false);
    }
  }, [isGenerating, realtimeFiles]);

  // Reset on new generation start
  useEffect(() => {
    if (isGenerating && currentStage === 'config-assembly') {
      codeLines.current = [];
      lastEventCount.current = 0;
      setShowPreview(false);
    }
  }, [isGenerating, currentStage]);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current && isGenerating) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [events.length, isGenerating]);

  // Determine what files to show in the preview frame
  const hasRealtimeFiles = Object.keys(realtimeFiles).length > 0;
  const files = hasRealtimeFiles ? realtimeFiles : (generated?.files || {});
  const hasFiles = Object.keys(files).length > 0;

  // --- Empty state ---
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
              Describe your website in the chat and the preview will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Code animation during generation ---
  if (isGenerating && !showPreview) {
    const progressPercent = progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

    const stageLabels: Record<string, string> = {
      'config-assembly': 'Assembling config...',
      'design-system': 'Generating design tokens...',
      blueprint: 'Planning architecture...',
      components: `Building components (${progress.completed}/${progress.total})`,
      assembly: 'Assembling project...',
    };
    const stageLabel = currentStage ? (stageLabels[currentStage] ?? currentStage) : 'Starting...';

    // Get current component being generated
    const generatingComp = Array.from(components.values()).find(c => c.status === 'generating');
    const activeFile = generatingComp?.filePath ?? generatingComp?.name ?? '';

    // Last 120 lines of code
    const displayLines = codeLines.current.slice(-120);

    return (
      <div className="flex h-full flex-col bg-[#0d1117] font-mono text-xs">
        {/* Terminal header */}
        <div className="flex items-center gap-2 border-b border-[#21262d] bg-[#161b22] px-4 py-2.5 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[#8b949e] text-xs ml-2">sitecraft-ai — generating</span>
          <div className="ml-auto flex items-center gap-2">
            {activeFile && (
              <span className="text-[#58a6ff] truncate max-w-[220px] text-[11px]">
                {activeFile}
              </span>
            )}
            <span className="text-[#3fb950] text-[11px]">{stageLabel}</span>
          </div>
        </div>

        {/* Code output */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-y-auto px-4 py-3 select-none"
          style={{ scrollBehavior: 'smooth' }}
        >
          {displayLines.map((line, i) => {
            const isComment = line.trim().startsWith('//');
            const isStageHeader = line.includes('── Stage:') || line.includes('┌─') || line.includes('└─');
            return (
              <div
                key={i}
                className="leading-5 whitespace-pre-wrap break-all"
                style={{
                  color: isStageHeader
                    ? '#58a6ff'
                    : isComment
                    ? '#546e7a'
                    : tokenColor(line),
                  opacity: i < displayLines.length - 30 ? 0.55 : 1,
                }}
              >
                {line || '\u00a0'}
              </div>
            );
          })}
          {/* Blinking cursor */}
          <div className="inline-block h-4 w-2 bg-[#58a6ff] animate-pulse ml-0.5" />
        </div>

        {/* Progress bar */}
        <div className="border-t border-[#21262d] bg-[#161b22] px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between text-[10px] text-[#8b949e] mb-1.5">
            <span>{stageLabel}</span>
            {progress.total > 0 && (
              <span className="text-[#3fb950]">{progress.completed}/{progress.total} files</span>
            )}
          </div>
          <div className="h-1 w-full rounded-full bg-[#21262d] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: currentStage === 'components'
                  ? `${progressPercent}%`
                  : currentStage === 'config-assembly' ? '8%'
                  : currentStage === 'design-system' ? '20%'
                  : currentStage === 'blueprint' ? '35%'
                  : currentStage === 'assembly' ? '95%'
                  : '2%',
                background: 'linear-gradient(90deg, #1f6feb, #388bfd)',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // --- Preview (after generation or existing files) ---
  const isStillGenerating = isGenerating && showPreview;
  return (
    <div className="flex h-full flex-col">
      {isStillGenerating && (
        <div className="flex items-center gap-2 border-b px-4 py-2 bg-primary/5 flex-shrink-0">
          <div className="h-3 w-3 rounded-full bg-[#3fb950] animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">
            Generation complete — preview ready
          </span>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <PreviewFrame files={files} projectId={projectId} />
      </div>
    </div>
  );
}
