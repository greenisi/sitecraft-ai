'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  GripVertical,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sendToPreviewIframe } from '@/lib/visual-editor/iframe-ref';
import { cn } from '@/lib/utils/cn';

interface SectionInfo {
  index: number;
  tag: string;
  name: string;
  cssPath: string;
  visible: boolean;
}

export function SectionManager() {
  const [sections, setSections] = useState<SectionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const retryCountRef = useRef(0);
  const gotResponseRef = useRef(false);

  const refreshSections = useCallback(() => {
    setLoading(true);
    gotResponseRef.current = false;
    sendToPreviewIframe({ type: 'sitecraft:get-sections' });
    // The response comes via postMessage
  }, []);

  // On mount, request sections. Also retry with backoff if bridge isn't ready yet.
  useEffect(() => {
    retryCountRef.current = 0;
    gotResponseRef.current = false;

    function tryRefresh() {
      if (gotResponseRef.current) return;
      sendToPreviewIframe({ type: 'sitecraft:get-sections' });
      setLoading(true);
      retryCountRef.current += 1;
      // Retry up to 5 times with increasing delay (300ms, 600ms, 1s, 1.5s, 2s)
      if (retryCountRef.current < 5) {
        retryTimerRef.current = setTimeout(tryRefresh, retryCountRef.current * 300);
      } else {
        // Give up — show empty state instead of infinite loading
        setLoading(false);
      }
    }

    tryRefresh();

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  // Listen for sections-list response AND bridge-ready signal
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'sitecraft:sections-list') {
        gotResponseRef.current = true;
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        setSections(e.data.data || []);
        setLoading(false);
      }
      // When the bridge announces it's ready, request sections
      if (e.data?.type === 'sitecraft:bridge-ready') {
        retryCountRef.current = 0;
        sendToPreviewIframe({ type: 'sitecraft:get-sections' });
        setLoading(true);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSelectSection = useCallback((cssPath: string) => {
    sendToPreviewIframe({ type: 'sitecraft:select-section', cssPath });
  }, []);

  const handleToggleVisibility = useCallback(
    (cssPath: string) => {
      sendToPreviewIframe({
        type: 'sitecraft:toggle-section-visibility',
        cssPath,
      });
      // Optimistically update
      setSections((prev) =>
        prev.map((s) =>
          s.cssPath === cssPath ? { ...s, visible: !s.visible } : s
        )
      );
    },
    []
  );

  const handleReorder = useCallback(
    (cssPath: string, direction: 'up' | 'down') => {
      sendToPreviewIframe({
        type: 'sitecraft:reorder-section',
        cssPath,
        direction,
      });
      // Refresh after a brief delay for DOM to update
      setTimeout(refreshSections, 200);
    },
    [refreshSections]
  );

  const handleDuplicate = useCallback(
    (cssPath: string) => {
      sendToPreviewIframe({
        type: 'sitecraft:duplicate-section',
        cssPath,
      });
      setTimeout(refreshSections, 200);
    },
    [refreshSections]
  );

  if (loading && sections.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Layers className="h-4 w-4 mr-2 animate-pulse" />
        <span className="text-xs">Loading sections...</span>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center px-4">
        <Layers className="h-5 w-5 text-muted-foreground/50 mb-2" />
        <p className="text-xs text-muted-foreground">No sections detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          Page Sections
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={refreshSections}
        >
          Refresh
        </Button>
      </div>
      <ScrollArea className="max-h-[300px]">
        {sections.map((section, idx) => (
          <div
            key={section.cssPath}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md group transition-colors',
              section.visible
                ? 'hover:bg-muted/50'
                : 'opacity-50 hover:bg-muted/30'
            )}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />

            <button
              onClick={() => handleSelectSection(section.cssPath)}
              className="flex-1 text-left min-w-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">
                  {section.tag}
                </span>
                <span className="text-[11px] truncate">{section.name}</span>
              </div>
            </button>

            <div className="flex items-center gap-0.5 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleReorder(section.cssPath, 'up')}
                disabled={idx === 0}
                className="p-1 rounded hover:bg-muted disabled:opacity-30"
                title="Move up"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleReorder(section.cssPath, 'down')}
                disabled={idx === sections.length - 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30"
                title="Move down"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleDuplicate(section.cssPath)}
                className="p-1 rounded hover:bg-muted"
                title="Duplicate"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleToggleVisibility(section.cssPath)}
                className="p-1 rounded hover:bg-muted"
                title={section.visible ? 'Hide' : 'Show'}
              >
                {section.visible ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
