import React, { useEffect, useState, useRef } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

/**
 * INTERACTIVE PRODUCT TOUR
 *
 * Spotlight-style overlay that highlights specific elements and provides
 * step-by-step guidance through ClubFlow features.
 *
 * Features:
 * - Spotlight effect on target elements
 * - Backdrop blur for focus
 * - Keyboard navigation (← → arrows, ESC)
 * - Smooth transitions
 * - Responsive positioning
 */

interface TourTooltipProps {
  title: string;
  content: string;
  currentStep: number;
  totalSteps: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  showAction?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

const TourTooltip: React.FC<TourTooltipProps> = ({
  title,
  content,
  currentStep,
  totalSteps,
  placement,
  onNext,
  onPrevious,
  onSkip,
  showAction,
  actionLabel,
  onAction,
}) => {
  const placementClasses = {
    top: 'bottom-full mb-4',
    bottom: 'top-full mt-4',
    left: 'right-full mr-4',
    right: 'left-full ml-4',
  };

  return (
    <div
      className={`absolute ${placementClasses[placement]} z-[100] w-80 animate-fade-in`}
      role="dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-content"
    >
      {/* Tooltip Card */}
      <div className="bg-midnight-800 border border-midnight-600 rounded-xl shadow-elevated backdrop-blur-xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-midnight-700">
          <div className="flex items-start justify-between mb-2">
            <h3
              id="tour-title"
              className="text-lg font-semibold text-text-primary"
            >
              {title}
            </h3>
            <button
              onClick={onSkip}
              className="text-text-tertiary hover:text-text-secondary transition-colors duration-200"
              aria-label="Skip tour"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-1 bg-midnight-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
            <span className="text-xs text-text-tertiary font-mono tabular-nums">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <p id="tour-content" className="text-sm text-text-secondary leading-relaxed">
            {content}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={onPrevious}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-midnight-700 rounded-lg transition-all duration-200"
                aria-label="Previous step"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showAction && actionLabel && (
              <button
                onClick={onAction}
                className="px-4 py-2 text-sm font-medium text-gold-500 hover:text-gold-400 hover:bg-midnight-700 rounded-lg transition-all duration-200"
              >
                {actionLabel}
              </button>
            )}

            {currentStep < totalSteps - 1 ? (
              <button
                onClick={onNext}
                className="px-4 py-2 text-sm font-medium bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-all duration-200 shadow-glow-gold hover:shadow-glow-gold-lg"
                aria-label="Next step"
              >
                Next
                <svg className="w-4 h-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={onNext}
                className="px-4 py-2 text-sm font-medium bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-all duration-200 shadow-glow-gold hover:shadow-glow-gold-lg"
              >
                Finish Tour
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-2 px-2 flex items-center justify-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-midnight-800 border border-midnight-600 rounded text-xs">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-midnight-800 border border-midnight-600 rounded text-xs">→</kbd>
          Navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-midnight-800 border border-midnight-600 rounded text-xs">ESC</kbd>
          Skip
        </span>
      </div>
    </div>
  );
};

export const InteractiveTour: React.FC = () => {
  const { activeTour, currentTourStep, nextTourStep, previousTourStep, endTour } = useOnboarding();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStep = activeTour?.[currentTourStep];

  // Update target element and spotlight position
  useEffect(() => {
    if (!currentStep) {
      setTargetElement(null);
      setSpotlightRect(null);
      return;
    }

    const element = document.querySelector(currentStep.target) as HTMLElement;
    if (element) {
      setTargetElement(element);

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Update spotlight dimensions
      const updateSpotlight = () => {
        const rect = element.getBoundingClientRect();
        setSpotlightRect(rect);
      };

      updateSpotlight();

      // Update on resize
      window.addEventListener('resize', updateSpotlight);
      return () => window.removeEventListener('resize', updateSpotlight);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeTour) return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextTourStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentTourStep > 0) previousTourStep();
          break;
        case 'Escape':
          e.preventDefault();
          endTour();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTour, currentTourStep, nextTourStep, previousTourStep, endTour]);

  if (!activeTour || !currentStep || !spotlightRect) {
    return null;
  }

  const padding = 8;
  const spotlightX = spotlightRect.left - padding;
  const spotlightY = spotlightRect.top - padding;
  const spotlightWidth = spotlightRect.width + padding * 2;
  const spotlightHeight = spotlightRect.height + padding * 2;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[90] animate-fade-in"
      role="presentation"
      aria-hidden="true"
    >
      {/* Backdrop with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'hard-light' }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={spotlightX}
              y={spotlightY}
              width={spotlightWidth}
              height={spotlightHeight}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.85)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Backdrop blur overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm pointer-events-none"
        style={{
          clipPath: `polygon(
            0% 0%,
            0% 100%,
            ${spotlightX}px 100%,
            ${spotlightX}px ${spotlightY}px,
            ${spotlightX + spotlightWidth}px ${spotlightY}px,
            ${spotlightX + spotlightWidth}px ${spotlightY + spotlightHeight}px,
            ${spotlightX}px ${spotlightY + spotlightHeight}px,
            ${spotlightX}px 100%,
            100% 100%,
            100% 0%
          )`,
        }}
      />

      {/* Spotlight glow ring */}
      <div
        className="absolute pointer-events-none transition-all duration-300 ease-out"
        style={{
          left: `${spotlightX}px`,
          top: `${spotlightY}px`,
          width: `${spotlightWidth}px`,
          height: `${spotlightHeight}px`,
          boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.3), 0 0 20px rgba(212, 175, 55, 0.2)',
          borderRadius: '12px',
        }}
      />

      {/* Tooltip positioned relative to target */}
      {targetElement && (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: `${spotlightRect.left + spotlightRect.width / 2}px`,
            top: currentStep.placement === 'bottom' ? `${spotlightRect.bottom}px` : `${spotlightRect.top}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <TourTooltip
            title={currentStep.title}
            content={currentStep.content}
            currentStep={currentTourStep}
            totalSteps={activeTour.length}
            placement={currentStep.placement || 'bottom'}
            onNext={nextTourStep}
            onPrevious={previousTourStep}
            onSkip={endTour}
            showAction={!!currentStep.action}
            actionLabel={currentStep.action?.label}
            onAction={currentStep.action?.onClick}
          />
        </div>
      )}
    </div>
  );
};
