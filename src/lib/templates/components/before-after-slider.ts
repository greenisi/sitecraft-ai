// Drop-in component the trade-tuned home pro prompt can reference by name.
// Lives here as a source-string so the publish/scaffold step can inject it
// into generated sites without the AI re-inventing it from scratch (and
// without re-bracket-balancing it on every gen).
//
// Output: a single-file React component for src/components/BeforeAfterSlider.tsx
// inside the generated site.

export const BEFORE_AFTER_SLIDER_TSX = String.raw`'use client';

import { useEffect, useRef, useState } from 'react';

export interface BeforeAfterPair {
  before: string;          // image URL
  after: string;           // image URL
  caption?: string;
}

interface Props {
  pairs: BeforeAfterPair[];
  className?: string;
}

/**
 * Drag-to-reveal before/after slider. Works on touch and mouse.
 * Designed for trades where the work is visually transformative:
 * pressure washing, painting, landscaping, roofing.
 */
export default function BeforeAfterSlider({ pairs, className = '' }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (!pairs || pairs.length === 0) return null;
  const active = pairs[activeIdx];

  return (
    <div className={'w-full ' + className}>
      <Slider before={active.before} after={active.after} />
      {active.caption && (
        <p className="mt-3 text-sm text-center text-gray-600 dark:text-gray-300">
          {active.caption}
        </p>
      )}
      {pairs.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {pairs.map((_, i) => (
            <button
              key={i}
              aria-label={'Show pair ' + (i + 1)}
              onClick={() => setActiveIdx(i)}
              className={
                'h-2 rounded-full transition-all ' +
                (i === activeIdx ? 'w-6 bg-gray-800 dark:bg-white' : 'w-2 bg-gray-300 dark:bg-gray-600')
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Slider({ before, after }: { before: string; after: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState(50); // percent
  const dragging = useRef(false);

  function move(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPos(pct);
  }

  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      move(clientX);
    }
    function onUp() { dragging.current = false; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl select-none touch-none bg-gray-100 dark:bg-gray-900"
      onMouseDown={(e) => { dragging.current = true; move(e.clientX); }}
      onTouchStart={(e) => { dragging.current = true; move(e.touches[0].clientX); }}
    >
      {/* After image (full) */}
      <img
        src={after}
        alt="After"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: pos + '%' }}
      >
        <img
          src={before}
          alt="Before"
          className="absolute inset-0 h-full w-[100vw] max-w-none object-cover"
          style={{ width: 'calc(100% * ' + (100 / pos) + ')' }}
          draggable={false}
        />
      </div>
      {/* Labels */}
      <span className="absolute top-3 left-3 px-2 py-1 rounded text-[11px] uppercase tracking-wider font-semibold bg-black/60 text-white">Before</span>
      <span className="absolute top-3 right-3 px-2 py-1 rounded text-[11px] uppercase tracking-wider font-semibold bg-black/60 text-white">After</span>
      {/* Divider line + handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
        style={{ left: pos + '%' }}
      />
      <button
        type="button"
        aria-label="Drag to compare"
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-ew-resize"
        style={{ left: pos + '%' }}
        onMouseDown={(e) => { dragging.current = true; move(e.clientX); }}
        onTouchStart={(e) => { dragging.current = true; move(e.touches[0].clientX); }}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l-4 6 4 6" />
          <path d="M15 6l4 6-4 6" />
        </svg>
      </button>
    </div>
  );
}
`;
