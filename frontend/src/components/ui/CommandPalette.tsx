import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  MusicalNoteIcon,
  CurrencyDollarIcon,
  CogIcon,
  XMarkIcon,
  ArrowRightIcon,
  ClockIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline'

interface Command {
  id: string
  title: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  category: 'navigation' | 'action' | 'recent'
  keywords: string[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Command Palette - Linear/Slack inspired
 * Keyboard-first navigation (Cmd+K / Ctrl+K)
 * Fast, minimal, powerful
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Commands registry
  const commands: Command[] = [
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'Overview and analytics',
      icon: ClockIcon,
      action: () => navigate('/dashboard'),
      category: 'navigation',
      keywords: ['dashboard', 'home', 'overview']
    },
    {
      id: 'nav-dancers',
      title: 'Dancers',
      subtitle: 'Manage dancer roster',
      icon: UsersIcon,
      action: () => navigate('/dancers'),
      category: 'navigation',
      keywords: ['dancers', 'performers', 'roster']
    },
    {
      id: 'nav-vip',
      title: 'VIP Booths',
      subtitle: 'Booth reservations',
      icon: BuildingStorefrontIcon,
      action: () => navigate('/vip'),
      category: 'navigation',
      keywords: ['vip', 'booths', 'reservations']
    },
    {
      id: 'nav-queue',
      title: 'DJ Queue',
      subtitle: 'Stage rotation',
      icon: MusicalNoteIcon,
      action: () => navigate('/queue'),
      category: 'navigation',
      keywords: ['dj', 'queue', 'stage', 'rotation']
    },
    {
      id: 'nav-revenue',
      title: 'Revenue',
      subtitle: 'Financial reports',
      icon: CurrencyDollarIcon,
      action: () => navigate('/revenue'),
      category: 'navigation',
      keywords: ['revenue', 'money', 'finance', 'reports']
    },
    {
      id: 'nav-settings',
      title: 'Settings',
      subtitle: 'App configuration',
      icon: CogIcon,
      action: () => navigate('/settings'),
      category: 'navigation',
      keywords: ['settings', 'config', 'preferences']
    }
  ]

  // Filter commands based on query
  const filteredCommands = commands.filter(cmd => {
    const searchTerm = query.toLowerCase()
    return (
      cmd.title.toLowerCase().includes(searchTerm) ||
      cmd.subtitle?.toLowerCase().includes(searchTerm) ||
      cmd.keywords.some(k => k.includes(searchTerm))
    )
  })

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  // Execute command
  const executeCommand = (cmd: Command) => {
    cmd.action()
    onClose()
    setQuery('')
    setSelectedIndex(0)
  }

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Add keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl mx-4 animate-scale-in">
        <div className="bg-midnight-800 rounded-2xl border border-white/[0.12] shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]">
            <MagnifyingGlassIcon className="h-5 w-5 text-text-tertiary flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands..."
              className="flex-1 bg-transparent text-text-primary placeholder-text-tertiary outline-none text-base"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-text-tertiary" />
            </button>
          </div>

          {/* Commands List */}
          <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <CommandLineIcon className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <p className="text-sm text-text-tertiary">No commands found</p>
              </div>
            ) : (
              <div className="py-2">
                {filteredCommands.map((cmd, index) => {
                  const Icon = cmd.icon
                  const isSelected = index === selectedIndex

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3
                        transition-all duration-150
                        ${isSelected
                          ? 'bg-gold-500/[0.08] border-l-2 border-gold-500'
                          : 'hover:bg-white/[0.03]'
                        }
                      `}
                    >
                      <div className={`
                        p-2 rounded-lg
                        ${isSelected
                          ? 'bg-gold-500/15 border border-gold-500/20'
                          : 'bg-white/[0.03] border border-white/[0.06]'
                        }
                      `}>
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-gold-500' : 'text-text-secondary'}`} />
                      </div>

                      <div className="flex-1 text-left">
                        <p className={`text-sm font-medium ${isSelected ? 'text-gold-500' : 'text-text-primary'}`}>
                          {cmd.title}
                        </p>
                        {cmd.subtitle && (
                          <p className="text-xs text-text-tertiary mt-0.5">
                            {cmd.subtitle}
                          </p>
                        )}
                      </div>

                      {isSelected && (
                        <ArrowRightIcon className="h-4 w-4 text-gold-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-midnight-900/50 border-t border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] font-mono text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] font-mono text-[10px]">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] font-mono text-[10px]">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] font-mono text-[10px]">esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to use Command Palette
 * Handles Cmd+K / Ctrl+K global shortcut
 */
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  }
}
