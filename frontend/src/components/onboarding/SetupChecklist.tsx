import React from 'react';
import { useOnboarding, OnboardingChecklistItem } from '../../contexts/OnboardingContext';

/**
 * SETUP CHECKLIST
 *
 * Progressive disclosure of setup tasks with clear progress tracking.
 * Guides club owners through essential configuration steps.
 *
 * Features:
 * - Visual progress bar
 * - Required vs. optional tasks
 * - Action buttons for each task
 * - Completion celebration
 * - Time estimates
 */

interface ChecklistItemProps {
  item: OnboardingChecklistItem;
  onComplete: (id: string) => void;
}

const ChecklistItemComponent: React.FC<ChecklistItemProps> = ({ item, onComplete }) => {
  const Icon = item.icon;

  return (
    <div
      className={`
        group relative p-4 rounded-xl border transition-all duration-300
        ${
          item.completed
            ? 'bg-status-success-muted border-status-success-border'
            : 'bg-midnight-800 border-midnight-600 hover:border-midnight-500 hover:bg-midnight-750'
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox / Checkmark */}
        <div className="flex-shrink-0 mt-0.5">
          {item.completed ? (
            <div className="w-6 h-6 rounded-full bg-status-success flex items-center justify-center animate-scale-in">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-midnight-500 group-hover:border-gold-500 transition-colors duration-200" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4 text-gold-500 flex-shrink-0" />}
              <h4
                className={`font-medium ${
                  item.completed ? 'text-text-secondary line-through' : 'text-text-primary'
                }`}
              >
                {item.title}
                {item.required && !item.completed && (
                  <span className="ml-2 text-xs text-status-danger">*Required</span>
                )}
              </h4>
            </div>
          </div>

          <p className="text-sm text-text-tertiary mb-3">{item.description}</p>

          {!item.completed && item.action && (
            <button
              onClick={() => {
                item.action?.();
                onComplete(item.id);
              }}
              className="px-4 py-2 text-sm font-medium bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-all duration-200 shadow-glow-gold hover:shadow-glow-gold-lg"
            >
              Complete This Step
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const SetupChecklist: React.FC = () => {
  const { checklist, completeChecklistItem, progress } = useOnboarding();

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const requiredCount = checklist.filter((item) => item.required).length;
  const completedRequiredCount = checklist.filter((item) => item.required && item.completed).length;

  const isAllCompleted = completedCount === totalCount;
  const isAllRequiredCompleted = completedRequiredCount === requiredCount;

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text-primary mb-2">Set Up Your Club</h2>
        <p className="text-text-secondary">
          Complete these steps to get ClubFlow ready for your first shift.
        </p>
      </div>

      {/* Overall Progress */}
      <div className="mb-8 p-6 bg-midnight-800 border border-midnight-600 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Setup Progress</h3>
            <p className="text-sm text-text-tertiary">
              {completedCount} of {totalCount} tasks completed
              {requiredCount > 0 && (
                <span className="ml-2 text-status-danger">
                  ({completedRequiredCount}/{requiredCount} required)
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gold-500 tabular-nums">{progress}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-midnight-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-700 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Completion Message */}
        {isAllRequiredCompleted && !isAllCompleted && (
          <div className="mt-4 p-3 bg-status-success-muted border border-status-success-border rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-status-success font-medium">
                All required tasks complete! Optional tasks remaining.
              </p>
            </div>
          </div>
        )}

        {isAllCompleted && (
          <div className="mt-4 p-4 bg-gradient-to-r from-status-success-muted to-status-success-muted border border-status-success-border rounded-lg animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-status-success flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-status-success mb-1">Setup Complete!</h4>
                <p className="text-sm text-text-secondary">
                  You're all set. ClubFlow is ready for your first shift.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklist.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-midnight-800 border border-midnight-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-text-tertiary">No setup tasks available yet.</p>
          </div>
        ) : (
          checklist.map((item) => (
            <ChecklistItemComponent key={item.id} item={item} onComplete={completeChecklistItem} />
          ))
        )}
      </div>

      {/* Time Estimate */}
      {!isAllCompleted && checklist.length > 0 && (
        <div className="mt-6 p-4 bg-midnight-800/50 border border-midnight-700 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Estimated time to complete: <span className="text-text-secondary font-medium">~5-10 minutes</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
