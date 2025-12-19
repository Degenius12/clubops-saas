import React, { useEffect } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { WelcomeScreen } from './WelcomeScreen';
import { SetupChecklist } from './SetupChecklist';
import { InteractiveTour } from './InteractiveTour';

/**
 * ONBOARDING FLOW ORCHESTRATOR
 *
 * Main component that manages the onboarding experience.
 * Routes users through different steps based on their progress.
 *
 * Flow:
 * 1. Welcome screen - Role selection & intro video
 * 2. Club setup - Configuration checklist
 * 3. Feature tours - Interactive product tours
 * 4. Complete - Celebration & next steps
 */

const ClubSetupStep: React.FC = () => {
  const { updateChecklist, nextStep } = useOnboarding();

  useEffect(() => {
    // Initialize club setup checklist
    updateChecklist([
      {
        id: 'club-info',
        title: 'Add Club Information',
        description: 'Set your club name, address, and contact details',
        completed: false,
        required: true,
        action: () => {
          // Navigate to settings/club-info
          console.log('Navigate to club info settings');
        },
      },
      {
        id: 'vip-booths',
        title: 'Configure VIP Booths',
        description: 'Add your VIP booth sections with pricing and capacity',
        completed: false,
        required: true,
        action: () => {
          console.log('Navigate to VIP booth configuration');
        },
      },
      {
        id: 'operating-hours',
        title: 'Set Operating Hours',
        description: 'Define your club hours and special event schedules',
        completed: false,
        required: true,
        action: () => {
          console.log('Navigate to operating hours settings');
        },
      },
      {
        id: 'fees-taxes',
        title: 'Configure Fees & Taxes',
        description: 'Set up service charges, taxes, and gratuity rates',
        completed: false,
        required: true,
        action: () => {
          console.log('Navigate to fees settings');
        },
      },
      {
        id: 'add-staff',
        title: 'Add Staff Members',
        description: 'Invite your team and assign roles (managers, hosts, security)',
        completed: false,
        required: false,
        action: () => {
          console.log('Navigate to staff management');
        },
      },
      {
        id: 'payment-methods',
        title: 'Set Up Payment Methods',
        description: 'Configure accepted payment types and processing',
        completed: false,
        required: false,
        action: () => {
          console.log('Navigate to payment settings');
        },
      },
    ]);
  }, [updateChecklist]);

  return (
    <div className="min-h-screen bg-midnight-900">
      <SetupChecklist />

      {/* Continue Button (shown when required tasks complete) */}
      <div className="max-w-3xl mx-auto px-6 pb-12">
        <button
          onClick={nextStep}
          className="w-full px-6 py-4 text-base font-medium bg-gold-500 hover:bg-gold-600 text-white rounded-xl transition-all duration-200 shadow-glow-gold hover:shadow-glow-gold-lg"
        >
          Continue to Feature Tour
          <svg className="w-5 h-5 inline-block ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const FeatureTourStep: React.FC = () => {
  const { startTour, nextStep } = useOnboarding();

  useEffect(() => {
    // Start the dashboard feature tour
    startTour([
      {
        id: 'dashboard-overview',
        target: '[data-tour="dashboard"]',
        title: 'Your Dashboard',
        content: 'This is your command center. Monitor revenue, active dancers, VIP bookings, and security alerts in real-time.',
        placement: 'bottom',
      },
      {
        id: 'revenue-kpi',
        target: '[data-tour="revenue-kpi"]',
        title: 'Live Revenue Tracking',
        content: 'Track tonight\'s revenue in real-time. See VIP bookings, dancer fees, and total earnings updated every second.',
        placement: 'bottom',
      },
      {
        id: 'dancer-management',
        target: '[data-tour="dancer-nav"]',
        title: 'Dancer Management',
        content: 'Manage your talent roster. Track check-ins, stage rotations, and earnings. All in one place.',
        placement: 'right',
      },
      {
        id: 'vip-booths',
        target: '[data-tour="vip-nav"]',
        title: 'VIP Booth Management',
        content: 'Reserve and manage VIP booths. Track bottle service, minimums, and guest preferences.',
        placement: 'right',
      },
      {
        id: 'security-dashboard',
        target: '[data-tour="security-nav"]',
        title: 'Security & Compliance',
        content: 'Monitor incidents, track banned individuals, and maintain audit logs for compliance.',
        placement: 'right',
      },
    ]);
  }, [startTour]);

  const handleSkipTour = () => {
    nextStep();
  };

  return (
    <div className="min-h-screen bg-midnight-900 flex items-center justify-center p-6">
      <div className="max-w-lg text-center">
        <div className="w-16 h-16 rounded-full bg-gold-500/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-3">Take a Quick Tour</h2>
        <p className="text-text-secondary mb-8">
          Let's show you around ClubFlow. We'll highlight key features to help you get started.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleSkipTour}
            className="w-full px-6 py-3 text-base font-medium bg-gold-500 hover:bg-gold-600 text-white rounded-xl transition-all duration-200 shadow-glow-gold"
          >
            Start Tour
          </button>
          <button
            onClick={handleSkipTour}
            className="w-full px-6 py-3 text-base font-medium text-text-tertiary hover:text-text-secondary hover:bg-midnight-800 rounded-xl transition-all duration-200"
          >
            Skip Tour
          </button>
        </div>
      </div>
    </div>
  );
};

