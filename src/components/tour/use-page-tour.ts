'use client';

import { useEffect, useRef } from 'react';
import { useTourStore, isTourCompleted } from '@/stores/tour-store';
import { tourConfigMap } from '@/components/tour/tour-configs';

/**
 * Hook that automatically starts a tour the first time a user visits a page.
 * Usage: usePageTour('dashboard') in any page component
 */
export function usePageTour(tourId: string, delay = 800) {
  const startTour = useTourStore((s) => s.startTour);
  const isActive = useTourStore((s) => s.isActive);
  const hasStarted = useRef(false);

  useEffect(() => {
    // Don't start if already showing a tour or already started this session
    if (isActive || hasStarted.current) return;

    // Don't start if this tour was already completed
    if (isTourCompleted(tourId)) return;

    const config = tourConfigMap[tourId];
    if (!config) return;

    hasStarted.current = true;

    // Small delay to let the page render and elements mount
    const timer = setTimeout(() => {
      startTour(config);
    }, delay);

    return () => clearTimeout(timer);
  }, [tourId, delay, startTour, isActive]);
}
