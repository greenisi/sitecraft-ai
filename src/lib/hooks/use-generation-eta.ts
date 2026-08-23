'use client';

import { useEffect, useState } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { estimateSecondsRemaining, formatEta } from '@/lib/generation/eta';

/**
 * Live time-remaining label for the current generation.
 * Re-computes once per second (so the countdown moves between SSE events)
 * and on every store update. Returns null when there's nothing to show.
 */
export function useGenerationEta(): { seconds: number | null; label: string | null } {
  const currentStage = useGenerationStore((s) => s.currentStage);
  const stageStartedAt = useGenerationStore((s) => s.stageStartedAt);
  const progress = useGenerationStore((s) => s.progress);
  const isGenerating = useGenerationStore((s) => s.isGenerating);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isGenerating) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isGenerating]);

  const seconds = estimateSecondsRemaining(
    { currentStage, stageStartedAt, progress, isGenerating },
    now
  );

  return { seconds, label: formatEta(seconds) };
}
