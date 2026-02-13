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
const DEFAULT_CHAT_WIDTH = 420;

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

  // Left panel content — either Chat or Properties
  const leftPanel = isVisualEditorActive ? (
    <PropertiesPanel onSave={save} />
  ) : (
    <ChatPanel projectId={projectId} />
  );

  // Mobile left tab label and icon
  const mobileLeftLabel = isVisualEditorActive ? 'Properties' : 'Chat';
  const MobileLeftIcon = isVisualEditorActive ? MousePointerClick : MessageSquare;

  return (
    <div className="flex h-[100dvh] flex-col">
      <EditorTopbar projectId={projectId} />

      {/* Desktop: side-by-side */}
      <div ref={containerRef} className="hidden md:flex flex-1 overflow-hidden">
        <div
          className="flex-shrink-0 border-r"
          style={{ width: chatWidth }}
        >
          {leftPanel}
        </div>
        <div
          className={cn(
            'w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors flex-shrink-0',
            isDragging.current && 'bg-primary/30'
          )}
          onMouseDown={handleMouseDown}
        />
        <div className="flex-1 min-w-0">
          <PreviewPanel projectId={projectId} />
        </div>
      </div>

      {/* Mobile: single panel with toggle — fully fixed layout */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden min-h-0">
        <div className={cn('flex-1 min-h-0 overflow-hidden', mobileView !== 'chat' && 'hidden')}>
          {leftPanel}
        </div>
        <div className={cn('flex-1 min-h-0 overflow-hidden', mobileView !== 'preview' && 'hidden')}>
          <PreviewPanel projectId={projectId} />
        </div>

        {/* Mobile bottom tab bar — pinned */}
        <div className="flex border-t bg-background flex-shrink-0 safe-area-bottom z-50">
          <button
            onClick={() => setMobileView('chat')}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
              mobileView === 'chat'
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <MobileLeftIcon className="h-5 w-5" />
            {mobileLeftLabel}
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
              mobileView === 'preview'
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <Eye className="h-5 w-5" />
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}