const CompletionStep: React.FC = () => {
  const { completeOnboarding } = useOnboarding();

  return (
    <div className="min-h-screen bg-midnight-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center animate-fade-in-up">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-status-success to-status-success/80 flex items-center justify-center mx-auto shadow-glow-success animate-scale-in">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-gold-500 animate-float"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-60px)`,
                    animationDelay: `${i * 0.1}s`,
                    opacity: 0.6,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-text-primary mb-4">
          You're All Set! 🎉
        </h1>
        <p className="text-xl text-text-secondary mb-8 max-w-xl mx-auto">
          ClubFlow is ready to help you run your best night ever.
          Let's get started!
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="p-4 bg-midnight-800 border border-midnight-600 rounded-xl">
            <div className="text-3xl font-bold text-gold-500 mb-1">✓</div>
            <p className="text-sm text-text-tertiary">Setup Complete</p>
          </div>
          <div className="p-4 bg-midnight-800 border border-midnight-600 rounded-xl">
            <div className="text-3xl font-bold text-gold-500 mb-1">5m</div>
            <p className="text-sm text-text-tertiary">Time Saved</p>
          </div>
          <div className="p-4 bg-midnight-800 border border-midnight-600 rounded-xl">
            <div className="text-3xl font-bold text-gold-500 mb-1">100%</div>
            <p className="text-sm text-text-tertiary">Ready to Go</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-midnight-800 border border-midnight-600 rounded-xl p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Recommended Next Steps:</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-text-secondary">Check in your first dancers for tonight</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-text-secondary">Create your first VIP booth reservation</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gold-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-text-secondary">Explore the security dashboard and incident reporting</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <button
          onClick={completeOnboarding}
          className="px-12 py-4 text-lg font-medium bg-gold-500 hover:bg-gold-600 text-white rounded-xl transition-all duration-200 shadow-glow-gold-lg hover:scale-105"
        >
          Go to Dashboard
          <svg className="w-5 h-5 inline-block ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        {/* Support Link */}
        <p className="mt-6 text-sm text-text-tertiary">
          Need help?{' '}
          <a href="#" className="text-gold-500 hover:text-gold-400 transition-colors">
            Contact our 24/7 support team
          </a>
        </p>
      </div>
    </div>
  );
};

export const OnboardingFlow: React.FC = () => {
  const { isActive, currentStep } = useOnboarding();

  // Don't render if onboarding is not active
  if (!isActive) {
    return null;
  }

  // Render appropriate step
  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'club-setup':
        return <ClubSetupStep />;
      case 'first-dancer':
      case 'vip-booth-tour':
      case 'security-intro':
        return <FeatureTourStep />;
      case 'complete':
        return <CompletionStep />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <>
      {/* Main onboarding content */}
      {renderStep()}

      {/* Interactive tour overlay (rendered on top when active) */}
      <InteractiveTour />
    </>
  );
};
