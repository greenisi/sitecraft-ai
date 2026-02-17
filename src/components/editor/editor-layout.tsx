'use client';

import { useRef, useState, useCallback } from 'react';
import { MessageSquare, Eye, MousePointerClick } from 'lucide-react';
import { EditorTopbar } from './editor-topbar';
import { ChatPanel } from './chat-panel';
import { PreviewPanel } from './preview-panel';
import { PropertiesPanel } from '@/components/visual-editor/properties-panel';
import { useVisualEditorStore } from '@/stores/visual-editor-store';
import { useVisualEditorSave } from '@/lib/hooks/use-visual-editor-save';
import { cn } from '@/lib/utils/cn';

interface EditorLayoutProps {
  projectId: string;
}

const MIN_CHAT_WIDTH = 320;
const MAX_CHAT_WIDTH = 600;
const DEFAULT_CHAT_WIDTH = 400;

export function EditorLayout({ projectId }: EditorLayoutProps) {
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [mobileView, setMobileView] = useState<'chat' | 'preview'>('chat');
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isVisualEditorActive } = useVisualEditorStore();
  const { save } = useVisualEditorSave(projectId);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    e.preventDefault();
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      setChatWidth(Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, newWidth)));
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const leftPanel = isVisualEditorActive ? (
    <PropertiesPanel onSave={save} />
  ) : (
    <ChatPanel projectId={projectId} />
  );

  const mobileLeftLabel = isVisualEditorActive ? 'Properties' : 'Chat';
  const MobileLeftIcon = isVisualEditorActive ? MousePointerClick : MessageSquare;

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <EditorTopbar projectId={projectId} />

      {/* Desktop: side-by-side */}
      <div ref={containerRef} className="hidden md:flex flex-1 overflow-hidden">
        <div className="flex-shrink-0 border-r border-border/50" style={{ width: chatWidth }}>
          {leftPanel}
        </div>
        <div
          className={cn(
            'w-1 cursor-col-resize hover:bg-violet-500/20 active:bg-violet-500/30 transition-colors flex-shrink-0',
            isDragging.current && 'bg-violet-500/30'
          )}
          onMouseDown={handleMouseDown}
        />
        <div className="flex-1 min-w-0 bg-muted/30">
          <PreviewPanel projectId={projectId} />
        </div>
      </div>

      {/* Mobile: single panel with toggle */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden min-h-0">
        <div className={cn('flex-1 min-h-0 overflow-hidden', mobileView !== 'chat' && 'hidden')}>
          {leftPanel}
        </div>
        <div className={cn('flex-1 min-h-0 overflow-hidden', mobileView !== 'preview' && 'hidden')}>
          <PreviewPanel projectId={projectId} />
        </div>

        {/* Premium mobile bottom tab bar */}
        <div className="flex border-t border-border/50 bg-background/95 backdrop-blur-sm flex-shrink-0 safe-area-bottom z-50">
          <button
            onClick={() => setMobileView('chat')}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-all',
              mobileView === 'chat'
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-muted-foreground'
            )}
          >
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
              mobileView === 'chat' && 'bg-violet-500/10'
            )}>
              <MobileLeftIcon className="h-4.5 w-4.5" />
            </div>
            {mobileLeftLabel}
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-all',
              mobileView === 'preview'
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-muted-foreground'
            )}
          >
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
              mobileView === 'preview' && 'bg-violet-500/10'
            )}>
              <Eye className="h-4.5 w-4.5" />
            </div>
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}
