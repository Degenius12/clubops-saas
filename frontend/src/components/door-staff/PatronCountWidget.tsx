// PatronCountWidget.tsx
// Real-time patron count display for Door Staff Interface (Feature #49)

import React from 'react'
import {
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { usePatronCount } from '../../hooks'

interface PatronCountWidgetProps {
  clubId: string
  compact?: boolean
}

export const PatronCountWidget: React.FC<PatronCountWidgetProps> = ({ clubId, compact = false }) => {
  const { patronCount, isLoading, error } = usePatronCount(clubId)

  if (error) {
    return (
      <div className="px-3 py-2 rounded-lg border bg-status-danger/10 border-status-danger/30 text-status-danger">
        <div className="flex items-center gap-2 text-xs">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>Count Error</span>
        </div>
      </div>
    )
  }

  if (isLoading || !patronCount) {
    return (
      <div className="px-3 py-2 rounded-lg border bg-midnight-800 border-white/10 animate-pulse">
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <UserGroupIcon className="h-4 w-4" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  const { currentCount, capacityLimit, percentFull, trend } = patronCount

  // Determine status color based on capacity
  const getStatusStyles = () => {
    if (!capacityLimit) {
      return {
        bg: 'bg-midnight-800',
        border: 'border-white/10',
        text: 'text-text-primary',
        icon: 'text-electric-400'
      }
    }

    if (percentFull >= 100) {
      return {
        bg: 'bg-status-danger/10',
        border: 'border-status-danger/30',
        text: 'text-status-danger',
        icon: 'text-status-danger',
        pulse: true
      }
    }

    if (percentFull >= 80) {
      return {
        bg: 'bg-status-warning/10',
        border: 'border-status-warning/30',
        text: 'text-status-warning',
        icon: 'text-status-warning'
      }
    }

    return {
      bg: 'bg-status-success/10',
      border: 'border-status-success/30',
      text: 'text-status-success',
      icon: 'text-status-success'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing':
        return <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
      case 'decreasing':
        return <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
      default:
        return <MinusIcon className="h-3.5 w-3.5" />
    }
  }

  const styles = getStatusStyles()

  if (compact) {
    return (
      <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${styles.bg} ${styles.border} ${styles.pulse ? 'animate-pulse' : ''}`}>
        <UserGroupIcon className={`h-4 w-4 ${styles.icon}`} />
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-semibold ${styles.text}`}>
            {currentCount}
          </span>
          {capacityLimit && (
            <>
              <span className="text-xs text-text-tertiary">/</span>
              <span className="text-xs text-text-tertiary">{capacityLimit}</span>
            </>
          )}
        </div>
        {trend !== 'stable' && (
          <div className={`${styles.text}`}>
            {getTrendIcon()}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`card-premium p-4 ${styles.pulse ? 'animate-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${styles.bg} border ${styles.border}`}>
            <UserGroupIcon className={`h-5 w-5 ${styles.icon}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-secondary">Current Capacity</h3>
            <p className="text-xs text-text-tertiary">Live patron count</p>
          </div>
        </div>
        {trend !== 'stable' && (
          <div className={`p-1.5 rounded-lg ${styles.bg} border ${styles.border} ${styles.text}`}>
            {getTrendIcon()}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${styles.text}`}>
          {currentCount}
        </span>
        {capacityLimit && (
          <>
            <span className="text-text-tertiary text-lg">/</span>
            <span className="text-text-tertiary text-lg">{capacityLimit}</span>
          </>
        )}
      </div>

      {capacityLimit && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-text-tertiary">Capacity</span>
            <span className={`font-medium ${styles.text}`}>{percentFull.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-midnight-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                percentFull >= 100
                  ? 'bg-status-danger'
                  : percentFull >= 80
                  ? 'bg-status-warning'
                  : 'bg-status-success'
              }`}
              style={{ width: `${Math.min(percentFull, 100)}%` }}
            />
          </div>
        </div>
      )}

      {percentFull >= 100 && (
        <div className="mt-3 p-2 rounded-lg bg-status-danger/10 border border-status-danger/30">
          <p className="text-xs text-status-danger font-medium">
            ⚠️ Over capacity - Consider limiting entry
          </p>
        </div>
      )}

      {percentFull >= 80 && percentFull < 100 && (
        <div className="mt-3 p-2 rounded-lg bg-status-warning/10 border border-status-warning/30">
          <p className="text-xs text-status-warning font-medium">
            ⚡ Approaching capacity
          </p>
        </div>
      )}
    </div>
  )
}
