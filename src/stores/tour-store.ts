import { create } from 'zustand';

// ── Tour Step Definition ──────────────────────────────────────────────
export interface TourStep {
  /** CSS selector or data-tour attribute to highlight */
  target: string;
  /** Title of this step */
  title: string;
  /** Description text */
  description: string;
  /** Position of the tooltip relative to the spotlight */
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Optional: extra padding around the spotlight (px) */
  spotlightPadding?: number;
  /** Optional: delay before showing this step (ms) */
  delay?: number;
}

export interface TourConfig {
  /** Unique tour identifier (matches page name) */
  id: string;
  /** Tour steps */
  steps: TourStep[];
  /** Welcome title shown before the tour starts */
  welcomeTitle?: string;
  /** Welcome description */
  welcomeDescription?: string;
}

// ── localStorage key (scoped per user) ──────────────────────────────
const BASE_KEY = 'sitecraft-completed-tours';

/**
 * Get a user-scoped storage key. Reads the current Supabase user ID
 * from the auth session in localStorage so each account gets its own
 * set of completed tours.
 */
function getStorageKey(): string {
  if (typeof window === 'undefined') return BASE_KEY;
  try {
    // Supabase stores auth in localStorage; find the session key
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          const uid = parsed?.user?.id;
          if (uid) return BASE_KEY + '-' + uid;
        }
      }
    }
  } catch { /* ignore parse errors */ }
  return BASE_KEY;
}

function getCompletedTours(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(getStorageKey()) || '[]');
  } catch {
    return [];
  }
}

function markTourCompleted(tourId: string) {
  if (typeof window === 'undefined') return;
  const key = getStorageKey();
  const completed = getCompletedTours();
  if (!completed.includes(tourId)) {
    completed.push(tourId);
    localStorage.setItem(key, JSON.stringify(completed));
  }
}

export function isTourCompleted(tourId: string): boolean {
  return getCompletedTours().includes(tourId);
}

export function resetAllTours() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getStorageKey());
  }
}

// ── Zustand Store ───────────────────────────────────────────────────────

interface TourState {
  isActive: boolean;
  currentTour: TourConfig | null;
  currentStep: number;
  showWelcome: boolean;
  isAnimating: boolean;

  startTour: (config: TourConfig) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  setAnimating: (v: boolean) => void;
}

export const useTourStore = create<TourState>((set, get) => ({
  isActive: false,
  currentTour: null,
  currentStep: 0,
  showWelcome: false,
  isAnimating: false,

  startTour: (config) =>
    set({
      isActive: true,
      currentTour: config,
      currentStep: 0,
      showWelcome: !!config.welcomeTitle,
      isAnimating: true,
    }),

  nextStep: () => {
    const { currentTour, currentStep, showWelcome } = get();
    if (!currentTour) return;

    if (showWelcome) {
      set({ showWelcome: false, isAnimating: true });
      return;
    }

    if (currentStep < currentTour.steps.length - 1) {
      set({ currentStep: currentStep + 1, isAnimating: true });
    } else {
      get().completeTour();
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1, isAnimating: true });
    }
  },

  skipTour: () => {
    const { currentTour } = get();
    if (currentTour) markTourCompleted(currentTour.id);
    set({
      isActive: false,
      currentTour: null,
      currentStep: 0,
      showWelcome: false,
      isAnimating: false,
    });
  },

  completeTour: () => {
    const { currentTour } = get();
    if (currentTour) markTourCompleted(currentTour.id);
    set({
      isActive: false,
      currentTour: null,
      currentStep: 0,
      showWelcome: false,
      isAnimating: false,
    });
  },

  setAnimating: (v) => set({ isAnimating: v }),
}));
