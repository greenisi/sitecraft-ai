'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useGeneratedFiles } from '@/lib/hooks/use-preview';
import { useGenerationStore } from '@/stores/generation-store';
import { PreviewFrame } from '@/components/preview/preview-frame';
import { Monitor, FileCode2, ChevronRight, Loader2, Terminal } from 'lucide-react';
import { colorize } from '@/lib/utils/colorize';

interface PreviewPanelProps {
  projectId: string;
}

// Stage labels for display
const STAGE_LABELS: Record<string, string> = {
  'config-assembly': 'Preparing Configuration',
  'design-system': 'Creating Design System',
  blueprint: 'Planning Architecture',
  components: 'Building Components',
  assembly: 'Final Assembly',
  complete: 'Build Complete',
};

// ─── Typewriter Hook ────────────────────────────────────────────────
// Reveals code character-by-character for the actively generating
// component. For completed/tab-selected components, returns full content.
function useTypewriter(
  fullContent: string,
  isTyping: boolean,
  componentKey: string | undefined
) {
  const displayLenRef = useRef(0);
  const [, setTick] = useState(0);
  const rafRef = useRef(0);
  const prevKeyRef = useRef(componentKey);

  // Reset on component switch (new file starts generating)
  if (componentKey !== prevKeyRef.current) {
    prevKeyRef.current = componentKey;
    displayLenRef.current = 0;
  }

  // If not typing (viewing a completed component tab), show everything
  if (!isTyping) {
    displayLenRef.current = fullContent.length;
  }

  // Typewriter animation loop — only runs for the active component
  useEffect(() => {
    if (!isTyping) return;

    const animate = () => {
      const target = fullContent.length;
      const current = displayLenRef.current;

      if (current < target) {
        const gap = target - current;
        // Adaptive speed: fast when lots buffered, smooth at steady state
        const speed = gap > 500 ? 40 : gap > 200 ? 20 : gap > 80 ? 10 : 4;
        displayLenRef.current = Math.min(current + speed, target);
        setTick((n) => n + 1); // trigger re-render
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isTyping, fullContent.length, componentKey]);

  return fullContent.slice(0, displayLenRef.current);
}

// ─── Main Component ─────────────────────────────────────────────────
export function PreviewPanel({ projectId }: PreviewPanelProps) {
  const { data: generated } = useGeneratedFiles(projectId);
  const {
    files: realtimeFiles,
    isGenerating,
    progress,
    currentStage,
    components,
  } = useGenerationStore();

  const codeRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);

  // Derive component lists from store
  const componentsList = useMemo(
    () => Array.from(components.values()),
    [components]
  );
  const activeComp = componentsList.find((c) => c.status === 'generating');
  const completedComps = componentsList.filter((c) => c.status === 'complete');

  // Display component: user-selected tab, or auto-follow active/latest
  const displayComp = selectedTab
    ? componentsList.find((c) => c.name === selectedTab)
    : activeComp || completedComps[completedComps.length - 1];

  const fullCodeContent = displayComp ? displayComp.chunks.join('') : '';
  const isViewingActive = displayComp === activeComp;

  // Typewriter: animate code for active component, show full for tabs
  const displayedCode = useTypewriter(
    fullCodeContent,
    isViewingActive && !!activeComp,
    displayComp?.name
  );

  const lineCount = displayedCode ? displayedCode.split('\n').length : 0;

  // Auto-follow when a new component starts generating
  useEffect(() => {
    if (activeComp) {
      setSelectedTab(null);
    }
  }, [activeComp?.name]);

  // After generation ends, transition to preview
  useEffect(() => {
    const hasRtFiles = Object.keys(realtimeFiles).length > 0;
    const isDone = !isGenerating || currentStage === 'complete';

    if (isDone && hasRtFiles) {
      const t = setTimeout(() => setShowPreview(true), 1500);
      return () => clearTimeout(t);
    }
    if (isGenerating && currentStage !== 'complete') {
      setShowPreview(false);
    }
  }, [isGenerating, currentStage, realtimeFiles]);

  // Reset on new generation
  useEffect(() => {
    if (isGenerating && currentStage === 'config-assembly') {
      setSelectedTab(null);
      setShowPreview(false);
    }
  }, [isGenerating, currentStage]);

  // Auto-scroll code area when viewing the active component
  const scrollToBottom = useCallback(() => {
    if (codeRef.current && isViewingActive) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [isViewingActive]);

  useEffect(() => {
    scrollToBottom();
  }, [displayedCode, scrollToBottom]);

  // Memoize syntax-highlighted code from the typewriter output
  const colorizedCode = useMemo(() => colorize(displayedCode), [displayedCode]);

  const hasRealtimeFiles = Object.keys(realtimeFiles).length > 0;
  const files = hasRealtimeFiles ? realtimeFiles : generated?.files || {};
  const hasFiles = Object.keys(files).length > 0;

  // Should we show the code editor? During generation OR briefly after
  // (while waiting for the preview transition)
  const showCodeEditor =
    (isGenerating || (currentStage === 'complete' && !showPreview)) &&
    !showPreview;

  // ---- EMPTY STATE ----
  if (!hasFiles && !isGenerating && !showCodeEditor) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4 text-center px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Monitor className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Preview</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Describe your website in the chat and the preview will appear
              here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---- GENERATION IN PROGRESS: IDE-like code streaming ----
  if (showCodeEditor) {
    const displayFilePath = displayComp?.filePath || displayComp?.name || '';
    const pathSegments = displayFilePath ? displayFilePath.split('/') : [];
    const stageLabel = currentStage
      ? STAGE_LABELS[currentStage] || 'Building...'
      : 'Starting...';

    return (
      <div className="flex h-full flex-col bg-[#0d1117]">
        {/* ── File Tab Bar ── */}
        <div
          className="flex items-center bg-[#161b22] border-b border-[#21262d] flex-shrink-0 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {componentsList.map((comp) => {
            const isActive = comp === activeComp;
            const isSelected =
              selectedTab === comp.name ||
              (!selectedTab && comp === displayComp);
            const fileName = comp.filePath
              ? comp.filePath.split('/').pop() || comp.name
              : comp.name;
            const ext = fileName.includes('.')
              ? fileName.slice(fileName.lastIndexOf('.'))
              : '';
            const nameWithoutExt = ext
              ? fileName.slice(0, -ext.length)
              : fileName;

            return (
              <button
                key={comp.name}
                onClick={() => {
                  if (isActive) {
                    setSelectedTab(null);
                  } else {
                    setSelectedTab(comp.name);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 text-[11px] md:text-[12px] font-mono cursor-pointer border-r border-[#21262d] whitespace-nowrap transition-colors flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#0d1117] text-[#e6edf3] border-b-2 border-b-[#58a6ff]'
                    : 'bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1c2129]'
                }`}
              >
                {isActive && (
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58a6ff] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#58a6ff]" />
                  </span>
                )}
                <FileCode2 className="h-3 w-3 flex-shrink-0 text-[#8b949e]" />
                <span>{nameWithoutExt}</span>
                {ext && <span className="text-[#484f58]">{ext}</span>}
              </button>
            );
          })}

          {/* Empty state tab when no components yet */}
          {componentsList.length === 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-mono text-[#484f58]">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Preparing files...</span>
            </div>
          )}
        </div>

        {/* ── Breadcrumb Bar ── */}
        {displayFilePath && (
          <div className="flex items-center gap-1 px-4 py-1.5 bg-[#161b22] border-b border-[#21262d] text-[11px] font-mono flex-shrink-0 overflow-hidden">
            {pathSegments.map((segment, i) => (
              <span key={i} className="flex items-center gap-1 flex-shrink-0">
                {i > 0 && (
                  <ChevronRight className="h-2.5 w-2.5 text-[#484f58] flex-shrink-0" />
                )}
                <span
                  className={
                    i === pathSegments.length - 1
                      ? 'text-[#e6edf3]'
                      : 'text-[#8b949e]'
                  }
                >
                  {segment}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* ── Code Editor Area with Typewriter Effect ── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {displayedCode ? (
            <div
              ref={codeRef}
              className="flex-1 overflow-auto min-h-0 font-mono text-[10px] md:text-[11px] leading-[1.7]"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#21262d transparent',
              }}
            >
              <div className="flex min-h-full">
                {/* Line numbers gutter */}
                <div
                  className="select-none text-right pr-3 pl-3 py-3 border-r border-[#21262d] sticky left-0 hidden sm:block"
                  style={{ background: '#0d1117', minWidth: '3.5rem' }}
                >
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div
                      key={i}
                      className={`h-[1.7em] ${
                        i === lineCount - 1 && isViewingActive
                          ? 'text-[#8b949e]'
                          : 'text-[#484f58]'
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Syntax-highlighted code */}
                <div className="py-3 pl-3 sm:pl-4 pr-4 flex-1 relative">
                  <pre
                    className="whitespace-pre-wrap break-words text-gray-300"
                    dangerouslySetInnerHTML={{ __html: colorizedCode }}
                  />
                  {/* Blinking cursor at typing position */}
                  {isViewingActive && activeComp && (
                    <span
                      className="inline-block w-[8px] h-[16px] ml-0.5 align-text-bottom"
                      style={{
                        background: '#58a6ff',
                        boxShadow:
                          '0 0 8px #58a6ff, 0 0 20px rgba(88,166,255,0.3)',
                        animation: 'cursorBlink 1s step-end infinite',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty state before code starts streaming */
            <div className="flex-1 flex items-center justify-center py-20 text-[#484f58]">
              <div className="text-center">
                <Terminal className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-xs font-mono mb-1">{stageLabel}</p>
                <p className="text-[10px] font-mono text-[#30363d]">
                  Initializing AI generation...
                </p>
                <div className="flex justify-center gap-1 mt-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#58a6ff]/40"
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

        {/* ── Status Bar ── */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-t border-[#21262d] text-[10px] font-mono flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#3fb950] animate-pulse flex-shrink-0" />
            <span className="text-[#8b949e] truncate">
              {activeComp
                ? activeComp.filePath || activeComp.name
                : stageLabel}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Progress bar (hidden on mobile) */}
            <div className="hidden md:block">
              <div
                className="h-1 w-20 rounded-full overflow-hidden"
                style={{ background: 'rgba(33,38,45,0.8)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: getOverallWidth(currentStage, progress),
                    background: 'linear-gradient(90deg, #238636, #3fb950)',
                  }}
                />
              </div>
            </div>

            {progress.total > 0 && (
              <span className="text-[#3fb950]">
                {progress.completed}/{progress.total} files
              </span>
            )}

            <span className="text-[#484f58] hidden md:inline">
              {lineCount > 0 ? lineCount + ' lines' : ''}
            </span>

            <span className="text-[#484f58] hidden lg:inline">
              {currentStage === 'complete'
                ? 'Build complete'
                : 'AI Engine Active'}
            </span>
          </div>
        </div>

        {/* Keyframe animations */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
              @keyframes dotPulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
            `,
          }}
        />
      </div>
    );
  }

  // ---- PREVIEW (after generation or existing files) ----
  return (
    <div className="flex h-full flex-col animate-in fade-in duration-500">
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
