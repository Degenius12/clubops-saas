import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  QrCodeIcon,
  MagnifyingGlassIcon,
  IdentificationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  ClockIcon,
  UserIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  BellAlertIcon,
  DocumentCheckIcon,
  CameraIcon,
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  WifiIcon,
  SignalSlashIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/outline'
import { useDoorStaffData } from '../../hooks'
import { useAppSelector } from '../../hooks'
import toast from 'react-hot-toast'

// Helper function to get clubId - in production, this would come from auth context
const useClubId = () => {
  const auth = useAppSelector((state) => state.auth)
  // For now, return a default or from auth state
  return auth?.user?.club_id || 'demo-club-id'
}

const DoorStaffInterface: React.FC = () => {
  // Get clubId from auth
  const clubId = useClubId()
  
  // Use the data hook for all API interactions
  const {
    presentDancers,
    departedDancers,
    searchResults,
    alerts,
    summary,
    activeShift,
    isConnected,
    isLoading,
    isSearching,
    isCheckingIn,
    isStartingShift,
    isEndingShift,
    error,
    searchError,
    handleSearch,
    handleQRScan,
    handleCheckIn,
    handleCheckOut,
    handleCollectBarFee,
    handleAcknowledgeAlert,
    handleStartShift,
    handleEndShift,
    refreshData,
    clearSearch,
  } = useDoorStaffData(clubId)

  // Local UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDancer, setSelectedDancer] = useState<any>(null)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showIDScanner, setShowIDScanner] = useState(false)
  const [showStartShiftModal, setShowStartShiftModal] = useState(false)
  const [showEndShiftModal, setShowEndShiftModal] = useState(false)
  const [qrInput, setQrInput] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [closingBalance, setClosingBalance] = useState('')
  const [shiftTimer, setShiftTimer] = useState('0:00:00')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout>()

  // Club settings (would come from club config API)
  const clubSettings = {
    barFeeAmount: 50,
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

  // Debounced search
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    
    if (searchQuery.length >= 2) {
      searchDebounceRef.current = setTimeout(() => {
        handleSearch(searchQuery)
      }, 300)
    } else {
      clearSearch()
    }
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [searchQuery, handleSearch, clearSearch])

  // Show errors as toasts
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Helper functions
  const getLicenseStatusStyles = (status: string) => {
    const normalizedStatus = status?.toLowerCase()
    switch (normalizedStatus) {
      case 'valid':
        return {
          bg: 'bg-status-success/10',
          border: 'border-status-success/30',
          text: 'text-status-success',
          label: 'Valid'
        }
      case 'expiring_soon':
      case 'expiring':
        return {
          bg: 'bg-status-warning/10',
          border: 'border-status-warning/30',
          text: 'text-status-warning',
          label: 'Expiring Soon'
        }
      case 'expired':
        return {
          bg: 'bg-status-danger/10',
          border: 'border-status-danger/30',
          text: 'text-status-danger',
          label: 'EXPIRED'
        }
      default:
        return {
          bg: 'bg-midnight-700',
          border: 'border-white/10',
          text: 'text-text-tertiary',
          label: 'Not Verified'
        }
    }
  }

  const getAlertSeverityStyles = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-status-danger/20 border-status-danger/50 text-status-danger'
      case 'HIGH':
        return 'bg-status-danger/10 border-status-danger/30 text-status-danger'
      case 'MEDIUM':
        return 'bg-status-warning/10 border-status-warning/30 text-status-warning'
      default:
        return 'bg-status-info/10 border-status-info/30 text-status-info'
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return { bg: 'bg-status-success/10', text: 'text-status-success', label: 'Paid' }
      case 'COLLECTED':
        return { bg: 'bg-status-success/10', text: 'text-status-success', label: 'Collected' }
      case 'DEFERRED':
        return { bg: 'bg-status-warning/10', text: 'text-status-warning', label: 'Deferred' }
      case 'WAIVED':
        return { bg: 'bg-royal-500/10', text: 'text-royal-400', label: 'Waived' }
      default:
        return { bg: 'bg-midnight-700', text: 'text-text-tertiary', label: 'Pending' }
    }
  }

  const formatTime = (isoString: string) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return null
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Get checked-in dancer IDs
  const checkedInDancerIds = (presentDancers || []).map(c => c.dancerId)

  // Unacknowledged alerts count
  const unacknowledgedAlerts = (alerts || []).filter(a => a.status === 'PENDING').length

  // Event Handlers
  const handleSelectDancer = (dancer: any) => {
    if (checkedInDancerIds.includes(dancer.id)) {
      toast.error('Dancer is already checked in')
      return
    }
    if (dancer.licenseStatus === 'EXPIRED') {
      toast.error('Cannot check in - License has expired!')
      return
    }
    setSelectedDancer(dancer)
    setShowCheckInModal(true)
  }

  const handleQRLookup = async () => {
    if (qrInput) {
      try {
        await handleQRScan(qrInput)
      } catch (err) {
        toast.error('QR code not found')
      }
      setQrInput('')
    }
    setShowQRScanner(false)
  }

  const handleCheckInSubmit = async (paymentMethod: 'CASH' | 'CARD' | 'DEFER' | 'WAIVE') => {
    if (!selectedDancer) return

    try {
      await handleCheckIn({
        dancerId: selectedDancer.id,
        barFeeAmount: clubSettings.barFeeAmount,
        barFeeStatus: paymentMethod === 'DEFER' ? 'DEFERRED' : 
                      paymentMethod === 'WAIVE' ? 'WAIVED' : 'PAID',
        paymentMethod: paymentMethod === 'CASH' || paymentMethod === 'CARD' ? paymentMethod : undefined,
      })
      
      toast.success(`${selectedDancer.stageName} checked in successfully`)
      setShowCheckInModal(false)
      setSelectedDancer(null)
      setSearchQuery('')
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed')
    }
  }

  const handleCheckOutSubmit = async (checkInId: string, dancerName: string) => {
    try {
      await handleCheckOut(checkInId)
      toast.success(`${dancerName} checked out`)
    } catch (err: any) {
      toast.error(err.message || 'Check-out failed')
    }
  }

  const handleCollectDeferredFee = async (checkInId: string, paymentMethod: 'CASH' | 'CARD') => {
    try {
      await handleCollectBarFee(checkInId, paymentMethod)
      toast.success('Bar fee collected')
    } catch (err: any) {
      toast.error(err.message || 'Collection failed')
    }
  }

  const handleAcknowledgeAlertClick = async (alertId: string) => {
    try {
      await handleAcknowledgeAlert(alertId)
    } catch (err: any) {
      toast.error(err.message || 'Failed to acknowledge')
    }
  }

  const handleStartShiftSubmit = async () => {
    try {
      await handleStartShift({
        role: 'DOOR_STAFF',
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

  // Computed summary values
  const shiftSummary = {
    totalCheckIns: summary?.checkedInCount || (presentDancers || []).length + (departedDancers || []).length,
    totalCheckOuts: summary?.checkedOutCount || (departedDancers || []).length,
    currentlyPresent: summary?.presentCount || (presentDancers || []).length,
    barFeesCash: summary?.cashCollected || 0,
    barFeesCard: summary?.cardCollected || 0,
    barFeesDeferred: summary?.barFeesDeferred || 0,
    barFeesWaived: summary?.barFeesWaived || 0,
    totalBarFees: summary?.barFeesCollected || 0,
    openingCashBalance: activeShift?.cashDrawer?.openingBalance || 0,
    currentCashBalance: (activeShift?.cashDrawer?.openingBalance || 0) + (summary?.cashCollected || 0),
    alertsCount: summary?.pendingAlerts || unacknowledgedAlerts,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-950 via-midnight-900 to-midnight-950 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-electric-500/30 blur-lg rounded-full"></div>
            <div className="relative p-3 rounded-xl bg-electric-500/15 border border-electric-500/20">
              <ShieldCheckIcon className="h-6 w-6 text-electric-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Door Staff Station</h1>
            <p className="text-sm text-text-tertiary">Check-ins, IDs & Bar Fees</p>
          </div>
        </div>
        
        {/* Status Indicators & Shift Info */}
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

          {/* Alert Badge */}
          {unacknowledgedAlerts > 0 && (
            <button className="relative p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 animate-pulse">
              <BellAlertIcon className="h-6 w-6 text-status-danger" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-status-danger rounded-full text-xs font-bold flex items-center justify-center text-white">
                {unacknowledgedAlerts}
              </span>
            </button>
          )}
          
          {/* Shift Timer / Start Shift */}
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
                disabled={isEndingShift}
                className="flex items-center gap-2 text-status-warning hover:text-status-warning/80 transition-colors"
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
        
        {/* Left Column - Check-In Panel */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Quick Actions Bar */}
          <div className="card-premium p-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <div className="flex flex-wrap gap-3">
              {/* QR Scanner Button */}
              <button
                onClick={() => setShowQRScanner(true)}
                disabled={!activeShift}
                className="flex-1 min-w-[140px] btn-primary py-4 flex items-center justify-center gap-3 touch-target disabled:opacity-50"
              >
                <QrCodeIcon className="h-6 w-6" />
                <span className="font-semibold">Scan QR Badge</span>
              </button>
              
              {/* ID Scanner Button */}
              <button
                onClick={() => setShowIDScanner(true)}
                disabled={!activeShift}
                className="flex-1 min-w-[140px] btn-secondary py-4 flex items-center justify-center gap-3 touch-target disabled:opacity-50"
              >
                <IdentificationIcon className="h-6 w-6" />
                <span className="font-semibold">Scan ID</span>
              </button>
              
              {/* Manual Search */}
              <div className="flex-[2] min-w-[200px] relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name or badge..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  disabled={!activeShift}
                  className="input-premium w-full pl-12 py-4 disabled:opacity-50"
                />
                {isSearching && (
                  <ArrowPathIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-electric-400 animate-spin" />
                )}
              </div>
            </div>
            
            {!activeShift && (
              <p className="text-center text-status-warning text-sm mt-3">
                Start your shift to begin check-ins
              </p>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchQuery && (searchResults || []).length > 0 && (
            <div className="card-premium p-4 animate-fade-in">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Search Results</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(searchResults || []).map(dancer => {
                  const licenseStyles = getLicenseStatusStyles(dancer.licenseStatus)
                  const isCheckedIn = dancer.isCheckedIn || checkedInDancerIds.includes(dancer.id)
                  
                  return (
                    <button
                      key={dancer.id}
                      onClick={() => handleSelectDancer(dancer)}
                      disabled={isCheckedIn || dancer.licenseStatus === 'EXPIRED'}
                      className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 touch-target
                        ${isCheckedIn || dancer.licenseStatus === 'EXPIRED'
                          ? 'bg-midnight-800/50 border-white/5 opacity-50 cursor-not-allowed'
                          : 'bg-midnight-800/50 border-white/10 hover:border-electric-500/30 hover:bg-midnight-700/50'
                        }`}
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric-500/20 to-royal-500/20 flex items-center justify-center border border-white/10">
                        <span className="text-lg font-bold text-electric-400">{dancer.stageName?.charAt(0)}</span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-text-primary">{dancer.stageName}</p>
                        <p className="text-sm text-text-tertiary">{dancer.firstName} {dancer.lastName}</p>
                      </div>
                      
                      {/* License Status */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${licenseStyles.bg} ${licenseStyles.text} border ${licenseStyles.border}`}>
                        {licenseStyles.label}
                      </span>
                      
                      {/* Checked In Badge */}
                      {isCheckedIn && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-status-success/10 text-status-success border border-status-success/30">
                          Checked In
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {searchQuery && (searchResults || []).length === 0 && !isSearching && (
            <div className="card-premium p-4 animate-fade-in">
              <p className="text-text-tertiary text-sm py-4 text-center">No dancers found matching "{searchQuery}"</p>
            </div>
          )}

          {/* Today's Check-Ins List */}
          <div className="card-premium p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <DocumentCheckIcon className="h-5 w-5 text-electric-400" />
                Today's Check-Ins
              </h2>
              <span className="text-sm text-text-tertiary">
                {(presentDancers || []).length} present / {(presentDancers || []).length + (departedDancers || []).length} total
              </span>
            </div>
            
            {isLoading && (presentDancers || []).length === 0 ? (
              <div className="text-center py-12">
                <ArrowPathIcon className="h-8 w-8 mx-auto mb-3 text-electric-400 animate-spin" />
                <p className="text-text-tertiary">Loading check-ins...</p>
              </div>
            ) : (presentDancers || []).length === 0 && (departedDancers || []).length === 0 ? (
              <div className="text-center py-12 text-text-tertiary">
                <UserIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No check-ins yet this shift</p>
                <p className="text-sm mt-1">Scan a badge or search to check in a dancer</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {/* Present Dancers */}
                {(presentDancers || []).map(record => {
                  const paymentBadge = getPaymentStatusBadge(record.barFeeStatus)
                  
                  return (
                    <div
                      key={record.id}
                      className="p-4 rounded-xl border transition-all flex items-center gap-4 bg-midnight-800/70 border-status-success/20"
                    >
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full flex items-center justify-center border bg-gradient-to-br from-status-success/20 to-electric-500/20 border-status-success/30">
                        <span className="text-base font-bold text-status-success">
                          {record.dancer?.stageName?.charAt(0) || '?'}
                        </span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{record.dancer?.stageName}</p>
                        <div className="flex items-center gap-2 text-xs text-text-tertiary mt-0.5">
                          <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
                          <span>In: {formatTime(record.checkInTime)}</span>
                        </div>
                      </div>
                      
                      {/* Bar Fee Badge & Actions */}
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${paymentBadge.bg} ${paymentBadge.text} border border-white/5`}>
                          ${record.barFeeAmount} {paymentBadge.label}
                        </span>
                        
                        {/* Collect Deferred Fee */}
                        {record.barFeeStatus === 'DEFERRED' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCollectDeferredFee(record.id, 'CASH')}
                              className="p-2 rounded-lg bg-status-success/10 border border-status-success/30 hover:bg-status-success/20 transition-all touch-target"
                              title="Collect Cash"
                            >
                              <BanknotesIcon className="h-4 w-4 text-status-success" />
                            </button>
                            <button
                              onClick={() => handleCollectDeferredFee(record.id, 'CARD')}
                              className="p-2 rounded-lg bg-electric-500/10 border border-electric-500/30 hover:bg-electric-500/20 transition-all touch-target"
                              title="Collect Card"
                            >
                              <CreditCardIcon className="h-4 w-4 text-electric-400" />
                            </button>
                          </div>
                        )}
                        
                        {/* Check Out Button */}
                        <button
                          onClick={() => handleCheckOutSubmit(record.id, record.dancer?.stageName)}
                          className="p-2 rounded-lg bg-midnight-700/50 border border-white/10 hover:border-status-warning/30 hover:bg-status-warning/10 transition-all touch-target"
                          title="Check Out"
                        >
                          <ArrowLeftOnRectangleIcon className="h-5 w-5 text-text-tertiary hover:text-status-warning" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                
                {/* Departed Dancers */}
                {(departedDancers || []).map(record => {
                  const paymentBadge = getPaymentStatusBadge(record.barFeeStatus)
                  
                  return (
                    <div
                      key={record.id}
                      className="p-4 rounded-xl border transition-all flex items-center gap-4 bg-midnight-800/30 border-white/5 opacity-60"
                    >
                      <div className="w-11 h-11 rounded-full flex items-center justify-center border bg-midnight-700 border-white/10">
                        <span className="text-base font-bold text-text-tertiary">
                          {record.dancer?.stageName?.charAt(0) || '?'}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{record.dancer?.stageName}</p>
                        <div className="flex items-center gap-2 text-xs text-text-tertiary mt-0.5">
                          <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
                          <span>In: {formatTime(record.checkInTime)}</span>
                          <span className="text-white/20">•</span>
                          <ArrowLeftOnRectangleIcon className="h-3.5 w-3.5" />
                          <span>Out: {record.checkOutTime ? formatTime(record.checkOutTime) : '-'}</span>
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${paymentBadge.bg} ${paymentBadge.text} border border-white/5`}>
                        ${record.barFeeAmount} {paymentBadge.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Alerts & Shift Summary */}
        <div className="space-y-6">
          
          {/* Cross-Verification Alerts */}
          <div className="card-premium p-5 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <BellAlertIcon className="h-5 w-5 text-status-warning" />
                Verification Alerts
              </h2>
              {(alerts || []).length > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-status-danger/10 text-status-danger">
                  {unacknowledgedAlerts} new
                </span>
              )}
            </div>
            
            {(alerts || []).length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">
                <CheckCircleIcon className="h-10 w-10 mx-auto mb-2 text-status-success/50" />
                <p className="text-sm">All clear - no alerts</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {(alerts || []).map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border ${getAlertSeverityStyles(alert.severity)} ${alert.status !== 'PENDING' ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.title || alert.message}</p>
                        {alert.message && alert.title && (
                          <p className="text-xs opacity-70 mt-1">{alert.message}</p>
                        )}
                        <p className="text-xs opacity-50 mt-1">{formatTime(alert.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {alert.status === 'PENDING' && (
                          <button
                            onClick={() => handleAcknowledgeAlertClick(alert.id)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            title="Acknowledge"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shift Summary Panel */}
          <div className="card-premium p-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
              <SparklesIcon className="h-5 w-5 text-gold-500" />
              Shift Summary
            </h2>
            
            <div className="space-y-4">
              {/* Attendance Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-status-success/10 border border-status-success/20">
                  <p className="text-2xl font-bold text-status-success tabular-nums">{shiftSummary.currentlyPresent}</p>
                  <p className="text-xs text-text-tertiary mt-1">Present</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-electric-500/10 border border-electric-500/20">
                  <p className="text-2xl font-bold text-electric-400 tabular-nums">{shiftSummary.totalCheckIns}</p>
                  <p className="text-xs text-text-tertiary mt-1">Check-Ins</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-midnight-700/50 border border-white/10">
                  <p className="text-2xl font-bold text-text-secondary tabular-nums">{shiftSummary.totalCheckOuts}</p>
                  <p className="text-xs text-text-tertiary mt-1">Check-Outs</p>
                </div>
              </div>
              
              <div className="h-px bg-white/10"></div>
              
              {/* Bar Fees Breakdown */}
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-3">Bar Fees Collected</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary flex items-center gap-2">
                      <BanknotesIcon className="h-4 w-4" /> Cash
                    </span>
                    <span className="font-medium text-status-success tabular-nums">${shiftSummary.barFeesCash}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary flex items-center gap-2">
                      <CreditCardIcon className="h-4 w-4" /> Card
                    </span>
                    <span className="font-medium text-electric-400 tabular-nums">${shiftSummary.barFeesCard}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" /> Deferred
                    </span>
                    <span className="font-medium text-status-warning tabular-nums">${shiftSummary.barFeesDeferred}</span>
                  </div>
                  {shiftSummary.barFeesWaived > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-tertiary">Waived</span>
                      <span className="font-medium text-text-tertiary tabular-nums">${shiftSummary.barFeesWaived}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
                    <span className="font-medium text-text-secondary">Total</span>
                    <span className="font-bold text-gold-500 tabular-nums">${shiftSummary.totalBarFees}</span>
                  </div>
                </div>
              </div>
              
              <div className="h-px bg-white/10"></div>
              
              {/* Cash Drawer */}
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-3">Cash Drawer</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary">Opening</span>
                    <span className="text-text-secondary tabular-nums">${shiftSummary.openingCashBalance}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary">Current</span>
                    <span className="font-bold text-status-success tabular-nums">${shiftSummary.currentCashBalance}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ========== MODALS ========== */}

      {/* Check-In Modal */}
      {showCheckInModal && selectedDancer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowCheckInModal(false)
              setSelectedDancer(null)
            }}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg card-premium p-6 animate-scale-in">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowCheckInModal(false)
                setSelectedDancer(null)
              }}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-text-tertiary" />
            </button>
            
            <h2 className="text-xl font-bold text-text-primary mb-6">Check In Dancer</h2>
            
            {/* Dancer Card */}
            <div className="p-5 rounded-2xl bg-midnight-800/70 border border-white/10 mb-6">
              <div className="flex items-center gap-4 mb-4">
                {/* Large Avatar */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-electric-500/20 to-royal-500/20 flex items-center justify-center border border-white/10">
                  <span className="text-3xl font-bold text-electric-400">{selectedDancer.stageName?.charAt(0)}</span>
                </div>
                
                {/* Name & Badge */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-text-primary">{selectedDancer.stageName}</h3>
                  <p className="text-text-tertiary">{selectedDancer.firstName} {selectedDancer.lastName}</p>
                  {selectedDancer.badgeCode && (
                    <p className="text-xs text-text-tertiary mt-1">Badge: {selectedDancer.badgeCode}</p>
                  )}
                </div>
              </div>
              
              {/* License Info */}
              <div className="grid grid-cols-2 gap-3">
                {/* License Status */}
                <div className={`p-3 rounded-xl border ${getLicenseStatusStyles(selectedDancer.licenseStatus).bg} ${getLicenseStatusStyles(selectedDancer.licenseStatus).border}`}>
                  <p className="text-xs text-text-tertiary mb-1">License Status</p>
                  <p className={`font-semibold ${getLicenseStatusStyles(selectedDancer.licenseStatus).text}`}>
                    {getLicenseStatusStyles(selectedDancer.licenseStatus).label}
                  </p>
                </div>
                
                {/* License Expiry */}
                {selectedDancer.licenseExpiry && (
                  <div className="p-3 rounded-xl bg-midnight-700/50 border border-white/10">
                    <p className="text-xs text-text-tertiary mb-1">Expires</p>
                    <p className="font-semibold text-text-primary">
                      {new Date(selectedDancer.licenseExpiry).toLocaleDateString()}
                    </p>
                    {getDaysUntilExpiry(selectedDancer.licenseExpiry) !== null && 
                     getDaysUntilExpiry(selectedDancer.licenseExpiry)! <= 30 && 
                     getDaysUntilExpiry(selectedDancer.licenseExpiry)! > 0 && (
                      <p className="text-xs text-status-warning mt-1">
                        {getDaysUntilExpiry(selectedDancer.licenseExpiry)} days left
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Warning for expiring */}
              {selectedDancer.licenseStatus === 'EXPIRING_SOON' && (
                <div className="mt-4 p-3 rounded-xl bg-status-warning/10 border border-status-warning/30 flex items-start gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-status-warning flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-status-warning">License expiring soon</p>
                    <p className="text-xs text-status-warning/70 mt-0.5">
                      Remind dancer to renew their license
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Bar Fee Amount */}
            <div className="text-center mb-6">
              <p className="text-text-tertiary text-sm mb-1">Bar Fee</p>
              <p className="text-4xl font-bold text-gold-500">${clubSettings.barFeeAmount}</p>
            </div>
            
            {/* Payment Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCheckInSubmit('CASH')}
                disabled={isCheckingIn}
                className="py-4 px-6 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success font-semibold hover:bg-status-success/20 transition-all flex items-center justify-center gap-2 touch-target disabled:opacity-50"
              >
                <BanknotesIcon className="h-5 w-5" />
                {isCheckingIn ? 'Processing...' : 'Pay Cash'}
              </button>
              <button
                onClick={() => handleCheckInSubmit('CARD')}
                disabled={isCheckingIn}
                className="py-4 px-6 rounded-xl bg-electric-500/10 border border-electric-500/30 text-electric-400 font-semibold hover:bg-electric-500/20 transition-all flex items-center justify-center gap-2 touch-target disabled:opacity-50"
              >
                <CreditCardIcon className="h-5 w-5" />
                {isCheckingIn ? 'Processing...' : 'Pay Card'}
              </button>
              <button
                onClick={() => handleCheckInSubmit('DEFER')}
                disabled={isCheckingIn}
                className="py-4 px-6 rounded-xl bg-status-warning/10 border border-status-warning/30 text-status-warning font-semibold hover:bg-status-warning/20 transition-all flex items-center justify-center gap-2 touch-target disabled:opacity-50"
              >
                <ClockIcon className="h-5 w-5" />
                Defer
              </button>
              <button
                onClick={() => handleCheckInSubmit('WAIVE')}
                disabled={isCheckingIn}
                className="py-4 px-6 rounded-xl bg-midnight-700/50 border border-white/10 text-text-tertiary font-semibold hover:bg-midnight-600/50 transition-all flex items-center justify-center gap-2 touch-target disabled:opacity-50"
              >
                <XCircleIcon className="h-5 w-5" />
                Waive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowQRScanner(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md card-premium p-6 animate-scale-in">
            <button
              onClick={() => setShowQRScanner(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-text-tertiary" />
            </button>
            
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <QrCodeIcon className="h-6 w-6 text-electric-400" />
              Scan QR Badge
            </h2>
            
            {/* Camera Placeholder */}
            <div className="aspect-square rounded-2xl bg-midnight-800 border-2 border-dashed border-electric-500/30 flex flex-col items-center justify-center mb-6">
              <CameraIcon className="h-16 w-16 text-electric-500/30 mb-3" />
              <p className="text-text-tertiary text-sm">Camera feed would appear here</p>
              <p className="text-text-tertiary text-xs mt-1">Position QR code in frame</p>
            </div>
            
            {/* Manual Input Fallback */}
            <div className="space-y-3">
              <p className="text-sm text-text-tertiary text-center">Or enter badge code manually:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter badge code..."
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  className="input-premium flex-1"
                  onKeyDown={e => e.key === 'Enter' && handleQRLookup()}
                />
                <button
                  onClick={handleQRLookup}
                  className="btn-primary px-6"
                >
                  Look Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID Scanner Modal */}
      {showIDScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowIDScanner(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md card-premium p-6 animate-scale-in">
            <button
              onClick={() => setShowIDScanner(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-text-tertiary" />
            </button>
            
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <IdentificationIcon className="h-6 w-6 text-electric-400" />
              Scan ID / License
            </h2>
            
            {/* Scanner Placeholder */}
            <div className="aspect-video rounded-2xl bg-midnight-800 border-2 border-dashed border-electric-500/30 flex flex-col items-center justify-center mb-6">
              <IdentificationIcon className="h-16 w-16 text-electric-500/30 mb-3" />
              <p className="text-text-tertiary text-sm">ID Scanner would appear here</p>
              <p className="text-text-tertiary text-xs mt-1">Insert ID into scanner or use camera</p>
            </div>
            
            {/* Instructions */}
            <div className="space-y-3 text-sm text-text-tertiary">
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-electric-500/20 text-electric-400 flex items-center justify-center text-xs flex-shrink-0">1</span>
                <span>Scan state-issued ID or entertainer license</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-electric-500/20 text-electric-400 flex items-center justify-center text-xs flex-shrink-0">2</span>
                <span>System will verify against database and check expiration</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-electric-500/20 text-electric-400 flex items-center justify-center text-xs flex-shrink-0">3</span>
                <span>New dancers will be flagged for manager registration</span>
              </p>
            </div>
            
            <button
              onClick={() => setShowIDScanner(false)}
              className="w-full mt-6 btn-secondary py-3"
            >
              Cancel
            </button>
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
                  <p className="text-text-tertiary">Check-Ins</p>
                  <p className="font-bold text-text-primary">{shiftSummary.totalCheckIns}</p>
                </div>
                <div>
                  <p className="text-text-tertiary">Cash Collected</p>
                  <p className="font-bold text-status-success">${shiftSummary.barFeesCash}</p>
                </div>
                <div>
                  <p className="text-text-tertiary">Card Collected</p>
                  <p className="font-bold text-electric-400">${shiftSummary.barFeesCard}</p>
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
                  Expected: ${shiftSummary.currentCashBalance}
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

export default DoorStaffInterface
