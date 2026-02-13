'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { usePreviewStore } from '@/stores/preview-store';
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
  const { viewport, zoom, activePage, setActivePage } = usePreviewStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [pages, setPages] = useState<PageInfo[]>([]);

  const hasFiles = Object.keys(files).length > 0;

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
    }
  }, [hasFiles, Object.keys(files).length]);

  // Refresh iframe when active page changes
  useEffect(() => {
    if (hasFiles) {
      setIframeKey((k) => k + 1);
      setLoading(true);
    }
  }, [activePage, hasFiles]);

  // Listen for postMessage navigation events from the iframe
  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'sitecraft:navigate') {
      const targetPage = event.data.page as string;
      setActivePage(targetPage);
    }
    if (event.data?.type === 'sitecraft:pages') {
      const iframePages = event.data.pages as PageInfo[];
      if (iframePages && iframePages.length > 0) {
        setPages(iframePages);
      }
    }
  }, [setActivePage]);

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
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile: full-width iframe, no scaling */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 md:p-2">
          <div
            className="mx-auto transition-all duration-300 origin-top bg-white md:rounded-lg md:shadow-sm overflow-hidden"
            style={{
              width: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : VIEWPORT_WIDTHS[viewport],
              transform: typeof window !== 'undefined' && window.innerWidth < 768 ? 'none' : `scale(${zoom})`,
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
              onLoad={() => setLoading(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
