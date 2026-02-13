'use client';

import { Monitor, Tablet, Smartphone, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { usePreviewStore } from '@/stores/preview-store';

const viewports = [
  { id: 'desktop' as const, icon: Monitor, label: 'Desktop', width: 1440 },
  { id: 'tablet' as const, icon: Tablet, label: 'Tablet', width: 768 },
  { id: 'mobile' as const, icon: Smartphone, label: 'Mobile', width: 375 },
];

interface PageInfo {
  path: string;
  title: string;
}

interface DeviceToolbarProps {
  pages?: PageInfo[];
}

export function DeviceToolbar({ pages = [] }: DeviceToolbarProps) {
  const { viewport, autoFit, activePage, setViewport, setAutoFit, setActivePage } = usePreviewStore();

  const hasMultiplePages = pages.length > 1;

  return (
    <div className="flex flex-col border-b bg-background">
      {/* Page tabs — only show if there are multiple pages */}
      {hasMultiplePages && (
        <div className="flex items-center gap-1 border-b px-3 py-1.5 overflow-x-auto">
          {pages.map((page) => (
            <button
              key={page.path}
              onClick={() => setActivePage(page.path)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap',
                activePage === page.path
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {page.title}
            </button>
          ))}
        </div>
      )}

      {/* Device viewport controls */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1">
          {viewports.map((vp) => (
            <Button
              key={vp.id}
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1.5',
                viewport === vp.id && 'bg-accent text-accent-foreground'
              )}
              onClick={() => setViewport(vp.id)}
            >
              <vp.icon className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">{vp.label}</span>
            </Button>
          ))}
        </div>

        <Button
          variant={autoFit ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'h-8 px-2 text-xs gap-1',
            autoFit && 'bg-primary text-primary-foreground'
          )}
          onClick={() => setAutoFit(!autoFit)}
          title="Fit preview to available width"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Fit
        </Button>
      </div>
    </div>
  );
}
