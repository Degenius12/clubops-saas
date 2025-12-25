import React from 'react'
import {
  UserPlusIcon,
  BuildingStorefrontIcon,
  MusicalNoteIcon,
  FolderIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

/**
 * Empty State Component - Notion/Vercel inspired
 * Beautiful, actionable states for empty views
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderIcon,
  title,
  description,
  action,
  secondaryAction
}) => {
  return (
    <div className="empty-state">
      {/* Icon */}
      <div className="empty-state-icon">
        <Icon className="h-8 w-8 text-text-muted" />
      </div>

      {/* Content */}
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="btn-ghost text-sm"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Pre-built Empty State variants for common scenarios
 */

export const EmptyDancerList: React.FC<{ onAddDancer: () => void }> = ({ onAddDancer }) => (
  <EmptyState
    icon={UserPlusIcon}
    title="No dancers yet"
    description="Get started by adding your first dancer to the roster. You can manage their schedules, compliance, and performance all in one place."
    action={{
      label: 'Add First Dancer',
      onClick: onAddDancer
    }}
  />
)

export const EmptyVIPBookings: React.FC<{ onCreateBooking: () => void }> = ({ onCreateBooking }) => (
  <EmptyState
    icon={BuildingStorefrontIcon}
    title="No VIP bookings"
    description="Create your first VIP booth reservation. Track spending, set minimums, and manage guest experiences."
    action={{
      label: 'Create Booking',
      onClick: onCreateBooking
    }}
  />
)

export const EmptyDJQueue: React.FC<{ onAddToDJ: () => void }> = ({ onAddToDJ }) => (
  <EmptyState
    icon={MusicalNoteIcon}
    title="Queue is empty"
    description="Add dancers to the rotation to start the show. Manage the stage lineup and keep the energy flowing."
    action={{
      label: 'Add to Queue',
      onClick: onAddToDJ
    }}
  />
)

export const EmptySearchResults: React.FC = () => (
  <EmptyState
    icon={MagnifyingGlassIcon}
    title="No results found"
    description="Try adjusting your search terms or filters to find what you're looking for."
  />
)

export const EmptyDocuments: React.FC<{ onUpload: () => void }> = ({ onUpload }) => (
  <EmptyState
    icon={DocumentTextIcon}
    title="No documents uploaded"
    description="Upload licenses, certifications, and compliance documents to keep everything organized and accessible."
    action={{
      label: 'Upload Documents',
      onClick: onUpload,
      variant: 'secondary'
    }}
  />
)

/**
 * Minimal Empty State - For compact spaces
 */
export const EmptyStateMinimal: React.FC<{
  message: string
  action?: { label: string; onClick: () => void }
}> = ({ message, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <p className="text-sm text-text-tertiary text-center mb-4">{message}</p>
    {action && (
      <button onClick={action.onClick} className="btn-ghost text-sm">
        {action.label}
      </button>
    )}
  </div>
)

/**
 * Empty State with Illustration - For major pages
 */
export const EmptyStateIllustrated: React.FC<{
  illustration: React.ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}> = ({ illustration, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 max-w-md mx-auto">
    {/* Custom Illustration */}
    <div className="mb-6">
      {illustration}
    </div>

    {/* Content */}
    <h3 className="text-xl font-semibold text-text-primary mb-2 text-center">
      {title}
    </h3>
    <p className="text-sm text-text-tertiary text-center mb-6">
      {description}
    </p>

    {/* Action */}
    {action && (
      <button onClick={action.onClick} className="btn-primary">
        {action.label}
      </button>
    )}
  </div>
)
