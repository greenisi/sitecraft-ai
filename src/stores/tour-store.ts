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

// ── localStorage key ──────────────────────────────────────────────────
const STORAGE_KEY = 'sitecraft-completed-tours';

function getCompletedTours(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function markTourCompleted(tourId: string) {
  if (typeof window === 'undefined') return;
  const completed = getCompletedTours();
  if (!completed.includes(tourId)) {
    completed.push(tourId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  }
}

export function isTourCompleted(tourId: string): boolean {
  return getCompletedTours().includes(tourId);
}

export function resetAllTours() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// ── Zustand Store ─────────────────────────────────────────────────────
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
