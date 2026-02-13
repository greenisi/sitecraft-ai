'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { usePreviewStore } from '@/stores/preview-store';
import { useVisualEditorStore } from '@/stores/visual-editor-store';
import { getIframeBridgeScript } from '@/lib/visual-editor/iframe-bridge';
import { setPreviewIframe, sendToPreviewIframe } from '@/lib/visual-editor/iframe-ref';
import { DeviceToolbar } from './device-toolbar';
import { Loader2 } from 'lucide-react';

const VIEWPORT_WIDTHS = {
  desktop: 1440,
  tablet: 768,
  mobile: 375,
};

interface PageInfo {
  path: string;
  title: string;
}

interface PreviewFrameProps {
  files: Record<string, string>;
  projectId: string;
}

export function PreviewFrame({ files, projectId }: PreviewFrameProps) {
  const { viewport, zoom, autoFit, activePage, setActivePage } = usePreviewStore();
  const { isVisualEditorActive, setSelectedElement, setInlineEditing, addPendingChange } =
    useVisualEditorStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const bridgeInjectedRef = useRef(false);

  const hasFiles = Object.keys(files).length > 0;

  // Register iframe ref in singleton so PropertiesPanel can reach it
  useEffect(() => {
    setPreviewIframe(iframeRef.current);
    return () => setPreviewIframe(null);
  }, [iframeKey]);

  // Track container width with ResizeObserver for auto-fit
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute effective zoom: auto-fit scales down to fit container
  const effectiveZoom = useMemo(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return 1;
    if (!autoFit) return zoom;
    const targetWidth = VIEWPORT_WIDTHS[viewport];
    const available = containerWidth - 16; // subtract md:p-2 padding (8px each side)
    if (available <= 0 || available >= targetWidth) return zoom;
    return Math.min(zoom, available / targetWidth);
  }, [autoFit, zoom, viewport, containerWidth]);

  // Derive pages from file keys
  useEffect(() => {
    const derivedPages: PageInfo[] = [];
    for (const filePath of Object.keys(files)) {
      const match = filePath.match(/^src\/app\/(.*?)page\.tsx$/);
      if (match) {
        const pathSegment = match[1];
        const pagePath = pathSegment ? `/${pathSegment.replace(/\/$/, '')}` : '/';
        const title = pagePath === '/'
          ? 'Home'
          : pagePath.split('/').filter(Boolean).pop()!.replace(/(^|\s)\S/g, (t) => t.toUpperCase());
        derivedPages.push({ path: pagePath, title });
      }
    }
    derivedPages.sort((a, b) => {
      if (a.path === '/') return -1;
      if (b.path === '/') return 1;
      return a.path.localeCompare(b.path);
    });
    if (derivedPages.length > 0) {
      setPages(derivedPages);
    }
  }, [files]);

  // Refresh iframe when files change (new generation complete)
  useEffect(() => {
    if (hasFiles) {
      setIframeKey((k) => k + 1);
      setLoading(true);
      bridgeInjectedRef.current = false;
    }
  }, [hasFiles, Object.keys(files).length]);

  // Refresh iframe when active page changes
  useEffect(() => {
    if (hasFiles) {
      setIframeKey((k) => k + 1);
      setLoading(true);
      bridgeInjectedRef.current = false;
    }
  }, [activePage, hasFiles]);

  // Inject or destroy bridge script when visual editor toggles or iframe loads
  useEffect(() => {
    if (!iframeRef.current) return;

    if (isVisualEditorActive && !loading && !bridgeInjectedRef.current) {
      // Inject bridge script
      try {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          const script = doc.createElement('script');
          script.textContent = getIframeBridgeScript();
          doc.body.appendChild(script);
          bridgeInjectedRef.current = true;
        }
      } catch {
        // Cross-origin or other error — can't inject
        console.warn('Could not inject visual editor bridge into iframe');
      }
    } else if (!isVisualEditorActive && bridgeInjectedRef.current) {
      // Destroy bridge with safety fallback
      try {
        sendToPreviewIframe({ type: 'sitecraft:destroy' });
      } catch {
        // If destroy fails, force reload
        setIframeKey((k) => k + 1);
        setLoading(true);
      }
      bridgeInjectedRef.current = false;
    }
  }, [isVisualEditorActive, loading]);

  // Listen for postMessage events from the iframe
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const data = event.data;
      if (!data?.type) return;

      switch (data.type) {
        case 'sitecraft:navigate': {
          const targetPage = data.page as string;
          setActivePage(targetPage);
          break;
        }
        case 'sitecraft:pages': {
          const iframePages = data.pages as PageInfo[];
          if (iframePages && iframePages.length > 0) {
            setPages(iframePages);
          }
          break;
        }
        case 'sitecraft:element-selected': {
          if (data.data) {
            setSelectedElement(data.data);
          }
          break;
        }
        case 'sitecraft:inline-edit-start': {
          setInlineEditing(true);
          break;
        }
        case 'sitecraft:inline-edit-end': {
          setInlineEditing(false);
          if (data.data) {
            addPendingChange({
              type: 'text',
              cssPath: data.data.cssPath,
              oldText: data.data.oldText,
              newText: data.data.newText,
            });
          }
          break;
        }
        case 'sitecraft:inline-edit-cancel': {
          setInlineEditing(false);
          break;
        }
        case 'sitecraft:toolbar-action': {
          const { action, property, value, cssPath } = data;
          if (action === 'style' && property && value !== undefined) {
            addPendingChange({
              type: 'style',
              cssPath: cssPath || '',
              property,
              oldValue: '',
              newValue: value,
            });
          }
          if (action === 'hide' && cssPath) {
            addPendingChange({
              type: 'style',
              cssPath,
              property: 'display',
              oldValue: '',
              newValue: 'none',
            });
          }
          break;
        }
      }
    },
    [setActivePage, setSelectedElement, setInlineEditing, addPendingChange]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  if (!hasFiles) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        No preview available yet
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden md:rounded-lg md:border bg-muted">
      {/* Hide device toolbar on mobile — just show page tabs */}
      <div className="hidden md:block">
        <DeviceToolbar pages={pages} />
      </div>
      {/* Mobile: only page tabs if multiple pages */}
      {pages.length > 1 && (
        <div className="flex md:hidden items-center gap-1 border-b px-3 py-1.5 overflow-x-auto bg-background">
          {pages.map((page) => (
            <button
              key={page.path}
              onClick={() => setActivePage(page.path)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                activePage === page.path
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {page.title}
            </button>
          ))}
        </div>
      )}

      {/* Visual editor active indicator */}
      {isVisualEditorActive && (
        <div className="flex items-center gap-2 border-b px-3 py-1.5 bg-violet-50 dark:bg-violet-950/20">
          <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-[11px] text-violet-700 dark:text-violet-300 font-medium">
            Visual editing mode — click to select, double-click text to edit
          </span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Preview container with overflow-hidden to prevent horizontal scroll */}
        <div ref={containerRef} className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 md:p-2">
          <div
            className="mx-auto transition-all duration-300 origin-top bg-white md:rounded-lg md:shadow-sm overflow-hidden"
            style={{
              width: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : VIEWPORT_WIDTHS[viewport],
              transform: typeof window !== 'undefined' && window.innerWidth < 768 ? 'none' : `scale(${effectiveZoom})`,
              transformOrigin: 'top center',
            }}
          >
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading preview...
                </span>
              </div>
            )}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={`/api/preview/render?projectId=${projectId}&page=${encodeURIComponent(activePage)}`}
              className="w-full border-0"
              style={{
                height: loading ? '0px' : '100vh',
                minHeight: loading ? '0px' : '600px',
              }}
              title="Website Preview"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => {
                setLoading(false);
                // Update iframe ref singleton after load
                setPreviewIframe(iframeRef.current);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
