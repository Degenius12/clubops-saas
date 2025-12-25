import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

/**
 * Toast Provider - Linear-inspired notification system
 * Bottom-right positioning, auto-dismiss, smooth animations
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    }

    setToasts(prev => [...prev, newToast])

    // Auto-dismiss
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Shorthand methods
  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message })
  }, [addToast])

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message })
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * Hook to use Toast notifications
 */
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

/**
 * Toast Container - Renders all toasts
 */
const ToastContainer: React.FC<{
  toasts: Toast[]
  onRemove: (id: string) => void
}> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-3 max-w-md pointer-events-none">
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
          index={index}
        />
      ))}
    </div>
  )
}

/**
 * Individual Toast Item
 */
const ToastItem: React.FC<{
  toast: Toast
  onRemove: (id: string) => void
  index: number
}> = ({ toast, onRemove, index }) => {
  const [isExiting, setIsExiting] = useState(false)

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 200)
  }

  const { icon: Icon, iconColor, bgColor, borderColor } = getToastStyles(toast.type)

  return (
    <div
      className={`
        pointer-events-auto
        bg-midnight-800 rounded-xl border shadow-lg
        p-4 flex items-start gap-3
        transition-all duration-200
        ${isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
        ${bgColor} ${borderColor}
      `}
      style={{
        animationDelay: `${index * 50}ms`
      }}
    >
      {/* Icon */}
      <div className={`p-1.5 rounded-lg ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-text-tertiary mt-1">
            {toast.message}
          </p>
        )}

        {/* Action Button */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick()
              handleRemove()
            }}
            className="mt-2 text-xs font-medium text-gold-500 hover:text-gold-400 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={handleRemove}
        className="p-1 rounded-lg hover:bg-white/[0.05] transition-colors flex-shrink-0"
      >
        <XMarkIcon className="h-4 w-4 text-text-tertiary" />
      </button>
    </div>
  )
}

/**
 * Get styles based on toast type
 */
const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircleIcon,
        iconColor: 'text-status-success bg-status-success/10',
        bgColor: 'bg-midnight-800',
        borderColor: 'border-status-success/20'
      }
    case 'error':
      return {
        icon: XCircleIcon,
        iconColor: 'text-status-danger bg-status-danger/10',
        bgColor: 'bg-midnight-800',
        borderColor: 'border-status-danger/20'
      }
    case 'warning':
      return {
        icon: ExclamationTriangleIcon,
        iconColor: 'text-status-warning bg-status-warning/10',
        bgColor: 'bg-midnight-800',
        borderColor: 'border-status-warning/20'
      }
    case 'info':
      return {
        icon: InformationCircleIcon,
        iconColor: 'text-status-info bg-status-info/10',
        bgColor: 'bg-midnight-800',
        borderColor: 'border-status-info/20'
      }
  }
}

/**
 * Example Usage:
 *
 * import { useToast } from './Toast'
 *
 * function MyComponent() {
 *   const toast = useToast()
 *
 *   const handleSave = () => {
 *     toast.success('Saved successfully', 'Your changes have been saved.')
 *   }
 *
 *   const handleError = () => {
 *     toast.error('Failed to save', 'Please try again later.')
 *   }
 *
 *   const handleWithAction = () => {
 *     toast.info('Update available', 'A new version is ready to install.', {
 *       action: {
 *         label: 'Update Now',
 *         onClick: () => console.log('Updating...')
 *       }
 *     })
 *   }
 * }
 */
