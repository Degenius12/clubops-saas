import React, { useState, useRef, useEffect } from 'react'
import { CheckIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline'

interface InlineEditProps {
  value: string
  onSave: (value: string) => Promise<void> | void
  placeholder?: string
  type?: 'text' | 'number' | 'email'
  className?: string
  editClassName?: string
  displayClassName?: string
  multiline?: boolean
  rows?: number
}

/**
 * Inline Edit - Notion/Linear inspired
 * Click to edit, instant save
 */
export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  placeholder = 'Click to edit...',
  type = 'text',
  className = '',
  editClassName = '',
  displayClassName = '',
  multiline = false,
  rows = 3
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
      // Revert on error
      setEditValue(value)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`
          group relative cursor-text rounded-lg px-2 py-1.5 -mx-2 -my-1.5
          hover:bg-white/[0.03] transition-colors
          ${displayClassName}
          ${className}
        `}
      >
        <span className={value ? 'text-text-primary' : 'text-text-tertiary'}>
          {value || placeholder}
        </span>
        <PencilIcon className="h-3.5 w-3.5 text-text-muted absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          rows={rows}
          disabled={isSaving}
          className={`
            w-full px-3 py-2 rounded-lg
            bg-midnight-700 border border-gold-500/50
            text-text-primary placeholder-text-tertiary
            outline-none resize-none
            focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${editClassName}
          `}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          className={`
            w-full px-3 py-2 rounded-lg
            bg-midnight-700 border border-gold-500/50
            text-text-primary placeholder-text-tertiary
            outline-none
            focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${editClassName}
          `}
        />
      )}

      {/* Save/Cancel buttons (optional - blur auto-saves) */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isSaving ? (
          <div className="w-4 h-4 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
        ) : (
          <>
            <button
              onClick={handleSave}
              className="p-1 rounded hover:bg-status-success/10 text-status-success transition-colors"
            >
              <CheckIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 rounded hover:bg-status-danger/10 text-status-danger transition-colors"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Inline Select - Dropdown variant
 */
export const InlineSelect: React.FC<{
  value: string
  options: { label: string; value: string }[]
  onSave: (value: string) => Promise<void> | void
  className?: string
}> = ({ value, options, onSave, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const currentOption = options.find(opt => opt.value === value)

  const handleChange = async (newValue: string) => {
    if (newValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(newValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`
          group relative cursor-pointer rounded-lg px-2 py-1.5 -mx-2 -my-1.5
          hover:bg-white/[0.03] transition-colors inline-flex items-center gap-2
          ${className}
        `}
      >
        <span className="text-text-primary">{currentOption?.label || value}</span>
        <PencilIcon className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        disabled={isSaving}
        autoFocus
        className="
          px-3 py-2 rounded-lg
          bg-midnight-700 border border-gold-500/50
          text-text-primary
          outline-none
          focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * Inline Number - For currency/numeric values
 */
export const InlineNumber: React.FC<{
  value: number
  onSave: (value: number) => Promise<void> | void
  prefix?: string
  suffix?: string
  className?: string
}> = ({ value, onSave, prefix = '', suffix = '', className = '' }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value))
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    const numValue = parseFloat(editValue)
    if (isNaN(numValue) || numValue === value) {
      setIsEditing(false)
      setEditValue(String(value))
      return
    }

    setIsSaving(true)
    try {
      await onSave(numValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
      setEditValue(String(value))
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditValue(String(value))
      setIsEditing(false)
    }
  }

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`
          group relative cursor-text rounded-lg px-2 py-1.5 -mx-2 -my-1.5
          hover:bg-white/[0.03] transition-colors font-mono tabular-nums
          ${className}
        `}
      >
        <span className="text-text-primary">
          {prefix}{value.toLocaleString()}{suffix}
        </span>
        <PencilIcon className="h-3.5 w-3.5 text-text-muted absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="number"
        step="any"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        disabled={isSaving}
        className="
          w-32 px-3 py-2 rounded-lg font-mono
          bg-midnight-700 border border-gold-500/50
          text-text-primary
          outline-none
          focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      />
    </div>
  )
}
