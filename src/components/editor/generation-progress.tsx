'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Terminal,
  Braces,
  FileCode2,
} from 'lucide-react';
import { useGenerationStore } from '@/stores/generation-store';
import type { GenerationStage } from '@/types/generation';

function colorize(code: string): string {
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(
    /(["'`])(?:(?!\1)[\\\s\S])*?\1/g,
    '<span style="color:#a5d6ff">$&</span>'
  );
  html = html.replace(
    /\b(import|export|from|const|let|var|function|return|if|else|default|async|await|new|class|extends|interface|type|typeof|as|of|in|for|while|switch|case|break|continue|try|catch|throw|finally|null|undefined|true|false|this|super|void|static)\b/g,
    '<span style="color:#ff7b72">$&</span>'
  );
  html = html.replace(
    /(&lt;\/?)([A-Z][a-zA-Z0-9]*)/g,
    '$1<span style="color:#7ee787">$2</span>'
  );
  html = html.replace(
    /(&lt;\/?)([a-z][a-zA-Z0-9-]*)/g,
    '$1<span style="color:#79c0ff">$2</span>'
  );
  html = html.replace(
    /(\/{2}.*)/gm,
    '<span style="color:#8b949e;font-style:italic">$1</span>'
  );
  html = html.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span style="color:#f0883e">$&</span>'
  );
  html = html.replace(
    /([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\()/g,
    '<span style="color:#d2a8ff">$1</span>'
  );
  return html;
}

interface StepItem {
  id: GenerationStage;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

function getSteps(currentStage: GenerationStage | null): StepItem[] {
  const stages: { id: GenerationStage; label: string }[] = [
    { id: 'config-assembly', label: 'Preparing config' },
    { id: 'design-system', label: 'Design system' },
    { id: 'blueprint', label: 'Page structure' },
    { id: 'components', label: 'Building components' },
    { id: 'assembly', label: 'Final assembly' },
  ];
  const ORDER: Record<string, number> = {
    'config-assembly': 0, 'design-system': 1, blueprint: 2,
    components: 3, assembly: 4, complete: 5, error: -1,
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

function LiveCodeStream() {
  const { components, currentStage, progress } = useGenerationStore();
  const codeRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(0);

  const activeComponent = Array.from(components.values()).find(
    (c) => c.status === 'generating'
  );
  const completedComponents = Array.from(components.values()).filter(
    (c) => c.status === 'complete'
  );
  const latestComplete = completedComponents[completedComponents.length - 1];
  const displayComponent = activeComponent || latestComplete;
  const codeContent = displayComponent ? displayComponent.chunks.join('') : '';

  useEffect(() => {
    setLineCount(codeContent.split('\n').length);
  }, [codeContent]);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [codeContent]);

  const colorizedCode = useMemo(() => colorize(codeContent), [codeContent]);
  const steps = getSteps(currentStage);
  const activeStep = steps.find((s) => s.status === 'active');

  return (
    <div
      className="flex-1 flex flex-col min-h-0 rounded-lg overflow-hidden border border-green-500/20"
      style={{ background: 'linear-gradient(180deg, #0a0f1a 0%, #0d1117 100%)' }}
    >
      {/* Terminal title bar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-green-500/10"
        style={{ background: 'rgba(13, 17, 23, 0.95)' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[10px] text-green-400/60 font-mono ml-2">
            innovated-marketing — building your website
          </span>
        </div>
        {displayComponent && (
          <span className="text-[10px] font-mono text-green-400 flex items-center gap-1.5">
            {activeComponent && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            )}
            {displayComponent.filePath || displayComponent.name}
          </span>
        )}
      </div>

      {/* Steps + progress bar */}
      <div
        className="px-3 py-2 border-b border-green-500/10 flex items-center gap-3"
        style={{ background: 'rgba(13, 17, 23, 0.8)' }}
      >
        <span className="text-[10px] font-medium text-green-400/80 flex items-center gap-1.5 shrink-0">
          {activeStep ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-green-400" />
              {activeStep.label}
            </>
          ) : currentStage === 'complete' ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-400" />
              Complete!
            </>
          ) : (
            'Starting...'
          )}
        </span>
        <div
          className="flex-1 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(57,211,83,0.1)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width:
                progress.total > 0
                  ? `${Math.round((progress.completed / progress.total) * 100)}%`
                  : currentStage === 'complete'
                  ? '100%'
                  : '0%',
              background: 'linear-gradient(90deg, #39d353, #2ea043)',
              boxShadow: '0 0 10px rgba(57,211,83,0.5)',
            }}
          />
        </div>
        {progress.total > 0 && (
          <span className="text-[10px] font-mono text-green-400/60 shrink-0">
            {progress.completed}/{progress.total} files
          </span>
        )}
      </div>

      {/* Scrollable code area */}
      <div
        ref={codeRef}
        className="flex-1 overflow-auto min-h-0 font-mono text-[11px] leading-[1.7]"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#1f6b3a transparent' }}
      >
        {codeContent ? (
          <div className="flex min-h-full">
            {/* Line numbers */}
            <div
              className="select-none text-right pr-3 pl-3 py-3 text-green-900/40 border-r border-green-500/10 sticky left-0"
              style={{ background: 'rgba(10, 15, 26, 0.9)', minWidth: '3rem' }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="h-[1.7em]">
                  {i + 1}
                </div>
              ))}
            </div>
            {/* Syntax-highlighted code */}
            <div className="py-3 pl-4 pr-4 flex-1 relative">
              <pre
                className="whitespace-pre-wrap break-words text-gray-300"
                dangerouslySetInnerHTML={{ __html: colorizedCode }}
              />
              {activeComponent && (
                <span
                  className="inline-block w-[8px] h-[16px] ml-0.5 align-text-bottom"
                  style={{
                    background: '#39d353',
                    boxShadow: '0 0 8px #39d353, 0 0 20px rgba(57,211,83,0.3)',
                    animation: 'cursorBlink 1s step-end infinite',
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-20 text-green-500/30">
            <div className="text-center">
              <Terminal className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-xs font-mono">Initializing AI generation...</p>
              <div className="flex justify-center gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-green-500/40"
                    style={{
                      animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completed files chips */}
      {completedComponents.length > 0 && (
        <div
          className="px-3 py-2 border-t border-green-500/10 overflow-x-auto"
          style={{ background: 'rgba(10, 15, 26, 0.6)' }}
        >
          <div className="flex flex-wrap gap-1">
            {completedComponents.map((file) => (
              <span
                key={file.name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono"
                style={{
                  background: 'rgba(57,211,83,0.1)',
                  color: 'rgba(57,211,83,0.7)',
                  border: '1px solid rgba(57,211,83,0.15)',
                }}
              >
                <CheckCircle2 className="h-2 w-2" />
                {file.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom status bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-t border-green-500/10 text-[10px] font-mono"
        style={{ background: 'rgba(13, 17, 23, 0.95)' }}
      >
        <div className="flex items-center gap-3">
          {completedComponents.length > 0 && (
            <span className="text-green-400/70">
              {completedComponents.length} files built
            </span>
          )}
          {lineCount > 0 && (
            <span className="text-green-400/50">{lineCount} lines</span>
          )}
        </div>
        <span className="text-green-400/40">
          {currentStage === 'complete' ? '✓ Build complete' : 'AI Engine Active'}
        </span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes dotPulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
      ` }} />
    </div>
  );
}

export function GenerationProgress() {
  const { currentStage, isGenerating } = useGenerationStore();
  if (!isGenerating && currentStage !== 'complete') return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <LiveCodeStream />
    </div>
  );
}
