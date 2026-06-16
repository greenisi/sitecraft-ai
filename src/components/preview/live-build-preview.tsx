'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGenerationStore } from '@/stores/generation-store';

// "Watch it build" — renders the in-flight site live, section by section, as
// each component finishes generating. Uses two cross-fading iframes (double
// buffer) so new sections dissolve in instead of white-flashing on reload.
// The actual rendering reuses POST /api/preview/render, which composes whatever
// sections exist so far (synthesizing a page if the real one hasn't streamed).

const STAGE_COPY: Record<string, string> = {
  'config-assembly': 'Reading your vision',
  'design-system': 'Designing your look & feel',
  blueprint: 'Planning your pages',
  components: 'Building your site',
  assembly: 'Adding the finishing touches',
  complete: 'Your site is ready',
};

function humanize(name: string): string {
  const s = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\bsection\b/i, '')
    .trim();
  return s ? `your ${s.toLowerCase()}` : 'a section';
}

export function LiveBuildPreview({ projectId }: { projectId: string }) {
  const files = useGenerationStore((s) => s.files);
  const progress = useGenerationStore((s) => s.progress);
  const currentStage = useGenerationStore((s) => s.currentStage);
  const components = useGenerationStore((s) => s.components);

  const aRef = useRef<HTMLIFrameElement>(null);
  const bRef = useRef<HTMLIFrameElement>(null);
  const [front, setFront] = useState<'a' | 'b'>('a');
  const [hasRendered, setHasRendered] = useState(false);
  const lastCountRef = useRef(0);
  const busyRef = useRef(false);

  const fileCount = Object.keys(files).length;

  // The section currently mid-generation, for the narration line.
  let activeName: string | null = null;
  for (const c of components.values()) {
    if (c.status === 'generating') {
      activeName = c.name;
      break;
    }
  }

  const doRender = useCallback(async () => {
    if (busyRef.current) return;
    const count = Object.keys(files).length;
    if (count === 0 || count === lastCountRef.current) return;
    busyRef.current = true;
    try {
      const res = await fetch('/api/preview/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, files }),
      });
      if (!res.ok) {
        busyRef.current = false;
        return;
      }
      const html = await res.text();
      lastCountRef.current = count;
      const back = front === 'a' ? bRef.current : aRef.current;
      if (!back) {
        busyRef.current = false;
        return;
      }
      back.onload = () => {
        setFront((f) => (f === 'a' ? 'b' : 'a'));
        setHasRendered(true);
        busyRef.current = false;
        // Let the page paint, then drift toward the newest section so the
        // owner sees the site visibly growing.
        setTimeout(() => {
          try {
            back.contentWindow?.scrollTo({ top: 10_000_000, behavior: 'smooth' });
          } catch {
            /* same-origin guard */
          }
        }, 250);
      };
      back.srcdoc = html;
    } catch {
      busyRef.current = false;
    }
  }, [files, front, projectId]);

  // Debounced render whenever a new section lands.
  useEffect(() => {
    const t = setTimeout(doRender, 450);
    return () => clearTimeout(t);
  }, [fileCount, doRender]);

  const narration = activeName
    ? `Building ${humanize(activeName)}…`
    : currentStage
      ? STAGE_COPY[currentStage] ?? 'Building your site'
      : 'Building your site';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0f] md:rounded-lg">
      <iframe
        ref={aRef}
        title="live-build-a"
        sandbox="allow-scripts allow-same-origin"
        className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${
          front === 'a' ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <iframe
        ref={bRef}
        title="live-build-b"
        sandbox="allow-scripts allow-same-origin"
        className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${
          front === 'b' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Pre-first-paint: branded loader while design system + first section cook */}
      {!hasRendered && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-400" />
          <p className="pk-working text-lg font-semibold">{narration}</p>
          <p className="text-sm text-gray-500">Your site will appear here as it builds, section by section…</p>
        </div>
      )}

      {/* Live narration pill once the site is rendering */}
      {hasRendered && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
          <div className="pk-fade-up flex items-center gap-2 rounded-full border border-purple-700/40 bg-gray-950/80 px-4 py-2 text-sm text-purple-100 shadow-lg backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
            <span className="pk-working font-medium">{narration}</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-400">{Math.max(progress.completed, fileCount)} built</span>
          </div>
        </div>
      )}
    </div>
  );
}
