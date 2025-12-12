import React, { useState, useEffect, useCallback } from 'react'
import {
  BuildingStorefrontIcon,
  ClockIcon,
  UserIcon,
  PlayIcon,
  StopIcon,
  PlusIcon,
  MinusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MusicalNoteIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  UserGroupIcon,
  QueueListIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  SparklesIcon,
  WifiIcon,
  SignalSlashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useVipHostData } from '../../hooks'
import { useAppSelector } from '../../hooks'
import toast from 'react-hot-toast'

// Helper function to get clubId
const useClubId = () => {
  const auth = useAppSelector((state) => state.auth)
  return auth?.user?.club_id || 'demo-club-id'
}

const VipHostInterface: React.FC = () => {
  const clubId = useClubId()
  
  // Use the data hook for all API interactions
  const {
    booths,
    activeSessions,
    availableDancers,
    summary,
    selectedSession,
    confirmationData,
    activeShift,
    isConnected,
    isLoading,
    isStartingSession,
    isEndingSession,
    isStartingShift,
    isEndingShift,
    error,
    handleStartSession,
    handleUpdateSongCount,
    handleEndSession,
    handleGetConfirmation,
    handleConfirmSession,
    handleDisputeSession,
    handleSelectSession,
    handleStartShift,
    handleEndShift,
    refreshData,
    clearConfirmation,
  } = useVipHostData(clubId)

  // Local UI State
  const [showStartModal, setShowStartModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showCustomerConfirmation, setShowCustomerConfirmation] = useState(false)
  const [showStartShiftModal, setShowStartShiftModal] = useState(false)
  const [showEndShiftModal, setShowEndShiftModal] = useState(false)
  const [selectedBooth, setSelectedBooth] = useState<any>(null)
  const [localSelectedSession, setLocalSelectedSession] = useState<any>(null)
  const [selectedDancerId, setSelectedDancerId] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [dancerSearch, setDancerSearch] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [closingBalance, setClosingBalance] = useState('')
  const [shiftTimer, setShiftTimer] = useState('0:00:00')
  const [finalSongCount, setFinalSongCount] = useState(0)

  // Club settings (would come from API)
  const clubSettings = {
    songRate: 30,
    avgSongDuration: 210,
  }

  // Calculate shift timer
  useEffect(() => {
    if (!activeShift?.startTime) return
    
    const interval = setInterval(() => {
      const start = new Date(activeShift.startTime).getTime()
      const now = Date.now()
      const diff = Math.floor((now - start) / 1000)
      
      const hours = Math.floor(diff / 3600)
      const minutes = Math.floor((diff % 3600) / 60)
      const seconds = diff % 60
      
      setShiftTimer(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [activeShift?.startTime])

  // Show errors as toasts
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Helper functions
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimeFromString = (isoString: string) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getSessionDuration = (startTime: string) => {
    if (!startTime) return 0
    const start = new Date(startTime).getTime()
    if (isNaN(start)) return 0
    return Math.floor((Date.now() - start) / 1000)
  }

  const calculateSessionTotal = (songCount: number) => {
    return songCount * clubSettings.songRate
  }

  const getBoothStatusStyles = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return {
          bg: 'bg-status-success/10',
          border: 'border-status-success/30',
          text: 'text-status-success',
          glow: 'shadow-glow-success'
        }
      case 'OCCUPIED':
        return {
          bg: 'bg-status-danger/10',
          border: 'border-status-danger/30',
          text: 'text-status-danger',
          glow: 'shadow-glow-danger'
        }
      case 'MAINTENANCE':
        return {
          bg: 'bg-status-warning/10',
          border: 'border-status-warning/30',
          text: 'text-status-warning',
          glow: ''
        }
      case 'CLEANING':
        return {
          bg: 'bg-royal-500/10',
          border: 'border-royal-500/30',
          text: 'text-royal-400',
          glow: ''
        }
      default:
        return {
          bg: 'bg-midnight-800',
          border: 'border-white/10',
          text: 'text-text-tertiary',
          glow: ''
        }
    }
  }

  const getSongCountDiscrepancy = (session: any) => {
    const manual = session.songCountManual || 0
    const byTime = session.songCountByTime || session.runtime ? Math.floor((session.runtime || 0) / clubSettings.avgSongDuration) : 0
    const variance = Math.abs(manual - byTime)
    if (variance > 3) return 'high'
    if (variance > 1) return 'medium'
    return 'ok'
  }

  // Filter available dancers
  const filteredDancers = availableDancers.filter(d =>
    d.stageName?.toLowerCase().includes(dancerSearch.toLowerCase())
  )

  // Computed summary values - ensure all values are proper numbers for .toFixed()
  const shiftSummary = {
    totalSessions: Number(summary?.completedSessionsCount) || 0,
    totalSongsLogged: Number(summary?.totalSongs) || 0,
    totalHouseFees: Number(summary?.totalRevenue) || 0,
    totalRevenue: Number(summary?.totalRevenue) || 0,
    flaggedDiscrepancies: Number(summary?.mismatchCount) || 0,
    openingCashBalance: Number(activeShift?.cashDrawer?.openingBalance) || 0,
    currentCashBalance: (Number(activeShift?.cashDrawer?.openingBalance) || 0) + (Number(summary?.totalRevenue) || 0),
  }

  // Event Handlers
  const handleSelectBoothForStart = (booth: any) => {
    if (booth.status !== 'AVAILABLE') return
    setSelectedBooth(booth)
    setShowStartModal(true)
  }

  const handleStartSessionSubmit = async () => {
    if (!selectedBooth || !selectedDancerId) return

    try {
      await handleStartSession({
        boothId: selectedBooth.id,
        dancerId: selectedDancerId,
        notes: customerName ? `Customer: ${customerName}` : undefined,
      })
      
      toast.success('VIP session started')
      setShowStartModal(false)
      setSelectedBooth(null)
      setSelectedDancerId('')
      setCustomerName('')
      setDancerSearch('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to start session')
    }
  }

  const handleIncrementSongs = async (sessionId: string, currentCount: number) => {
    try {
      await handleUpdateSongCount(sessionId, currentCount + 1)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update count')
    }
  }

  const handleDecrementSongs = async (sessionId: string, currentCount: number) => {
    if (currentCount <= 0) return
    try {
      await handleUpdateSongCount(sessionId, currentCount - 1)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update count')
    }
  }

  const handleInitiateEndSession = (session: any) => {
    setLocalSelectedSession(session)
    setFinalSongCount(session.songCountManual || 0)
    setShowEndModal(true)
  }

  const handleEndSessionConfirm = async () => {
    if (!localSelectedSession) return
    
    try {
      await handleEndSession(localSelectedSession.id, {
        songCountFinal: finalSongCount,
      })
      
      // Get confirmation data for customer display
      await handleGetConfirmation(localSelectedSession.id)
      
      setShowEndModal(false)
      setShowCustomerConfirmation(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to end session')
    }
  }

  const handleCustomerConfirmSubmit = async (confirmed: boolean) => {
    if (!localSelectedSession) return

    try {
      if (confirmed) {
        await handleConfirmSession(localSelectedSession.id, true, 'customer-confirmed')
        toast.success('Session confirmed')
      } else {
        await handleDisputeSession(localSelectedSession.id, 'Customer disputed the count')
        toast.error('Session disputed - flagged for review')
      }
      
      setShowCustomerConfirmation(false)
      setLocalSelectedSession(null)
      clearConfirmation()
    } catch (err: any) {
      toast.error(err.message || 'Failed to process confirmation')
    }
  }

  const handleStartShiftSubmit = async () => {
    try {
      await handleStartShift({
        role: 'VIP_HOST',
        openingCashBalance: openingBalance ? parseFloat(openingBalance) : undefined,
      })
      toast.success('Shift started')
      setShowStartShiftModal(false)
      setOpeningBalance('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to start shift')
    }
  }

  const handleEndShiftSubmit = async () => {
    try {
      await handleEndShift({
        closingCashBalance: closingBalance ? parseFloat(closingBalance) : undefined,
      })
      toast.success('Shift ended')
      setShowEndShiftModal(false)
      setClosingBalance('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to end shift')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-950 via-midnight-900 to-midnight-950 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gold-500/30 blur-lg rounded-full"></div>
            <div className="relative p-3 rounded-xl bg-gold-500/15 border border-gold-500/20">
              <SparklesIcon className="h-6 w-6 text-gold-500" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">VIP Host Station</h1>
            <p className="text-sm text-text-tertiary">Manage booth sessions & collect fees</p>
          </div>
        </div>
        
        {/* Status & Shift Controls */}
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            isConnected 
              ? 'bg-status-success/10 border-status-success/30 text-status-success'
              : 'bg-status-danger/10 border-status-danger/30 text-status-danger'
          }`}>
            {isConnected ? (
              <WifiIcon className="h-4 w-4" />
            ) : (
              <SignalSlashIcon className="h-4 w-4" />
            )}
            <span className="text-xs font-medium">{isConnected ? 'Live' : 'Offline'}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="p-2 rounded-lg bg-midnight-800 border border-white/10 hover:border-electric-500/30 transition-all"
          >
            <ArrowPathIcon className={`h-5 w-5 text-text-tertiary ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Shift Timer / Controls */}
          {activeShift ? (
            <div className="card-premium px-4 py-3 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-electric-400" />
                <span className="text-sm text-text-tertiary">Shift:</span>
                <span className="font-mono font-bold text-electric-400 tabular-nums">{shiftTimer}</span>
              </div>
              <div className="h-6 w-px bg-white/10"></div>
              <button
                onClick={() => setShowEndShiftModal(true)}
                disabled={isEndingShift || activeSessions.length > 0}
                className="flex items-center gap-2 text-status-warning hover:text-status-warning/80 transition-colors disabled:opacity-50"
                title={activeSessions.length > 0 ? 'End all sessions first' : 'End Shift'}
              >
                <StopIcon className="h-5 w-5" />
                <span className="text-sm font-medium">End Shift</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowStartShiftModal(true)}
              disabled={isStartingShift}
              className="btn-primary px-4 py-3 flex items-center gap-2"
            >
              <PlayIcon className="h-5 w-5" />
              <span className="font-medium">{isStartingShift ? 'Starting...' : 'Start Shift'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column - Booths Grid & Active Sessions */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Booths Status Grid */}
          <div className="card-premium p-5 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <BuildingStorefrontIcon className="h-5 w-5 text-gold-500" />
                Booth Status
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-status-success"></span>
                  <span className="text-text-tertiary">Available</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-status-danger"></span>
                  <span className="text-text-tertiary">Occupied</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-status-warning"></span>
                  <span className="text-text-tertiary">Maintenance</span>
                </span>
              </div>
            </div>
            
            {isLoading && booths.length === 0 ? (
              <div className="text-center py-8">
                <ArrowPathIcon className="h-8 w-8 mx-auto text-electric-400 animate-spin mb-2" />
                <p className="text-text-tertiary">Loading booths...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {booths.map((booth, index) => {
                  const styles = getBoothStatusStyles(booth.status)
                  const currentSession = activeSessions.find(s => s.boothId === booth.id)
                  
                  return (
                    <button
                      key={booth.id}
                      onClick={() => handleSelectBoothForStart(booth)}
                      disabled={booth.status !== 'AVAILABLE' || !activeShift}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                        ${styles.bg} ${styles.border} ${styles.glow}
                        ${booth.status === 'AVAILABLE' && activeShift
                          ? 'hover:scale-105 hover:border-gold-500/50 cursor-pointer' 
                          : 'opacity-75 cursor-not-allowed'}
                        animate-fade-in-up
                      `}
                      style={{ animationDelay: `${100 + index * 50}ms` }}
                    >
                      <div className="text-center">
                        <div className={`text-2xl font-bold font-mono ${styles.text}`}>
                          #{booth.boothNumber || booth.name?.split(' ').pop()}
                        </div>
                        <div className="text-xs text-text-tertiary mt-1 capitalize">
                          {booth.status?.toLowerCase()}
                        </div>
                        {currentSession && (
                          <div className="mt-2 text-xs text-text-secondary truncate">
                            {currentSession.dancer?.stageName}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            
            {!activeShift && (
              <p className="text-center text-status-warning text-sm mt-4">
                Start your shift to manage VIP sessions
              </p>
            )}
          </div>

          {/* Active Sessions */}
          <div className="card-premium p-5 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <QueueListIcon className="h-5 w-5 text-electric-400" />
                Active Sessions
                {activeSessions.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-status-danger/20 text-status-danger rounded-full">
                    {activeSessions.length}
                  </span>
                )}
              </h2>
            </div>
            
            {activeSessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex p-4 rounded-full bg-midnight-800 mb-4">
                  <BuildingStorefrontIcon className="h-8 w-8 text-text-tertiary" />
                </div>
                <p className="text-text-tertiary">No active sessions</p>
                <p className="text-xs text-text-tertiary mt-1">Tap an available booth to start a session</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSessions.map((session, index) => {
                  const duration = session.runtime || getSessionDuration(session.startTime)
                  const songsByTime = Math.floor(duration / clubSettings.avgSongDuration)
                  const discrepancy = getSongCountDiscrepancy({ ...session, songCountByTime: songsByTime })
                  const booth = booths.find(b => b.id === session.boothId)
                  
                  return (
                    <div 
                      key={session.id}
                      className="card-premium p-4 border border-status-danger/30 shadow-glow-danger animate-fade-in-up"
                      style={{ animationDelay: `${200 + index * 50}ms` }}
                    >
                      {/* Session Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30 flex items-center justify-center">
                            <span className="text-lg font-bold text-gold-500">
                              #{booth?.boothNumber || session.boothId?.slice(-1)}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary">{session.dancer?.stageName}</div>
                            {session.notes && (
                              <div className="text-xs text-text-tertiary">
                                {session.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Timer Display */}
                        <div className="text-right">
                          <div className="text-2xl font-bold font-mono text-text-primary tabular-nums">
                            {formatTime(duration)}
                          </div>
                          <div className="text-xs text-text-tertiary">Duration</div>
                        </div>
                      </div>
                      
                      {/* Song Counter Section */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {/* Manual Counter */}
                        <div className="p-3 rounded-xl bg-midnight-800/50 border border-white/5">
                          <div className="text-xs text-text-tertiary mb-2 flex items-center gap-1">
                            <MusicalNoteIcon className="h-3.5 w-3.5" />
                            Manual Count
                          </div>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => handleDecrementSongs(session.id, session.songCountManual || 0)}
                              className="w-10 h-10 rounded-lg bg-midnight-700 hover:bg-midnight-600 flex items-center justify-center text-text-primary transition-colors touch-target"
                            >
                              <MinusIcon className="h-5 w-5" />
                            </button>
                            <span className="text-3xl font-bold font-mono text-gold-500 tabular-nums">
                              {session.songCountManual || 0}
                            </span>
                            <button
                              onClick={() => handleIncrementSongs(session.id, session.songCountManual || 0)}
                              className="w-10 h-10 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 flex items-center justify-center text-gold-500 transition-colors touch-target"
                            >
                              <PlusIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        
                        {/* DJ Sync Counter */}
                        <div className="p-3 rounded-xl bg-midnight-800/50 border border-white/5">
                          <div className="text-xs text-text-tertiary mb-2 flex items-center gap-1">
                            <ArrowPathIcon className="h-3.5 w-3.5 animate-spin-slow" />
                            DJ Sync
                          </div>
                          <div className="text-3xl font-bold font-mono text-electric-400 tabular-nums text-center">
                            {session.songCountDjSync || 0}
                          </div>
                          <div className="text-xs text-text-tertiary text-center mt-1">
                            Auto-tracked
                          </div>
                        </div>
                        
                        {/* Time-Based Estimate */}
                        <div className="p-3 rounded-xl bg-midnight-800/50 border border-white/5">
                          <div className="text-xs text-text-tertiary mb-2 flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5" />
                            By Time
                          </div>
                          <div className="text-3xl font-bold font-mono text-text-secondary tabular-nums text-center">
                            {songsByTime}
                          </div>
                          <div className="text-xs text-text-tertiary text-center mt-1">
                            ~3.5 min/song
                          </div>
                        </div>
                      </div>

                      {/* Discrepancy Warning */}
                      {discrepancy !== 'ok' && (
                        <div className={`
                          flex items-center gap-2 p-2 rounded-lg mb-4
                          ${discrepancy === 'high' ? 'bg-status-danger/10 border border-status-danger/30' : 'bg-status-warning/10 border border-status-warning/30'}
                        `}>
                          <ExclamationTriangleIcon className={`h-4 w-4 ${discrepancy === 'high' ? 'text-status-danger' : 'text-status-warning'}`} />
                          <span className={`text-xs ${discrepancy === 'high' ? 'text-status-danger' : 'text-status-warning'}`}>
                            {discrepancy === 'high' 
                              ? 'High variance detected! Manual count differs significantly from time estimate.'
                              : 'Minor variance between manual count and time estimate.'
                            }
                          </span>
                        </div>
                      )}
                      
                      {/* Current Total & Actions */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-text-tertiary">Current Total</div>
                          <div className="text-xl font-bold font-mono text-gold-500 tabular-nums">
                            ${calculateSessionTotal(session.songCountManual || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {session.songCountManual || 0} songs × ${clubSettings.songRate}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleInitiateEndSession(session)}
                          disabled={isEndingSession}
                          className="btn-danger px-6 py-3 flex items-center gap-2 touch-target disabled:opacity-50"
                        >
                          <StopIcon className="h-5 w-5" />
                          End Session
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Shift Summary */}
        <div className="space-y-6">
          {/* Shift Stats */}
          <div className="card-premium p-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
              <BanknotesIcon className="h-5 w-5 text-gold-500" />
              Shift Summary
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/20">
                <div className="text-xs text-text-tertiary mb-1">Total House Fees Collected</div>
                <div className="text-3xl font-bold font-mono text-gold-500 tabular-nums">
                  ${shiftSummary.totalHouseFees.toFixed(2)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-midnight-800/50">
                  <div className="text-xs text-text-tertiary mb-1">Sessions</div>
                  <div className="text-2xl font-bold font-mono text-text-primary tabular-nums">
                    {shiftSummary.totalSessions}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-midnight-800/50">
                  <div className="text-xs text-text-tertiary mb-1">Songs Logged</div>
                  <div className="text-2xl font-bold font-mono text-text-primary tabular-nums">
                    {shiftSummary.totalSongsLogged}
                  </div>
                </div>
              </div>
              
              <div className="p-3 rounded-xl bg-midnight-800/50 flex items-center justify-between">
                <div>
                  <div className="text-xs text-text-tertiary">Cash Drawer</div>
                  <div className="text-lg font-bold font-mono text-status-success tabular-nums">
                    ${shiftSummary.currentCashBalance.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-tertiary">Opening</div>
                  <div className="text-sm font-mono text-text-secondary tabular-nums">
                    ${shiftSummary.openingCashBalance.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {/* Discrepancy Alert */}
              {shiftSummary.flaggedDiscrepancies > 0 && (
                <div className="p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 flex items-center gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-status-danger flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-status-danger">
                      {shiftSummary.flaggedDiscrepancies} Flagged
                    </div>
                    <div className="text-xs text-status-danger/70">
                      Requires manager review
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="card-premium p-5 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <h3 className="text-sm font-medium text-text-tertiary mb-3">Tonight's Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">Total Revenue Generated</span>
                <span className="font-mono font-bold text-gold-500 tabular-nums">
                  ${shiftSummary.totalRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">Avg Songs/Session</span>
                <span className="font-mono font-bold text-text-primary tabular-nums">
                  {shiftSummary.totalSessions > 0 
                    ? (shiftSummary.totalSongsLogged / shiftSummary.totalSessions).toFixed(1)
                    : '0'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">Avg Fee/Session</span>
                <span className="font-mono font-bold text-text-primary tabular-nums">
                  ${shiftSummary.totalSessions > 0 
                    ? (shiftSummary.totalHouseFees / shiftSummary.totalSessions).toFixed(2)
                    : '0.00'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">Active Sessions</span>
                <span className="font-mono font-bold text-status-danger tabular-nums">
                  {activeSessions.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ========== MODALS ========== */}

      {/* Start Session Modal */}
      {showStartModal && selectedBooth && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-premium p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">Start VIP Session</h3>
              <button
                onClick={() => {
                  setShowStartModal(false)
                  setSelectedBooth(null)
                  setSelectedDancerId('')
                  setCustomerName('')
                  setDancerSearch('')
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-text-tertiary" />
              </button>
            </div>
            
            {/* Selected Booth */}
            <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/30 mb-4">
              <div className="text-xs text-text-tertiary">Selected Booth</div>
              <div className="text-lg font-bold text-gold-500">{selectedBooth.name}</div>
            </div>
            
            {/* Dancer Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Select Dancer *
              </label>
              <input
                type="text"
                placeholder="Search available dancers..."
                value={dancerSearch}
                onChange={e => setDancerSearch(e.target.value)}
                className="input-premium w-full mb-2"
              />
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg bg-midnight-800/50 p-2">
                {filteredDancers.length === 0 ? (
                  <div className="text-center py-4 text-text-tertiary text-sm">
                    {availableDancers.length === 0 ? 'No dancers checked in' : 'No dancers found'}
                  </div>
                ) : (
                  filteredDancers.map(dancer => (
                    <button
                      key={dancer.id}
                      onClick={() => {
                        setSelectedDancerId(dancer.id)
                        setDancerSearch(dancer.stageName)
                      }}
                      className={`
                        w-full p-2 rounded-lg text-left flex items-center gap-3 transition-colors
                        ${selectedDancerId === dancer.id 
                          ? 'bg-gold-500/20 border border-gold-500/30' 
                          : 'hover:bg-midnight-700'
                        }
                      `}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500/30 to-gold-600/20 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-gold-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">{dancer.stageName}</div>
                        <div className="text-xs text-text-tertiary">Checked in {new Date(dancer.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      {selectedDancerId === dancer.id && (
                        <CheckCircleIcon className="h-5 w-5 text-gold-500 ml-auto" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
            
            {/* Customer Name (Optional) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter customer name for records..."
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="input-premium w-full"
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStartModal(false)
                  setSelectedBooth(null)
                }}
                className="flex-1 btn-secondary py-3 touch-target"
              >
                Cancel
              </button>
              <button
                onClick={handleStartSessionSubmit}
                disabled={!selectedDancerId || isStartingSession}
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 touch-target disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStartingSession ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5" />
                    Start Session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Confirmation Modal */}
      {showEndModal && localSelectedSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-premium p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">End Session</h3>
              <button
                onClick={() => {
                  setShowEndModal(false)
                  setLocalSelectedSession(null)
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-text-tertiary" />
              </button>
            </div>
            
            {/* Session Summary */}
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-midnight-800/50 border border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-text-tertiary">Booth</div>
                    <div className="text-lg font-semibold text-text-primary">
                      {booths.find(b => b.id === localSelectedSession.boothId)?.name || 'VIP Booth'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary">Dancer</div>
                    <div className="text-lg font-semibold text-text-primary">
                      {localSelectedSession.dancer?.stageName}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-midnight-800/50 border border-white/5">
                <div className="text-xs text-text-tertiary mb-2">Session Duration</div>
                <div className="text-2xl font-bold font-mono text-text-primary tabular-nums">
                  {formatTime(localSelectedSession.runtime || getSessionDuration(localSelectedSession.startTime))}
                </div>
              </div>
              
              {/* Final Song Count Input */}
              <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-text-tertiary">Final Song Count</div>
                  <div className="text-sm text-text-tertiary">
                    (Time est: {Math.floor((localSelectedSession.runtime || getSessionDuration(localSelectedSession.startTime)) / clubSettings.avgSongDuration)})
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setFinalSongCount(Math.max(0, finalSongCount - 1))}
                    className="w-12 h-12 rounded-lg bg-midnight-700 hover:bg-midnight-600 flex items-center justify-center text-text-primary transition-colors"
                  >
                    <MinusIcon className="h-6 w-6" />
                  </button>
                  <span className="text-4xl font-bold font-mono text-gold-500 tabular-nums w-20 text-center">
                    {finalSongCount}
                  </span>
                  <button
                    onClick={() => setFinalSongCount(finalSongCount + 1)}
                    className="w-12 h-12 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 flex items-center justify-center text-gold-500 transition-colors"
                  >
                    <PlusIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-gradient-to-r from-gold-500/20 to-gold-600/10 border border-gold-500/30">
                <div className="text-xs text-text-tertiary mb-1">Total Amount Due</div>
                <div className="text-4xl font-bold font-mono text-gold-500 tabular-nums">
                  ${calculateSessionTotal(finalSongCount).toFixed(2)}
                </div>
                <div className="text-sm text-text-tertiary mt-1">
                  House Fee: ${(calculateSessionTotal(finalSongCount) / 2).toFixed(2)} | 
                  Dancer: ${(calculateSessionTotal(finalSongCount) / 2).toFixed(2)}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEndModal(false)
                  setLocalSelectedSession(null)
                }}
                className="flex-1 btn-secondary py-3 touch-target"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSessionConfirm}
                disabled={isEndingSession}
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 touch-target disabled:opacity-50"
              >
                {isEndingSession ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Get Customer Approval
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Confirmation Screen */}
      {showCustomerConfirmation && localSelectedSession && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl animate-scale-in">
            {/* Premium Header */}
            <div className="text-center mb-8">
              <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30 mb-4">
                <SparklesIcon className="h-12 w-12 text-gold-500" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">Session Complete</h2>
              <p className="text-lg text-text-tertiary">Please confirm your VIP experience</p>
            </div>
            
            {/* Session Details Card */}
            <div className="card-premium p-8 mb-6">
              <div className="text-center mb-8">
                <div className="text-sm text-text-tertiary mb-2">Your Private Session</div>
                <div className="text-2xl font-semibold text-text-primary mb-1">
                  with {localSelectedSession.dancer?.stageName}
                </div>
                <div className="text-sm text-text-tertiary">
                  {booths.find(b => b.id === localSelectedSession.boothId)?.name || 'VIP Booth'}
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="text-5xl font-bold font-mono text-gold-500 tabular-nums">
                    {finalSongCount}
                  </div>
                  <div className="text-sm text-text-tertiary mt-1">Songs</div>
                </div>
                <div className="text-4xl text-text-tertiary">×</div>
                <div className="text-center">
                  <div className="text-5xl font-bold font-mono text-text-primary tabular-nums">
                    ${clubSettings.songRate}
                  </div>
                  <div className="text-sm text-text-tertiary mt-1">Per Song</div>
                </div>
              </div>
              
              <div className="h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent mb-8"></div>
              
              <div className="text-center">
                <div className="text-sm text-text-tertiary mb-2">Total Amount</div>
                <div className="text-6xl font-bold font-mono text-gold-500 tabular-nums mb-2">
                  ${calculateSessionTotal(finalSongCount).toFixed(2)}
                </div>
                <div className="text-sm text-text-tertiary">
                  Please settle with your entertainer
                </div>
              </div>
            </div>
            
            {/* Confirmation Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleCustomerConfirmSubmit(false)}
                className="p-6 rounded-2xl bg-status-danger/10 border-2 border-status-danger/30 hover:bg-status-danger/20 hover:border-status-danger/50 transition-all flex flex-col items-center gap-3 touch-target"
              >
                <XCircleIcon className="h-12 w-12 text-status-danger" />
                <div>
                  <div className="text-xl font-semibold text-status-danger">Dispute</div>
                  <div className="text-sm text-status-danger/70">This doesn't seem right</div>
                </div>
              </button>
              
              <button
                onClick={() => handleCustomerConfirmSubmit(true)}
                className="p-6 rounded-2xl bg-status-success/10 border-2 border-status-success/30 hover:bg-status-success/20 hover:border-status-success/50 transition-all flex flex-col items-center gap-3 touch-target"
              >
                <CheckCircleIcon className="h-12 w-12 text-status-success" />
                <div>
                  <div className="text-xl font-semibold text-status-success">Confirm</div>
                  <div className="text-sm text-status-success/70">This is correct</div>
                </div>
              </button>
            </div>
            
            {/* Footer Note */}
            <div className="text-center mt-6">
              <p className="text-xs text-text-tertiary">
                By confirming, you acknowledge the song count and amount displayed above.
                <br />
                Disputes will be reviewed by management.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Start Shift Modal */}
      {showStartShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowStartShiftModal(false)}
          ></div>
          
          <div className="relative w-full max-w-md card-premium p-6 animate-scale-in">
            <button
              onClick={() => setShowStartShiftModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-text-tertiary" />
            </button>
            
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <PlayIcon className="h-6 w-6 text-status-success" />
              Start Your Shift
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Opening Cash Balance (Optional)
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    className="input-premium w-full pl-12"
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-1">Count your cash drawer before starting</p>
              </div>
              
              <button
                onClick={handleStartShiftSubmit}
                disabled={isStartingShift}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2"
              >
                {isStartingShift ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5" />
                    Start Shift
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Shift Modal */}
      {showEndShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowEndShiftModal(false)}
          ></div>
          
          <div className="relative w-full max-w-md card-premium p-6 animate-scale-in">
            <button
              onClick={() => setShowEndShiftModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-text-tertiary" />
            </button>
            
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <StopIcon className="h-6 w-6 text-status-warning" />
              End Your Shift
            </h2>
            
            {/* Shift Summary */}
            <div className="p-4 rounded-xl bg-midnight-800/70 border border-white/10 mb-6">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Shift Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-tertiary">Duration</p>
                  <p className="font-bold text-electric-400">{shiftTimer}</p>
                </div>
                <div>
                  <p className="text-text-tertiary">Sessions</p>
                  <p className="font-bold text-text-primary">{shiftSummary.totalSessions}</p>
                </div>
                <div>
                  <p className="text-text-tertiary">House Fees</p>
                  <p className="font-bold text-gold-500">${shiftSummary.totalHouseFees.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-text-tertiary">Songs Logged</p>
                  <p className="font-bold text-text-primary">{shiftSummary.totalSongsLogged}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Closing Cash Balance
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={closingBalance}
                    onChange={e => setClosingBalance(e.target.value)}
                    className="input-premium w-full pl-12"
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  Expected: ${shiftSummary.currentCashBalance.toFixed(2)}
                </p>
              </div>
              
              <button
                onClick={handleEndShiftSubmit}
                disabled={isEndingShift}
                className="w-full py-4 rounded-xl bg-status-warning/10 border border-status-warning/30 text-status-warning font-semibold hover:bg-status-warning/20 transition-all flex items-center justify-center gap-2"
              >
                {isEndingShift ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Ending...
                  </>
                ) : (
                  <>
                    <StopIcon className="h-5 w-5" />
                    End Shift
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default VipHostInterface
