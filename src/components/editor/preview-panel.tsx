'use client';

import { useEffect, useRef, useState } from 'react';
import { useGeneratedFiles } from '@/lib/hooks/use-preview';
import { useGenerationStore } from '@/stores/generation-store';
import { PreviewFrame } from '@/components/preview/preview-frame';
import { Monitor } from 'lucide-react';

interface PreviewPanelProps {
  projectId: string;
}

// Simple token coloring without complex regexes
function getLineColor(line: string): string {
  const t = line.trim();
  if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return '#546e7a';
  if (t.startsWith('import ') || t.startsWith('export ') || t.startsWith('const ') ||
      t.startsWith('let ') || t.startsWith('return ') || t.startsWith('function ') ||
      t.startsWith('type ') || t.startsWith('interface ') || t.startsWith('async ') ||
      t.startsWith('await ') || t.startsWith('if (') || t.startsWith('} else') ||
      t.startsWith('class ') || t.startsWith('default ')) return '#c792ea';
  if (t.includes('className=') || t.includes('style=') || t.includes('onClick=')) return '#82aaff';
  if (/^<[A-Z]/.test(t) || t.startsWith('</')) return '#ffcb6b';
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
  const codeBuffer = useRef<string[]>([]);
  const processedEvents = useRef(0);

  // Process streaming chunk events into display lines
  const totalEvents = events.length;
  if (totalEvents > processedEvents.current) {
    const newEvs = events.slice(processedEvents.current);
    processedEvents.current = totalEvents;
    for (const ev of newEvs) {
      if (ev.type === 'stage-start' && ev.stage) {
        codeBuffer.current.push('', '// ── ' + ev.stage.toUpperCase() + ' ──────────────────────────────────', '');
      } else if (ev.type === 'component-start' && ev.componentName) {
        codeBuffer.current.push('', '// generating: ' + ev.componentName);
      } else if (ev.type === 'component-complete' && ev.file) {
        codeBuffer.current.push('// done: ' + ev.file.path, '');
      } else if (ev.type === 'component-chunk' && ev.chunk) {
        const lines = ev.chunk.split('\n');
        for (const l of lines) {
          if (l !== '') codeBuffer.current.push(l);
        }
      }
    }
  }

  // After generation ends, briefly show animation then switch to preview
  useEffect(() => {
    if (!isGenerating && Object.keys(realtimeFiles).length > 0) {
      const t = setTimeout(() => setShowPreview(true), 900);
      return () => clearTimeout(t);
    }
    if (isGenerating) setShowPreview(false);
  }, [isGenerating, realtimeFiles]);

  // Reset code buffer on new generation
  useEffect(() => {
    if (isGenerating && currentStage === 'config-assembly') {
      codeBuffer.current = [];
      processedEvents.current = 0;
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
  const files = hasRealtimeFiles ? realtimeFiles : (generated?.files || {});
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
              Describe your website in the chat and the preview will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Code animation during generation
  if (isGenerating && !showPreview) {
    const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
    const stageLabels: Record<string, string> = {
      'config-assembly': 'Assembling config...',
      'design-system': 'Generating design tokens...',
      blueprint: 'Planning architecture...',
      components: 'Building components (' + progress.completed + '/' + progress.total + ')',
      assembly: 'Assembling project...',
    };
    const stageLabel = currentStage ? (stageLabels[currentStage] ?? currentStage) : 'Starting...';
    const activeComp = Array.from(components.values()).find(c => c.status === 'generating');
    const activeFile = activeComp?.filePath ?? activeComp?.name ?? '';
    const displayLines = codeBuffer.current.slice(-120);

    const barWidth = currentStage === 'components' ? pct + '%'
      : currentStage === 'config-assembly' ? '8%'
      : currentStage === 'design-system' ? '20%'
      : currentStage === 'blueprint' ? '35%'
      : currentStage === 'assembly' ? '95%'
      : '2%';

    return (
      <div className="flex h-full flex-col bg-[#0d1117] font-mono text-xs">
        {/* Mac-style terminal header */}
        <div className="flex items-center gap-2 border-b border-[#21262d] bg-[#161b22] px-4 py-2.5 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[#8b949e] ml-2 text-[11px]">sitecraft-ai — code generation</span>
          <div className="ml-auto flex items-center gap-3">
            {activeFile && (
              <span className="text-[#58a6ff] truncate max-w-[200px] text-[11px]">{activeFile}</span>
            )}
            <span className="text-[#3fb950] text-[11px]">{stageLabel}</span>
          </div>
        </div>

        {/* Scrolling code output */}
        <div ref={terminalRef} className="flex-1 overflow-y-auto px-4 py-3 leading-5" style={{ overflowAnchor: 'none' }}>
          {displayLines.map((line, i) => {
            const isHeader = line.startsWith('// ──') || line.startsWith('// generating:') || line.startsWith('// done:');
            return (
              <div
                key={i}
                className="whitespace-pre-wrap break-all leading-[1.45]"
                style={{
                  color: isHeader ? '#58a6ff' : getLineColor(line),
                  opacity: i < displayLines.length - 40 ? 0.5 : 1,
                  transition: 'opacity 0.3s',
                }}
              >
                {line || '\u00a0'}
              </div>
            );
          })}
          <span className="inline-block h-[14px] w-[7px] bg-[#58a6ff] animate-pulse align-middle" />
        </div>

        {/* Progress bar footer */}
        <div className="border-t border-[#21262d] bg-[#161b22] px-4 py-2.5 flex-shrink-0">
          <div className="flex items-center justify-between text-[10px] text-[#8b949e] mb-1.5">
            <span>{stageLabel}</span>
            {progress.total > 0 && (
              <span className="text-[#3fb950]">{progress.completed}/{progress.total} files</span>
            )}
          </div>
          <div className="h-[3px] w-full rounded-full bg-[#21262d] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: barWidth, background: 'linear-gradient(90deg, #1f6feb, #58a6ff)' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Preview (after generation or existing files)
  return (
    <div className="flex h-full flex-col">
      {isGenerating && (
        <div className="flex items-center gap-2 border-b px-4 py-2 bg-primary/5 flex-shrink-0">
          <div className="h-2.5 w-2.5 rounded-full bg-[#3fb950] animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">Generation complete — preview ready</span>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <PreviewFrame files={files} projectId={projectId} />
      </div>
    </div>
  );
}
