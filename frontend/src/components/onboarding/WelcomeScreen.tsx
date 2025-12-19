import React, { useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

/**
 * WELCOME SCREEN
 *
 * First impression for new users with animated introduction.
 * Sets the tone for the ClubFlow experience.
 *
 * Features:
 * - Animated logo reveal
 * - Role selection
 * - Video walkthrough option
 * - Skip functionality
 * - Premium dark theme aesthetic
 */

interface RoleOption {
  id: 'owner' | 'manager' | 'vip-host' | 'door-staff' | 'dj';
  title: string;
  description: string;
  icon: React.ReactNode;
}

const roleOptions: RoleOption[] = [
  {
    id: 'owner',
    title: 'Club Owner',
    description: 'Full access to all features, reports, and settings',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    id: 'manager',
    title: 'Manager',
    description: 'Manage operations, staff, and daily activities',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    id: 'vip-host',
    title: 'VIP Host',
    description: 'Manage VIP booths, reservations, and guest experience',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: 'door-staff',
    title: 'Door Staff',
    description: 'Security, entry management, and incident tracking',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    id: 'dj',
    title: 'DJ',
    description: 'Manage music requests and performance schedule',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
        />
      </svg>
    ),
  },
];

export const WelcomeScreen: React.FC = () => {
  const { startOnboarding, skipStep } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState<RoleOption['id'] | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  const handleGetStarted = () => {
    if (selectedRole) {
      startOnboarding(selectedRole);
    }
  };

  const handleSkip = () => {
    skipStep('welcome');
  };

  return (
    <div className="min-h-screen bg-midnight-900 flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-4xl w-full">
        {/* Logo & Title */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 mb-6 shadow-glow-gold-lg animate-float">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>

          <h1 className="text-5xl font-bold text-text-primary mb-4 tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">ClubFlow</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            The premium operations platform built for nightclub excellence.
            Let's get you set up in under 5 minutes.
          </p>
        </div>

        {/* Video Preview (Optional) */}
        {!showVideo ? (
          <div className="mb-8">
            <button
              onClick={() => setShowVideo(true)}
              className="w-full group relative overflow-hidden rounded-2xl border border-midnight-600 hover:border-gold-500 transition-all duration-300 shadow-card hover:shadow-elevated"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-midnight-800 to-midnight-900 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/80 to-transparent" />

                {/* Play Button */}
                <div className="relative z-10 w-20 h-20 rounded-full bg-gold-500 group-hover:bg-gold-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-glow-gold-lg">
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-midnight-950/90 backdrop-blur-sm rounded-lg text-sm text-text-secondary border border-midnight-700">
                  <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  45 seconds
                </div>
              </div>

              {/* Caption */}
              <div className="p-4 text-left bg-midnight-800 border-t border-midnight-700">
                <p className="text-sm text-text-secondary">
                  <span className="text-text-primary font-medium">Watch a quick tour</span> to see ClubFlow in action
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="mb-8 animate-scale-in">
            <div className="relative rounded-2xl overflow-hidden border border-midnight-600 shadow-elevated">
              <div className="aspect-video bg-midnight-950 flex items-center justify-center">
                <p className="text-text-tertiary">Video player would be embedded here</p>
              </div>
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 p-2 bg-midnight-950/80 backdrop-blur-sm rounded-lg hover:bg-midnight-900 transition-colors"
                aria-label="Close video"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Role Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">What's your role?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roleOptions.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`
                  group p-4 rounded-xl border-2 text-left transition-all duration-200
                  ${
                    selectedRole === role.id
                      ? 'border-gold-500 bg-gold-500/10 shadow-glow-gold'
                      : 'border-midnight-600 bg-midnight-800 hover:border-midnight-500 hover:bg-midnight-750'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                    flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
                    ${
                      selectedRole === role.id
                        ? 'bg-gold-500 text-white'
                        : 'bg-midnight-700 text-gold-500 group-hover:bg-midnight-650'
                    }
                  `}
                  >
                    {role.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary mb-1">{role.title}</h3>
                    <p className="text-sm text-text-tertiary">{role.description}</p>
                  </div>
                  {selectedRole === role.id && (
                    <div className="flex-shrink-0 mt-1 animate-scale-in">
                      <svg className="w-5 h-5 text-gold-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-sm font-medium text-text-tertiary hover:text-text-secondary transition-colors duration-200"
          >
            Skip for now
          </button>

          <button
            onClick={handleGetStarted}
            disabled={!selectedRole}
            className={`
              px-8 py-3 text-base font-medium rounded-xl transition-all duration-200
              ${
                selectedRole
                  ? 'bg-gold-500 hover:bg-gold-600 text-white shadow-glow-gold hover:shadow-glow-gold-lg hover:scale-105'
                  : 'bg-midnight-700 text-text-muted cursor-not-allowed'
              }
            `}
          >
            Get Started
            <svg className="w-5 h-5 inline-block ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        {/* Benefits Footer */}
        <div className="mt-12 pt-8 border-t border-midnight-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-midnight-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-text-primary mb-1">Quick Setup</h4>
                <p className="text-xs text-text-tertiary">Get up and running in under 5 minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-midnight-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-text-primary mb-1">Secure & Private</h4>
                <p className="text-xs text-text-tertiary">Bank-level encryption for your data</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-midnight-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-text-primary mb-1">24/7 Support</h4>
                <p className="text-xs text-text-tertiary">We're here whenever you need help</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
