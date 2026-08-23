import type { GenerationStage } from '@/types/generation';

/**
 * Time-remaining estimation for site generation.
 *
 * Stage baselines are seeded from measured Sonnet 5 runs and self-correct
 * live: once the components stage is streaming, the dominant term becomes
 * the observed per-file completion rate (blended with a prior so the first
 * file or two don't whipsaw the estimate). A localStorage EMA carries the
 * learned per-file rate across runs so later generations start accurate.
 */

/** Measured baselines (seconds) — Sonnet 5, pro-build, 2026-07-02 test run. */
const STAGE_BASELINES: Record<string, number> = {
  'config-assembly': 1,
  'design-system': 16,
  'blueprint': 38,
  'components': 220, // refined by totalFiles × perFile once known
  'assembly': 2,
};

const STAGE_ORDER: GenerationStage[] = [
  'config-assembly',
  'design-system',
  'blueprint',
  'components',
  'assembly',
];

/** Prior per-file seconds and blend weight (pseudo-observations). */
const PER_FILE_PRIOR_S = 9;
const PRIOR_WEIGHT = 3;

const STORAGE_KEY = 'sitecraft-eta-per-file-s';

export function loadLearnedPerFile(): number {
  if (typeof window === 'undefined') return PER_FILE_PRIOR_S;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const v = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(v) && v > 1 && v < 120 ? v : PER_FILE_PRIOR_S;
}

/** EMA-update the learned per-file rate after a successful generation. */
export function saveLearnedPerFile(observedPerFileS: number): void {
  if (typeof window === 'undefined') return;
  if (!Number.isFinite(observedPerFileS) || observedPerFileS <= 1 || observedPerFileS > 120) return;
  const prev = loadLearnedPerFile();
  const next = prev * 0.6 + observedPerFileS * 0.4;
  window.localStorage.setItem(STORAGE_KEY, next.toFixed(2));
}

export interface EtaInputs {
  currentStage: GenerationStage | null;
  /** Epoch ms when the current stage started (null before first stage). */
  stageStartedAt: number | null;
  /** Component progress — total is 0 until the components stage announces it. */
  progress: { total: number; completed: number };
  isGenerating: boolean;
}

/**
 * Estimated seconds remaining, or null when no estimate applies
 * (not generating, complete, or errored).
 */
export function estimateSecondsRemaining(inputs: EtaInputs, now: number): number | null {
  const { currentStage, stageStartedAt, progress, isGenerating } = inputs;
  if (!isGenerating || !currentStage) return null;
  if (currentStage === 'complete' || currentStage === 'error') return null;

  const perFile = loadLearnedPerFile();
  const stageIdx = STAGE_ORDER.indexOf(currentStage);
  if (stageIdx === -1) return null;

  const elapsedInStage = stageStartedAt ? Math.max(0, (now - stageStartedAt) / 1000) : 0;

  // Remaining time within the CURRENT stage.
  let remaining = 0;
  if (currentStage === 'components' && progress.total > 0 && progress.completed > 0) {
    // Live rate, blended with the learned prior for early-stage stability.
    const observedRate = (elapsedInStage + perFile * PRIOR_WEIGHT) / (progress.completed + PRIOR_WEIGHT);
    remaining = observedRate * Math.max(0, progress.total - progress.completed);
  } else {
    const baseline =
      currentStage === 'components' && progress.total > 0
        ? progress.total * perFile
        : STAGE_BASELINES[currentStage] ?? 10;
    // Never let a slow stage drive the estimate to zero while still running:
    // keep at least 20% of the stage baseline on the clock.
    remaining = Math.max(baseline - elapsedInStage, baseline * 0.2);
  }

  // Plus baselines for every stage that hasn't started yet.
  for (let i = stageIdx + 1; i < STAGE_ORDER.length; i++) {
    const stage = STAGE_ORDER[i];
    remaining +=
      stage === 'components' && progress.total > 0
        ? progress.total * perFile
        : STAGE_BASELINES[stage] ?? 10;
  }

  return Math.max(1, Math.round(remaining));
}

/**
 * Human-friendly countdown label. Coarse on purpose — second-precision
 * numbers jump around and read as broken.
 */
export function formatEta(seconds: number | null): string | null {
  if (seconds === null) return null;
  if (seconds > 150) return `about ${Math.round(seconds / 60)} minutes left`;
  if (seconds > 90) return 'about 2 minutes left';
  if (seconds > 45) return 'about a minute left';
  if (seconds > 20) return 'less than a minute left';
  return 'almost done…';
}
