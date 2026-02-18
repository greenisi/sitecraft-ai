'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { PremiumTemplate } from '@/lib/templates/premium-templates';

interface TemplatePreviewModalProps {
  template: PremiumTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: PremiumTemplate) => void;
  isLoading: boolean;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onUseTemplate,
  isLoading,
}: TemplatePreviewModalProps) {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIframeLoading(true);
      setDeviceMode('desktop');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, template]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !template) return null;

  const previewUrl = `/api/templates/preview/${template.id}`;

  const deviceWidths: Record<DeviceMode, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  const deviceButtons: {
    mode: DeviceMode;
    icon: typeof Monitor;
    label: string;
  }[] = [
    { mode: 'desktop', icon: Monitor, label: 'Desktop' },
    { mode: 'tablet', icon: Tablet, label: 'Tablet' },
    { mode: 'mobile', icon: Smartphone, label: 'Mobile' },
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative z-10 flex flex-col w-full h-full sm:w-[95vw] sm:h-[92vh] sm:max-w-[1600px] sm:rounded-2xl overflow-hidden bg-background border-0 sm:border sm:border-border/50 shadow-2xl shadow-black/50 animate-scale-in"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* ============================================================= */}
        {/* MOBILE FLOATING CLOSE BUTTON - always on top, impossible to   */}
        {/* miss. This sits OUTSIDE the header flow so nothing can hide it */}
        {/* ============================================================= */}
        <button
          onClick={onClose}
          className="sm:hidden fixed top-3 right-3 z-[60] flex items-center justify-center w-12 h-12 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 active:scale-95 transition-transform"
          style={{
            marginTop: 'env(safe-area-inset-top)',
          }}
          aria-label="Close preview"
        >
          <X className="h-6 w-6" strokeWidth={3} />
        </button>

        {/* ============================================================= */}
        {/* Header — z-20 so it is ALWAYS above the preview/loading area  */}
        {/* ============================================================= */}
        <div className="relative z-20 flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/50 bg-background flex-shrink-0">
          {/* Left: template info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ring-2 ring-white/10 flex-shrink-0"
              style={{ backgroundColor: template.accentColor }}
            />
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate pr-14 sm:pr-0">
                {template.name}
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">
                {template.description}
              </p>
            </div>
          </div>

          {/* Center: device switcher (hidden on small screens) */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg bg-muted p-1">
            {deviceButtons.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setDeviceMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  deviceMode === mode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={label}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Right: use template + close (desktop only close btn) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => template && onUseTemplate(template)}
              disabled={isLoading}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs sm:text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="hidden sm:inline">Creating...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Use Template</span>
                  <span className="sm:hidden">Use</span>
                  <ArrowRight className="h-3.5 w-3.5 hidden sm:block" />
                </>
              )}
            </button>

            {/* Close button — DESKTOP ONLY, mobile uses the floating button above */}
            <button
              onClick={onClose}
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-muted hover:bg-destructive/10 text-foreground hover:text-destructive transition-colors flex-shrink-0"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile device switcher bar */}
        <div className="relative z-20 flex sm:hidden items-center justify-center gap-1 px-3 py-1.5 border-b border-border/30 bg-muted/30 flex-shrink-0">
          {deviceButtons.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setDeviceMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
                deviceMode === mode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ============================================================= */}
        {/* Preview area — relative so the loading spinner stays inside   */}
        {/* ============================================================= */}
        <div className="relative flex-1 bg-muted/30 flex items-start justify-center overflow-hidden p-1.5 sm:p-4 min-h-0">
          <div
            className="relative h-full rounded-lg sm:rounded-xl overflow-hidden border border-border/30 bg-background shadow-xl transition-all duration-500 ease-out"
            style={{
              width: deviceWidths[deviceMode],
              maxWidth: '100%',
            }}
          >
            {/* Loading spinner — scoped to the iframe container only */}
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background z-10">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground animate-pulse">
                  Loading preview...
                </p>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              onLoad={() => setIframeLoading(false)}
              title={`Preview of ${template.name}`}
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
