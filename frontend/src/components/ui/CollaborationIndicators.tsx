import React, { useEffect, useState } from 'react'
import { UserCircleIcon, BoltIcon, EyeIcon } from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  avatar?: string
  color?: string
}

interface CollaboratorAvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  isActive?: boolean
}

/**
 * Collaborator Avatar - Figma/Notion inspired
 * Shows who's currently viewing/editing
 */
export const CollaboratorAvatar: React.FC<CollaboratorAvatarProps> = ({
  user,
  size = 'md',
  showTooltip = true,
  isActive = false
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  }

  const color = user.color || '#D4AF37'

  return (
    <div className="relative group">
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center
          font-semibold text-midnight-900
          border-2 border-midnight-900
          transition-all duration-200
          ${isActive ? 'ring-2 ring-offset-2 ring-offset-midnight-900' : ''}
        `}
        style={{
          backgroundColor: color,
          ringColor: isActive ? color : 'transparent'
        }}
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span>{user.name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="tooltip invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap">
          {user.name}
          {isActive && (
            <div className="flex items-center gap-1 mt-1 text-status-success">
              <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
              <span className="text-[10px]">Editing</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Collaborators Stack - Multiple avatars overlapped
 */
export const CollaboratorsStack: React.FC<{
  users: User[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
  onShowAll?: () => void
}> = ({ users, max = 3, size = 'md', onShowAll }) => {
  const visible = users.slice(0, max)
  const remaining = users.length - max

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user) => (
        <CollaboratorAvatar key={user.id} user={user} size={size} />
      ))}

      {remaining > 0 && (
        <button
          onClick={onShowAll}
          className={`
            ${size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'}
            rounded-full flex items-center justify-center
            font-semibold text-text-primary
            bg-midnight-700 border-2 border-midnight-900
            hover:bg-midnight-600 transition-colors
          `}
        >
          +{remaining}
        </button>
      )}
    </div>
  )
}

/**
 * Live Cursor - Show where collaborators are
 */
export const LiveCursor: React.FC<{
  user: User
  x: number
  y: number
}> = ({ user, x, y }) => {
  return (
    <div
      className="fixed pointer-events-none z-100 transition-all duration-100"
      style={{ left: x, top: y }}
    >
      {/* Cursor */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5.65376 12.3673L13.1844 4.8366C13.7743 4.2467 14.7638 4.53073 14.9673 5.31913L18.3094 18.4341C18.5269 19.2735 17.6708 19.9836 16.8917 19.6166L12.5203 17.4315L9.05383 20.8979C8.42177 21.53 7.35913 21.0983 7.35913 20.1951V13.4763"
          fill={user.color || '#D4AF37'}
        />
      </svg>

      {/* Name label */}
      <div
        className="absolute top-6 left-4 px-2 py-1 rounded text-xs font-medium text-midnight-900 whitespace-nowrap"
        style={{ backgroundColor: user.color || '#D4AF37' }}
      >
        {user.name}
      </div>
    </div>
  )
}

/**
 * Typing Indicator - Show when someone is typing
 */
export const TypingIndicator: React.FC<{
  users: User[]
}> = ({ users }) => {
  if (users.length === 0) return null

  const names = users.map(u => u.name).join(', ')
  const verb = users.length === 1 ? 'is' : 'are'

  return (
    <div className="flex items-center gap-2 text-sm text-text-tertiary">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{names} {verb} typing...</span>
    </div>
  )
}

/**
 * Real-time Activity Feed
 */
export const ActivityFeed: React.FC<{
  activities: Array<{
    id: string
    user: User
    action: string
    timestamp: Date
    icon?: React.ComponentType<{ className?: string }>
  }>
}> = ({ activities }) => {
  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = activity.icon || BoltIcon
        const timeAgo = formatTimeAgo(activity.timestamp)

        return (
          <div key={activity.id} className="flex items-start gap-3">
            {/* User Avatar */}
            <CollaboratorAvatar user={activity.user} size="sm" showTooltip={false} />

            {/* Activity */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary">
                <span className="font-medium">{activity.user.name}</span>
                {' '}
                <span className="text-text-secondary">{activity.action}</span>
              </p>
              <p className="text-xs text-text-muted">{timeAgo}</p>
            </div>

            {/* Icon */}
            <Icon className="h-4 w-4 text-text-muted flex-shrink-0" />
          </div>
        )
      })}
    </div>
  )
}

/**
 * Viewing Indicator - Show who's viewing this page
 */
export const ViewingIndicator: React.FC<{
  users: User[]
}> = ({ users }) => {
  if (users.length === 0) return null

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      <EyeIcon className="h-4 w-4 text-text-tertiary" />
      <CollaboratorsStack users={users} max={3} size="sm" />
      <span className="text-xs text-text-tertiary">
        {users.length} viewing
      </span>
    </div>
  )
}

/**
 * Last Edited By
 */
export const LastEditedBy: React.FC<{
  user: User
  timestamp: Date
}> = ({ user, timestamp }) => {
  return (
    <div className="flex items-center gap-2 text-xs text-text-muted">
      <CollaboratorAvatar user={user} size="sm" showTooltip={false} />
      <span>
        Edited by <span className="font-medium text-text-tertiary">{user.name}</span>
        {' '}{formatTimeAgo(timestamp)}
      </span>
    </div>
  )
}

/**
 * Presence Indicator - Show online status
 */
export const PresenceIndicator: React.FC<{
  status: 'online' | 'away' | 'offline'
  size?: 'sm' | 'md' | 'lg'
}> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  }

  const statusColors = {
    online: 'bg-status-success',
    away: 'bg-status-warning',
    offline: 'bg-text-muted'
  }

  return (
    <div className="relative">
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          ${statusColors[status]}
          ${status === 'online' ? 'animate-pulse' : ''}
        `}
      />
      {status === 'online' && (
        <div
          className={`
            absolute inset-0 rounded-full
            ${statusColors[status]}
            animate-ping opacity-75
          `}
        />
      )}
    </div>
  )
}

/**
 * Helper: Format time ago
 */
const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString()
}
