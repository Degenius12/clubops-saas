import React from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  RocketLaunchIcon,
  BoltIcon
} from '@heroicons/react/24/outline'

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'pending' | 'active' | 'inactive'
type BadgeSize = 'sm' | 'md' | 'lg'

interface StatusBadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  size?: BadgeSize
  icon?: React.ComponentType<{ className?: string }>
  dot?: boolean
  pulse?: boolean
  count?: number
  className?: string
}

/**
 * Status Badge - GitHub/Vercel inspired
 * Clean status indicators with solid colors
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  children,
  size = 'md',
  icon: CustomIcon,
  dot = false,
  pulse = false,
  count,
  className = ''
}) => {
  const styles = getBadgeStyles(variant)
  const Icon = CustomIcon || styles.defaultIcon

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  }

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        border transition-colors duration-200
        ${sizeClasses[size]}
        ${styles.className}
        ${className}
      `}
    >
      {/* Dot indicator */}
      {dot && (
        <span className="relative flex">
          <span
            className={`
              ${dotSizes[size]} rounded-full
              ${styles.dotColor}
              ${pulse ? 'animate-pulse' : ''}
            `}
          />
          {pulse && (
            <span
              className={`
                absolute inline-flex h-full w-full rounded-full
                ${styles.dotColor} opacity-75 animate-ping
              `}
            />
          )}
        </span>
      )}

      {/* Icon */}
      {Icon && !dot && (
        <Icon className={iconSizes[size]} />
      )}

      {/* Label */}
      <span>{children}</span>

      {/* Count */}
      {count !== undefined && (
        <span
          className={`
            ${size === 'sm' ? 'text-[10px] px-1' : 'text-xs px-1.5'}
            py-0.5 rounded-full
            ${styles.countBg} ${styles.countText}
            font-semibold tabular-nums
          `}
        >
          {count}
        </span>
      )}
    </span>
  )
}

/**
 * Deployment Status - Vercel inspired
 */
export const DeploymentBadge: React.FC<{
  status: 'building' | 'ready' | 'error' | 'canceled' | 'queued'
  size?: BadgeSize
}> = ({ status, size = 'md' }) => {
  const configs = {
    building: {
      variant: 'info' as BadgeVariant,
      label: 'Building',
      icon: ArrowPathIcon,
      pulse: true
    },
    ready: {
      variant: 'success' as BadgeVariant,
      label: 'Ready',
      icon: CheckCircleIcon,
      pulse: false
    },
    error: {
      variant: 'error' as BadgeVariant,
      label: 'Error',
      icon: XCircleIcon,
      pulse: false
    },
    canceled: {
      variant: 'neutral' as BadgeVariant,
      label: 'Canceled',
      icon: PauseIcon,
      pulse: false
    },
    queued: {
      variant: 'pending' as BadgeVariant,
      label: 'Queued',
      icon: ClockIcon,
      pulse: false
    }
  }

  const config = configs[status]

  return (
    <StatusBadge
      variant={config.variant}
      size={size}
      icon={config.icon}
      pulse={config.pulse}
    >
      {config.label}
    </StatusBadge>
  )
}

/**
 * PR/Issue Status - GitHub inspired
 */
export const PullRequestBadge: React.FC<{
  status: 'open' | 'merged' | 'closed' | 'draft'
  size?: BadgeSize
}> = ({ status, size = 'md' }) => {
  const configs = {
    open: {
      variant: 'success' as BadgeVariant,
      label: 'Open',
      dot: true,
      pulse: true
    },
    merged: {
      variant: 'info' as BadgeVariant,
      label: 'Merged',
      icon: CheckCircleIcon,
      pulse: false
    },
    closed: {
      variant: 'error' as BadgeVariant,
      label: 'Closed',
      icon: XCircleIcon,
      pulse: false
    },
    draft: {
      variant: 'neutral' as BadgeVariant,
      label: 'Draft',
      dot: true,
      pulse: false
    }
  }

  const config = configs[status]

  return (
    <StatusBadge
      variant={config.variant}
      size={size}
      icon={config.icon}
      dot={config.dot}
      pulse={config.pulse}
    >
      {config.label}
    </StatusBadge>
  )
}

/**
 * Dancer Status - ClubFlow specific
 */
export const DancerStatusBadge: React.FC<{
  status: 'on-floor' | 'on-stage' | 'vip' | 'break' | 'checked-out'
  size?: BadgeSize
}> = ({ status, size = 'md' }) => {
  const configs = {
    'on-floor': {
      variant: 'success' as BadgeVariant,
      label: 'On Floor',
      dot: true,
      pulse: true
    },
    'on-stage': {
      variant: 'active' as BadgeVariant,
      label: 'On Stage',
      icon: RocketLaunchIcon,
      pulse: true
    },
    'vip': {
      variant: 'info' as BadgeVariant,
      label: 'VIP',
      icon: BoltIcon,
      pulse: false
    },
    'break': {
      variant: 'warning' as BadgeVariant,
      label: 'Break',
      icon: PauseIcon,
      pulse: false
    },
    'checked-out': {
      variant: 'neutral' as BadgeVariant,
      label: 'Checked Out',
      dot: false,
      pulse: false
    }
  }

  const config = configs[status]

  return (
    <StatusBadge
      variant={config.variant}
      size={size}
      icon={config.icon}
      dot={config.dot}
      pulse={config.pulse}
    >
      {config.label}
    </StatusBadge>
  )
}

/**
 * Booth Status - VIP tracking
 */
