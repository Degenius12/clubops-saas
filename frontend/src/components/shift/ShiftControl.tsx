import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import apiClient from '../../config/api'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import EOSReport from './EOSReport'

interface ShiftStatus {
  hasActiveShift: boolean
  activeShiftLevel: number | null
  activeShiftName: string | null
  shiftOpenedAt: string | null
  activeShift: any
}

const ShiftControl: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showEOSReport, setShowEOSReport] = useState(false)
  const [selectedShiftLevel, setSelectedShiftLevel] = useState(1)
  const [selectedShiftName, setSelectedShiftName] = useState('Shift Level 1')
  const [closeNotes, setCloseNotes] = useState('')
  const [error, setError] = useState('')
  const [closedShiftData, setClosedShiftData] = useState<any>(null)
  const [closedShiftSummary, setClosedShiftSummary] = useState<any>(null)

  // Check if user can manage shifts
  const canManageShifts = ['MANAGER', 'SUPER_MANAGER', 'OWNER'].includes(user?.role?.toUpperCase() || '')

  useEffect(() => {
    if (canManageShifts) {
      fetchShiftStatus()
    }
  }, [canManageShifts])

  const fetchShiftStatus = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/shift-management/status')
      setShiftStatus(response.data)
      setError('')
    } catch (error: any) {
      console.error('Failed to fetch shift status:', error)
      setError('Failed to load shift status')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenShift = async () => {
    try {
      setActionLoading(true)
      setError('')
      const response = await apiClient.post('/api/shift-management/open', {
        shiftLevel: selectedShiftLevel,
        shiftName: selectedShiftName
      })

      // Success - refresh status and close modal
      await fetchShiftStatus()
      setShowOpenModal(false)
    } catch (error: any) {
      console.error('Failed to open shift:', error)
      setError(error.response?.data?.error || 'Failed to open shift')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCloseShift = async () => {
    try {
      setActionLoading(true)
      setError('')
      const response = await apiClient.post('/api/shift-management/close', {
        notes: closeNotes
      })

      // Store closed shift data and summary for EOS report
      setClosedShiftData(response.data.shift)
      setClosedShiftSummary(response.data.summary)

      // Success - refresh status, close modal, and show EOS report
      await fetchShiftStatus()
      setShowCloseModal(false)
      setCloseNotes('')
      setShowEOSReport(true)
    } catch (error: any) {
      console.error('Failed to close shift:', error)
      setError(error.response?.data?.error || 'Failed to close shift')
    } finally {
      setActionLoading(false)
    }
  }

  if (!canManageShifts) {
    return null
  }

  if (loading) {
    return (
      <div className="card-premium p-6 animate-pulse">
        <div className="h-4 bg-midnight-700 rounded w-1/3 mb-4" />
        <div className="h-10 bg-midnight-700 rounded" />
      </div>
    )
  }

  const shiftDuration = shiftStatus?.shiftOpenedAt
    ? Math.floor((new Date().getTime() - new Date(shiftStatus.shiftOpenedAt).getTime()) / (1000 * 60))
    : 0

  return (
    <>
      <div className="card-premium p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Shift Control</h3>
          {shiftStatus?.hasActiveShift && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-success/10 border border-status-success/20">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span className="text-xs font-medium text-status-success">Active</span>
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-status-danger/[0.06] border border-status-danger/15">
            <p className="text-sm text-status-danger">{error}</p>
          </div>
        )}

        {shiftStatus?.hasActiveShift ? (
          <div className="space-y-4">
            {/* Active Shift Info */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-status-success/[0.08] to-status-success/[0.04] border border-status-success/20 animate-fade-in relative overflow-hidden">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-status-success/5 via-transparent to-status-success/5 animate-shimmer" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-text-tertiary flex items-center gap-2">
                      Currently Open
                      <span className="inline-flex h-2 w-2 rounded-full bg-status-success animate-pulse" />
                    </p>
                    <p className="text-lg font-semibold text-text-primary mt-0.5">
                      Shift Level {shiftStatus.activeShiftLevel}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {shiftStatus.activeShiftName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-tertiary">Duration</p>
                    <p className="text-lg font-mono font-semibold text-gold-500 mt-0.5 transition-all duration-300">
                      {Math.floor(shiftDuration / 60)}h {shiftDuration % 60}m
                    </p>
                  </div>
                </div>

                {shiftStatus.shiftOpenedAt && (
                  <p className="text-xs text-text-muted">
                    Opened at {new Date(shiftStatus.shiftOpenedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Close Shift Button */}
            <button
              onClick={() => setShowCloseModal(true)}
              className="w-full btn-danger flex items-center justify-center gap-2"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Close Shift
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-midnight-800/50 border border-white/[0.06] text-center">
              <ClockIcon className="h-12 w-12 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No active shift</p>
            </div>

            <button
              onClick={() => setShowOpenModal(true)}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Open Shift
            </button>
          </div>
        )}
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-premium p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Open New Shift</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Shift Level
                </label>
                <select
                  value={selectedShiftLevel}
                  onChange={(e) => {
                    const level = parseInt(e.target.value)
                    setSelectedShiftLevel(level)
                    setSelectedShiftName(`Shift Level ${level}`)
                  }}
                  className="input-field w-full"
                >
                  <option value={1}>Shift Level 1</option>
                  <option value={2}>Shift Level 2</option>
                  <option value={3}>Shift Level 3</option>
                  <option value={4}>Shift Level 4</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Shift Name (Optional)
                </label>
                <input
                  type="text"
                  value={selectedShiftName}
                  onChange={(e) => setSelectedShiftName(e.target.value)}
                  placeholder="e.g., Day Shift, Night Shift"
                  className="input-field w-full"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-status-danger/[0.06] border border-status-danger/15">
                <p className="text-sm text-status-danger">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOpenModal(false)
                  setError('')
                }}
                className="btn-secondary flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleOpenShift}
                className="btn-primary flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? 'Opening...' : 'Open Shift'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-premium p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Close Shift</h3>

            <div className="mb-4 p-4 rounded-xl bg-status-warning/[0.06] border border-status-warning/15">
              <p className="text-sm text-text-secondary">
                You are about to close <strong className="text-text-primary">Shift Level {shiftStatus?.activeShiftLevel}</strong>.
                This will generate an End of Shift (EOS) report.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Manager Notes (Optional)
              </label>
              <textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Add any notes about this shift..."
                rows={4}
                className="input-field w-full resize-none"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-status-danger/[0.06] border border-status-danger/15">
                <p className="text-sm text-status-danger">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCloseModal(false)
                  setError('')
                  setCloseNotes('')
                }}
                className="btn-secondary flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCloseShift}
                className="btn-danger flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? 'Closing...' : 'Close Shift'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EOS Report Modal */}
      {showEOSReport && closedShiftData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
          <EOSReport
            shift={closedShiftData}
            summary={closedShiftSummary}
            onClose={() => setShowEOSReport(false)}
            showCloseButton={true}
          />
        </div>
      )}
    </>
  )
}

export default ShiftControl
