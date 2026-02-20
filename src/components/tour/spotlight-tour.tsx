'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Sparkles, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTourStore } from '@/stores/tour-store';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function SpotlightTour() {
  const {
    isActive,
    currentTour,
    currentStep,
    showWelcome,
    isAnimating,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    setAnimating,
  } = useTourStore();

  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isActive) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  // Always clear isAnimating after a short delay regardless of welcome state
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, setAnimating]);

  const updateSpotlight = useCallback(() => {
    if (!currentTour || showWelcome) {
      setSpotlightRect(null);
      return;
    }

    const step = currentTour.steps[currentStep];
    if (!step) return;

    const delay = step.delay || 0;
    const timer = setTimeout(() => {
      let el = document.querySelector(`[data-tour="${step.target}"]`);
      if (!el) el = document.querySelector(step.target);

      if (el) {
        const rect = el.getBoundingClientRect();
        const padding = step.spotlightPadding ?? 8;
        setSpotlightRect({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        setSpotlightRect(null);
      }

    }, delay);

    return () => clearTimeout(timer);
  }, [currentTour, currentStep, showWelcome]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [updateSpotlight]);

  useEffect(() => {
    if (!spotlightRect || !currentTour || showWelcome) {
      setTooltipStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      return;
    }

    const step = currentTour.steps[currentStep];
    if (!step) return;

    const gap = 16;
    const style: React.CSSProperties = {};

    switch (step.placement) {
      case 'bottom':
        style.top = spotlightRect.top + spotlightRect.height + gap;
        style.left = spotlightRect.left + spotlightRect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'top':
        style.bottom = window.innerHeight - spotlightRect.top + gap;
        style.left = spotlightRect.left + spotlightRect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'left':
        style.top = spotlightRect.top + spotlightRect.height / 2;
        style.right = window.innerWidth - spotlightRect.left + gap;
        style.transform = 'translateY(-50%)';
        break;
      case 'right':
        style.top = spotlightRect.top + spotlightRect.height / 2;
        style.left = spotlightRect.left + spotlightRect.width + gap;
        style.transform = 'translateY(-50%)';
        break;
      case 'center':
      default:
        style.top = '50%';
        style.left = '50%';
        style.transform = 'translate(-50%, -50%)';
    }

    setTooltipStyle(style);
  }, [spotlightRect, currentTour, currentStep, showWelcome]);

  if (!isActive || !currentTour || !isMounted) return null;

  const step = currentTour.steps[currentStep];
  const totalSteps = currentTour.steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  const overlayColor = 'rgba(0,0,0,0.7)';
  const ww = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const wh = typeof window !== 'undefined' ? window.innerHeight : 1080;

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: 'opacity 500ms ease',
      }}
    >
      {spotlightRect ? (
        <>
          {/* Top region */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: ww,
              height: Math.max(0, spotlightRect.top),
              backgroundColor: overlayColor,
              transition: 'all 500ms ease',
            }}
            onClick={skipTour}
          />
          {/* Bottom region */}
          <div
            style={{
              position: 'absolute',
              top: spotlightRect.top + spotlightRect.height,
              left: 0,
              width: ww,
              height: Math.max(0, wh - spotlightRect.top - spotlightRect.height),
              backgroundColor: overlayColor,
              transition: 'all 500ms ease',
            }}
            onClick={skipTour}
          />
          {/* Left region */}
          <div
            style={{
              position: 'absolute',
              top: spotlightRect.top,
              left: 0,
              width: Math.max(0, spotlightRect.left),
              height: spotlightRect.height,
              backgroundColor: overlayColor,
              transition: 'all 500ms ease',
            }}
            onClick={skipTour}
          />
          {/* Right region */}
          <div
            style={{
              position: 'absolute',
              top: spotlightRect.top,
              left: spotlightRect.left + spotlightRect.width,
              width: Math.max(0, ww - spotlightRect.left - spotlightRect.width),
              height: spotlightRect.height,
              backgroundColor: overlayColor,
              transition: 'all 500ms ease',
            }}
            onClick={skipTour}
          />
        </>
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: overlayColor,
            transition: 'opacity 500ms ease',
          }}
          onClick={skipTour}
        />
      )}

      {/* Spotlight glow ring */}
      {spotlightRect && (
        <div
          style={{
            position: 'absolute',
            top: spotlightRect.top - 2,
            left: spotlightRect.left - 2,
            width: spotlightRect.width + 4,
            height: spotlightRect.height + 4,
            borderRadius: 12,
            pointerEvents: 'none',
            boxShadow: '0 0 0 2px rgba(139,92,246,0.5), 0 0 20px rgba(139,92,246,0.2)',
            animation: 'tour-pulse 2s ease-in-out infinite',
            transition: 'all 500ms ease',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute',
          zIndex: 10,
          width: 320,
          maxWidth: '90vw',
          pointerEvents: 'auto',
          ...tooltipStyle,
          opacity: isAnimating ? 0 : 1,
          transition: 'opacity 400ms ease',
        }}
      >
        {showWelcome ? (
          <div className="rounded-2xl bg-card border border-border/50 shadow-2xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
              <Sparkles className="h-8 w-8 text-white animate-pulse" />
            </div>
            <h2 className="text-xl font-bold mb-2">{currentTour.welcomeTitle}</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {currentTour.welcomeDescription}
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={skipTour}
                className="flex-1 text-muted-foreground"
              >
                Skip Tour
              </Button>
              <Button
                onClick={nextStep}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-violet-500/20"
              >
                Let&apos;s Go!
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        ) : isLastStep ? (
          <div className="rounded-2xl bg-card border border-border/50 shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20">
                <PartyPopper className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm">{step?.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {step?.description}
                </p>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground font-medium">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <span className="text-[10px] text-emerald-500 font-semibold">
                  Complete!
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
                  style={{ width: '100%', transition: 'width 700ms ease' }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={prevStep} className="text-xs">
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                onClick={completeTour}
                className="flex-1 text-xs bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0"
              >
                Finish Tour
                <PartyPopper className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-card border border-border/50 shadow-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 text-xs font-bold">
                  {currentStep + 1}
                </div>
                <h3 className="font-semibold text-sm">{step?.title}</h3>
              </div>
              <button
                onClick={skipTour}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {step?.description}
            </p>
            <div className="mb-4">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                  style={{
                    width: `${((currentStep + 1) / totalSteps) * 100}%`,
                    transition: 'width 700ms ease',
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {currentStep + 1} of {totalSteps}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="text-xs h-8"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                onClick={nextStep}
                className="text-xs h-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
              >
                Next
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes tour-pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(139,92,246,0.5), 0 0 20px rgba(139,92,246,0.15); }
          50% { box-shadow: 0 0 0 4px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.25); }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}
