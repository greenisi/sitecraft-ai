'use client';

import { useRef, useState, useCallback } from 'react';
import { EditorTopbar } from './editor-topbar';
import { ChatPanel } from './chat-panel';
import { PreviewPanel } from './preview-panel';
import { cn } from '@/lib/utils/cn';

interface EditorLayoutProps {
  projectId: string;
}

const MIN_CHAT_WIDTH = 320;
const MAX_CHAT_WIDTH = 600;
const DEFAULT_CHAT_WIDTH = 420;

export function EditorLayout({ projectId }: EditorLayoutProps) {
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex h-screen flex-col">
      <EditorTopbar projectId={projectId} />
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div
          className="flex-shrink-0 border-r"
          style={{ width: chatWidth }}
        >
          <ChatPanel projectId={projectId} />
        </div>

        {/* Resize Handle */}
        <div
          className={cn(
            'w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors flex-shrink-0',
            isDragging.current && 'bg-primary/30'
          )}
          onMouseDown={handleMouseDown}
        />

        {/* Preview Panel */}
        <div className="flex-1 min-w-0">
          <PreviewPanel projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
