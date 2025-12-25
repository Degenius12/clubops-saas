import React from 'react'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface DataCardProps {
  label: string
  value: string | number
  change?: {
    value: number
    label: string
  }
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
  loading?: boolean
  sparkline?: number[]
}

/**
 * Data Card - Vercel/Airtable inspired
 * Clean metric display with optional sparkline
 */
export const DataCard: React.FC<DataCardProps> = ({
  label,
  value,
  change,
  trend,
  icon: Icon,
  iconColor = 'text-gold-500',
  loading = false,
  sparkline
}) => {
  if (loading) {
    return (
      <div className="card-premium p-6">
        <div className="skeleton-text w-24 mb-4" />
        <div className="skeleton-heading w-32 mb-2" />
        <div className="skeleton-text w-20" />
      </div>
    )
  }

  return (
    <div className="card-premium p-6 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <span className="stat-value-lg tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>

      {/* Change Indicator */}
      {change && (
        <div className="flex items-center gap-2">
          {trend === 'up' && (
            <span className="stat-change-positive flex items-center gap-1">
              <ArrowTrendingUpIcon className="h-3 w-3" />
              {change.value > 0 ? '+' : ''}{change.value}%
            </span>
          )}
          {trend === 'down' && (
            <span className="stat-change-negative flex items-center gap-1">
              <ArrowTrendingDownIcon className="h-3 w-3" />
              {change.value}%
            </span>
          )}
          {trend === 'neutral' && (
            <span className="inline-flex items-center text-sm font-medium px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted">
              {change.value}%
            </span>
          )}
          <span className="text-xs text-text-muted">{change.label}</span>
        </div>
      )}

      {/* Sparkline */}
      {sparkline && sparkline.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.04]">
          <Sparkline data={sparkline} color={iconColor} />
        </div>
      )}
    </div>
  )
}

/**
 * Sparkline Chart - Minimal line chart
 */
const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = 'text-gold-500' }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = range === 0 ? 50 : ((max - value) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <svg
      viewBox="0 0 100 30"
      className="w-full h-8"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={color}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * Compact Data Card - For dense layouts
 */
export const DataCardCompact: React.FC<{
  label: string
  value: string | number
  change?: { value: number; trend: 'up' | 'down' }
}> = ({ label, value, change }) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
      <div>
        <p className="text-xs text-text-tertiary mb-1">{label}</p>
        <p className="text-xl font-bold font-mono text-text-primary tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
      {change && (
        <span className={change.trend === 'up' ? 'stat-change-positive' : 'stat-change-negative'}>
          {change.value > 0 ? '+' : ''}{change.value}%
        </span>
      )}
    </div>
  )
}

/**
 * Metric Grid - Display multiple related metrics
 */
export const MetricGrid: React.FC<{
  metrics: Array<{
    label: string
    value: string | number
    sublabel?: string
  }>
}> = ({ metrics }) => {
  return (
    <div className="card-premium p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-white/[0.04]">
        {metrics.map((metric, index) => (
          <div key={index} className={index > 0 ? 'pl-6' : ''}>
            <p className="text-xs text-text-tertiary mb-2">{metric.label}</p>
            <p className="text-2xl font-bold font-mono text-text-primary tabular-nums mb-1">
              {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
            </p>
            {metric.sublabel && (
              <p className="text-xs text-text-muted">{metric.sublabel}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Progress Card - For goals and targets
 */
export const ProgressCard: React.FC<{
  label: string
  current: number
  target: number
  unit?: string
}> = ({ label, current, target, unit = '' }) => {
  const percentage = Math.min((current / target) * 100, 100)
  const isComplete = current >= target

  return (
    <div className="card-premium p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="stat-label">{label}</span>
        {isComplete && (
          <span className="badge-success">Complete</span>
        )}
      </div>

      <div className="mb-4">
        <span className="stat-value-lg tabular-nums">
          {current.toLocaleString()}{unit}
        </span>
        <span className="text-sm text-text-muted ml-2">
          / {target.toLocaleString()}{unit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-text-tertiary font-medium">Progress</span>
          <span className="text-gold-500 font-semibold tabular-nums">
            {Math.round(percentage)}%
          </span>
        </div>
        <div className="h-2 bg-midnight-700 rounded-full overflow-hidden border border-white/[0.04]">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: isComplete ? '#10B981' : '#D4AF37'
            }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Comparison Card - Compare two values
 */
export const ComparisonCard: React.FC<{
  label: string
  current: { label: string; value: number }
  previous: { label: string; value: number }
  unit?: string
}> = ({ label, current, previous, unit = '' }) => {
  const change = ((current.value - previous.value) / previous.value) * 100
  const isPositive = change > 0

  return (
    <div className="card-premium p-6">
      <h3 className="stat-label mb-4">{label}</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Current */}
        <div>
          <p className="text-xs text-text-tertiary mb-2">{current.label}</p>
          <p className="text-2xl font-bold font-mono text-text-primary tabular-nums">
            {current.value.toLocaleString()}{unit}
          </p>
        </div>

        {/* Previous */}
        <div>
          <p className="text-xs text-text-tertiary mb-2">{previous.label}</p>
          <p className="text-2xl font-bold font-mono text-text-secondary tabular-nums">
            {previous.value.toLocaleString()}{unit}
          </p>
        </div>
      </div>

      {/* Change */}
      <div className={`p-3 rounded-lg ${isPositive ? 'bg-status-success/5' : 'bg-status-danger/5'}`}>
        <div className="flex items-center gap-2">
          {isPositive ? (
            <ArrowTrendingUpIcon className="h-4 w-4 text-status-success" />
          ) : (
            <ArrowTrendingDownIcon className="h-4 w-4 text-status-danger" />
          )}
          <span className={`text-sm font-semibold ${isPositive ? 'text-status-success' : 'text-status-danger'}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="text-xs text-text-tertiary ml-auto">
            vs {previous.label}
          </span>
        </div>
      </div>
    </div>
  )
}