export const BoothStatusBadge: React.FC<{
  status: 'available' | 'reserved' | 'occupied' | 'closing-soon'
  size?: BadgeSize
}> = ({ status, size = 'md' }) => {
  const configs = {
    available: {
      variant: 'success' as BadgeVariant,
      label: 'Available',
      dot: true,
      pulse: false
    },
    reserved: {
      variant: 'warning' as BadgeVariant,
      label: 'Reserved',
      icon: ClockIcon,
      pulse: false
    },
    occupied: {
      variant: 'active' as BadgeVariant,
      label: 'Occupied',
      dot: true,
      pulse: true
    },
    'closing-soon': {
      variant: 'error' as BadgeVariant,
      label: 'Closing Soon',
      icon: ExclamationTriangleIcon,
      pulse: true
    }
  }

  const config = configs[status]

  return (
    <StatusBadge
      variant={config.variant}
      size={size}
      icon={config.icon}
      dot={config.dot}
      pulse={config.pulse}
    >
      {config.label}
    </StatusBadge>
  )
}

/**
 * Payment Status
 */
export const PaymentStatusBadge: React.FC<{
  status: 'paid' | 'pending' | 'overdue' | 'partial'
  amount?: number
  size?: BadgeSize
}> = ({ status, amount, size = 'md' }) => {
  const configs = {
    paid: {
      variant: 'success' as BadgeVariant,
      label: 'Paid',
      icon: CheckCircleIcon
    },
    pending: {
      variant: 'pending' as BadgeVariant,
      label: 'Pending',
      icon: ClockIcon
    },
    overdue: {
      variant: 'error' as BadgeVariant,
      label: 'Overdue',
      icon: ExclamationTriangleIcon
    },
    partial: {
      variant: 'warning' as BadgeVariant,
      label: 'Partial',
      icon: ExclamationTriangleIcon
    }
  }

  const config = configs[status]
  const label = amount !== undefined
    ? `${config.label} $${amount.toLocaleString()}`
    : config.label

  return (
    <StatusBadge
      variant={config.variant}
      size={size}
      icon={config.icon}
    >
      {label}
    </StatusBadge>
  )
}

/**
 * Badge with count - For notifications, alerts, etc.
 */
export const CountBadge: React.FC<{
  count: number
  variant?: BadgeVariant
  label?: string
  size?: BadgeSize
  max?: number
}> = ({ count, variant = 'neutral', label, size = 'md', max = 99 }) => {
  const displayCount = count > max ? `${max}+` : count

  return (
    <StatusBadge
      variant={variant}
      size={size}
      count={displayCount}
    >
      {label || 'Items'}
    </StatusBadge>
  )
}

/**
 * Get badge styles based on variant
 */
const getBadgeStyles = (variant: BadgeVariant) => {
  switch (variant) {
    case 'success':
      return {
        className: 'bg-status-success/10 text-status-success border-status-success/20',
        dotColor: 'bg-status-success',
        countBg: 'bg-status-success/20',
        countText: 'text-status-success',
        defaultIcon: CheckCircleIcon
      }
    case 'error':
      return {
        className: 'bg-status-danger/10 text-status-danger border-status-danger/20',
        dotColor: 'bg-status-danger',
        countBg: 'bg-status-danger/20',
        countText: 'text-status-danger',
        defaultIcon: XCircleIcon
      }
    case 'warning':
      return {
        className: 'bg-status-warning/10 text-status-warning border-status-warning/20',
        dotColor: 'bg-status-warning',
        countBg: 'bg-status-warning/20',
        countText: 'text-status-warning',
        defaultIcon: ExclamationTriangleIcon
      }
    case 'info':
      return {
        className: 'bg-status-info/10 text-status-info border-status-info/20',
        dotColor: 'bg-status-info',
        countBg: 'bg-status-info/20',
        countText: 'text-status-info',
        defaultIcon: CheckCircleIcon
      }
    case 'pending':
      return {
        className: 'bg-text-muted/10 text-text-secondary border-text-muted/20',
        dotColor: 'bg-text-muted',
        countBg: 'bg-text-muted/20',
        countText: 'text-text-secondary',
        defaultIcon: ClockIcon
      }
    case 'active':
      return {
        className: 'bg-gold-500/10 text-gold-500 border-gold-500/20',
        dotColor: 'bg-gold-500',
        countBg: 'bg-gold-500/20',
        countText: 'text-gold-500',
        defaultIcon: BoltIcon
      }
    case 'inactive':
      return {
        className: 'bg-midnight-700 text-text-tertiary border-white/[0.06]',
        dotColor: 'bg-text-muted',
        countBg: 'bg-midnight-600',
        countText: 'text-text-tertiary',
        defaultIcon: PauseIcon
      }
    case 'neutral':
    default:
      return {
        className: 'bg-midnight-700 text-text-secondary border-white/[0.06]',
        dotColor: 'bg-text-muted',
        countBg: 'bg-midnight-600',
        countText: 'text-text-secondary',
        defaultIcon: undefined
      }
  }
}

/**
 * Example Usage:
 *
 * // Basic status badge
 * <StatusBadge variant="success">Active</StatusBadge>
 * <StatusBadge variant="error" icon={XCircleIcon}>Failed</StatusBadge>
 *
 * // With dot indicator
 * <StatusBadge variant="success" dot pulse>Live</StatusBadge>
 *
 * // With count
 * <StatusBadge variant="warning" count={12}>Alerts</StatusBadge>
 *
 * // Deployment status (Vercel-style)
 * <DeploymentBadge status="building" />
 * <DeploymentBadge status="ready" />
 *
 * // PR status (GitHub-style)
 * <PullRequestBadge status="open" />
 * <PullRequestBadge status="merged" />
 *
 * // ClubFlow specific
 * <DancerStatusBadge status="on-floor" />
 * <BoothStatusBadge status="occupied" />
 * <PaymentStatusBadge status="overdue" amount={150} />
 *
 * // Count badge
 * <CountBadge count={5} label="New" variant="info" />
 */
