import React, { useState, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MusicalNoteIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  LockClosedIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  UserIcon,
  BuildingStorefrontIcon,
  HashtagIcon,
  BellAlertIcon,
  SignalIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldCheckSolid } from '@heroicons/react/24/solid'
import { useSecurityDashboard } from '../../hooks/useSecurityDashboard'
import { useAppSelector } from '../../hooks'
import type { 
  IntegrityMetrics, 
  AuditLogEntry, 
  SongCountComparison, 
  AnomalyAlert, 
  EmployeePerformance 
} from '../../services/securityService'

// Helper to get clubId (temporary - should use ClubContext)
const useClubId = () => {
  const auth = useAppSelector((state) => state.auth)
  return auth?.user?.club_id || 'demo-club-id'
}

// Helper Functions
const getScoreColor = (score: number) => {
  if (score >= 95) return 'text-status-success'
  if (score >= 85) return 'text-electric-400'
  if (score >= 70) return 'text-status-warning'
  return 'text-status-danger'
}

const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'excellent': return { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30' }
    case 'good': return { bg: 'bg-electric-500/10', text: 'text-electric-400', border: 'border-electric-500/30' }
    case 'warning': case 'watch': return { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30' }
    case 'critical': case 'concern': return { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30' }
    default: return { bg: 'bg-midnight-700', text: 'text-text-tertiary', border: 'border-white/10' }
  }
}

const getVarianceStyles = (flagged: boolean, variance: number) => {
  if (!flagged && variance <= 2) return { bg: 'bg-status-success/10', text: 'text-status-success', label: 'Match' }
  if (variance <= 5) return { bg: 'bg-electric-500/10', text: 'text-electric-400', label: 'Minor' }
  if (variance <= 8) return { bg: 'bg-status-warning/10', text: 'text-status-warning', label: 'Significant' }
  return { bg: 'bg-status-danger/10', text: 'text-status-danger', label: 'Critical' }
}

const getSeverityStyles = (severity: string) => {
  switch (severity?.toUpperCase()) {
    case 'LOW': return { bg: 'bg-electric-500/10', text: 'text-electric-400', border: 'border-electric-500/30' }
    case 'MEDIUM': return { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30' }
    case 'HIGH': return { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30' }
    case 'CRITICAL': return { bg: 'bg-status-danger/20', text: 'text-status-danger', border: 'border-status-danger/50' }
    default: return { bg: 'bg-midnight-700', text: 'text-text-tertiary', border: 'border-white/10' }
  }
}

const getActionIcon = (action: string) => {
  switch (action?.toLowerCase()) {
    case 'override': case 'update': return <AdjustmentsHorizontalIcon className="h-4 w-4" />
    case 'void': return <XCircleIcon className="h-4 w-4" />
    case 'delete': return <TrashIcon className="h-4 w-4" />
    case 'create': return <CheckCircleIcon className="h-4 w-4" />
    case 'login': return <LockClosedIcon className="h-4 w-4" />
    case 'export': return <DocumentArrowDownIcon className="h-4 w-4" />
    default: return <InformationCircleIcon className="h-4 w-4" />
  }
}

const isFlaggedAction = (action: string) => {
  const flaggedActions = ['override', 'void', 'delete', 'update_session', 'adjust_count']
  return flaggedActions.includes(action?.toLowerCase())
}

const formatTimestamp = (iso: string) => {
  if (!iso) return '-'
  const date = new Date(iso)
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatDate = (iso: string) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const formatDuration = (minutes: number) => {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
}

const SecurityDashboard: React.FC = () => {
  const clubId = useClubId()
  
  // Hook data
  const {
    integrityMetrics,
    auditLog,
    songComparisons,
    anomalies,
    employeePerformance,
    dateFilter,
    isConnected,
    pendingAlertsCount,
    flaggedComparisonsCount,
    isLoading,
    isLoadingMetrics,
    isLoadingAudit,
    isLoadingComparisons,
    isLoadingAnomalies,
    error,
    handleInvestigate,
    handleResolve,
    handleDismiss,
    handleExportAuditLog,
    handleExportComparisons,
    handleFilterByDate,
    handleFilterAuditLog,
    handleFilterComparisons,
    refreshData,
  } = useSecurityDashboard(clubId)

  // Local UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'comparisons' | 'audit' | 'anomalies' | 'employees'>('overview')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week')
  const [auditFilter, setAuditFilter] = useState<'all' | 'flagged' | 'overrides' | 'voids' | 'deletes'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv')
  const [isExporting, setIsExporting] = useState(false)
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<AnomalyAlert | null>(null)
  const [resolutionText, setResolutionText] = useState('')
  const [showResolveModal, setShowResolveModal] = useState(false)

  // Calculate date range for filter
  const handleDateRangeChange = useCallback((range: 'today' | 'week' | 'month' | 'custom') => {
    setDateRange(range)
    const now = new Date()
    let start: string | undefined
    let end: string | undefined = now.toISOString()

    switch (range) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0)).toISOString()
        break
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7)).toISOString()
        break
      case 'month':
        start = new Date(now.setMonth(now.getMonth() - 1)).toISOString()
        break
      default:
        start = undefined
        end = undefined
    }
    handleFilterByDate(start, end)
  }, [handleFilterByDate])

  // Filter audit log locally based on UI filters
  const filteredAuditLog = useMemo(() => {
    return auditLog.entries.filter(entry => {
      const isFlagged = isFlaggedAction(entry.action)
      if (auditFilter === 'flagged' && !isFlagged) return false
      if (auditFilter === 'overrides' && entry.action?.toLowerCase() !== 'override' && entry.action?.toLowerCase() !== 'update') return false
      if (auditFilter === 'voids' && entry.action?.toLowerCase() !== 'void') return false
      if (auditFilter === 'deletes' && entry.action?.toLowerCase() !== 'delete') return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const userName = entry.user?.name?.toLowerCase() || ''
        const entityType = entry.entityType?.toLowerCase() || ''
        const action = entry.action?.toLowerCase() || ''
        if (!userName.includes(query) && !entityType.includes(query) && !action.includes(query)) {
          return false
        }
      }
      return true
    })
  }, [auditLog.entries, auditFilter, searchQuery])

  // Count flagged entries
  const flaggedEntriesCount = useMemo(() => {
    return auditLog.entries.filter(e => isFlaggedAction(e.action)).length
  }, [auditLog.entries])

  // Build metrics array for display
  const metricsArray = useMemo(() => {
    if (!integrityMetrics) return []
    return [
      { 
        label: 'Overall Integrity', 
        score: integrityMetrics.overallIntegrityScore, 
        trend: integrityMetrics.trendDirection, 
        status: integrityMetrics.statusBadge 
      },
      { 
        label: 'Song Count Match', 
        score: integrityMetrics.songCountMatchRate, 
        trend: 'stable' as const, 
        status: integrityMetrics.songCountMatchRate >= 95 ? 'excellent' : integrityMetrics.songCountMatchRate >= 85 ? 'good' : 'warning'
      },
      { 
        label: 'Revenue Accuracy', 
        score: integrityMetrics.revenueAccuracyRate, 
        trend: 'stable' as const, 
        status: integrityMetrics.revenueAccuracyRate >= 95 ? 'excellent' : integrityMetrics.revenueAccuracyRate >= 85 ? 'good' : 'warning'
      },
      { 
        label: 'Check-In Compliance', 
        score: integrityMetrics.checkInComplianceRate, 
        trend: 'stable' as const, 
        status: integrityMetrics.checkInComplianceRate >= 95 ? 'excellent' : integrityMetrics.checkInComplianceRate >= 85 ? 'good' : 'warning'
      },
    ]
  }, [integrityMetrics])

  // Handlers
  const handleInvestigateAlert = useCallback(async (alert: AnomalyAlert) => {
    try {
      await handleInvestigate(alert.id)
      toast.success('Alert marked as investigating')
    } catch (err: any) {
      toast.error(err.message || 'Failed to investigate alert')
    }
  }, [handleInvestigate])

  const handleResolveAlert = useCallback(async () => {
    if (!selectedAlertForAction || !resolutionText.trim()) {
      toast.error('Please enter a resolution')
      return
    }
    try {
      await handleResolve(selectedAlertForAction.id, resolutionText)
      toast.success('Alert resolved')
      setShowResolveModal(false)
      setSelectedAlertForAction(null)
      setResolutionText('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve alert')
    }
  }, [handleResolve, selectedAlertForAction, resolutionText])

  const handleDismissAlert = useCallback(async (alert: AnomalyAlert) => {
    try {
      await handleDismiss(alert.id, 'Dismissed by owner')
      toast.success('Alert dismissed')
    } catch (err: any) {
      toast.error(err.message || 'Failed to dismiss alert')
    }
  }, [handleDismiss])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      await handleExportAuditLog(exportFormat)
      await handleExportComparisons(exportFormat)
      toast.success('Export completed')
      setShowExportModal(false)
    } catch (err: any) {
      toast.error(err.message || 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }, [handleExportAuditLog, handleExportComparisons, exportFormat])

  const openResolveModal = useCallback((alert: AnomalyAlert) => {
    setSelectedAlertForAction(alert)
    setResolutionText('')
    setShowResolveModal(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-950 via-midnight-900 to-midnight-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-midnight-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gold-500/30 blur-xl rounded-full"></div>
                <div className="relative p-3 rounded-xl bg-gold-500/15 border border-gold-500/30">
                  <ShieldCheckSolid className="h-7 w-7 text-gold-500" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Security Dashboard</h1>
                <p className="text-sm text-text-tertiary">Owner-level fraud detection & monitoring</p>
              </div>
              
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                isConnected ? 'bg-status-success/10 border border-status-success/30' : 'bg-status-danger/10 border border-status-danger/30'
              }`}>
                {isConnected ? (
                  <>
                    <SignalIcon className="h-4 w-4 text-status-success" />
                    <span className="text-xs font-medium text-status-success">Live</span>
                  </>
                ) : (
                  <>
                    <SignalSlashIcon className="h-4 w-4 text-status-danger" />
                    <span className="text-xs font-medium text-status-danger">Offline</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Quick Stats & Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Alert Badges */}
              {pendingAlertsCount > 0 && (
                <div className="px-3 py-2 rounded-xl bg-status-danger/10 border border-status-danger/30 flex items-center gap-2">
                  <BellAlertIcon className="h-5 w-5 text-status-danger" />
                  <span className="text-sm font-medium text-status-danger">{pendingAlertsCount} Pending</span>
                </div>
              )}
              {flaggedComparisonsCount > 0 && (
                <div className="px-3 py-2 rounded-xl bg-status-warning/10 border border-status-warning/30 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-status-warning" />
                  <span className="text-sm font-medium text-status-warning">{flaggedComparisonsCount} Flagged</span>
                </div>
              )}
              
              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={e => handleDateRangeChange(e.target.value as any)}
                className="input-premium py-2 px-4 text-sm"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
              
              {/* Refresh Button */}
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="btn-secondary py-2 px-4 flex items-center gap-2"
              >
                <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Export Button */}
              <button
                onClick={() => setShowExportModal(true)}
                className="btn-secondary py-2 px-4 flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'comparisons', label: 'Data Comparisons', icon: DocumentMagnifyingGlassIcon },
              { id: 'audit', label: 'Audit Log', icon: ClockIcon },
              { id: 'anomalies', label: 'Anomaly Alerts', icon: ExclamationTriangleIcon },
              { id: 'employees', label: 'Employee Performance', icon: UserGroupIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-gold-500/15 text-gold-500 border border-gold-500/30' 
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-white/5'
                  }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="p-4 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">

        {/* ========== OVERVIEW TAB ========== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Integrity Score Cards */}
            {isLoadingMetrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="card-premium p-5 animate-pulse">
                    <div className="h-4 bg-midnight-700 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-midnight-700 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {metricsArray.map((metric, index) => {
                  const statusStyles = getStatusStyles(metric.status)
                  return (
                    <div 
                      key={metric.label}
                      className="card-premium p-5 animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <p className="text-sm text-text-tertiary">{metric.label}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}>
                          {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-end justify-between">
                        <div>
                          <p className={`text-4xl font-bold tabular-nums ${getScoreColor(metric.score)}`}>
                            {metric.score.toFixed(1)}%
                          </p>
                          <div className={`flex items-center gap-1 mt-1 text-sm ${
                            metric.trend === 'up' ? 'text-status-success' : 
                            metric.trend === 'down' ? 'text-status-danger' : 'text-text-tertiary'
                          }`}>
                            {metric.trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4" />}
                            {metric.trend === 'down' && <ArrowTrendingDownIcon className="h-4 w-4" />}
                            {metric.trend === 'stable' && <span className="text-xs">→</span>}
                            <span>{metric.trend === 'stable' ? 'Stable' : metric.trend === 'up' ? 'Improving' : 'Declining'}</span>
                          </div>
                        </div>
                        
                        {/* Mini Progress Ring */}
                        <div className="relative w-16 h-16">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-midnight-700" />
                            <circle 
                              cx="32" cy="32" r="28" fill="none" strokeWidth="4" strokeLinecap="round"
                              className={getScoreColor(metric.score)}
                              strokeDasharray={`${(metric.score / 100) * 176} 176`}
                            />
                          </svg>
                          <ShieldCheckIcon className={`absolute inset-0 m-auto h-6 w-6 ${getScoreColor(metric.score)}`} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Recent Anomalies */}
              <div className="card-premium p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-status-warning" />
                    Recent Anomalies
                  </h2>
                  <button 
                    onClick={() => setActiveTab('anomalies')}
                    className="text-sm text-electric-400 hover:text-electric-300 flex items-center gap-1"
                  >
                    View All <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {isLoadingAnomalies ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="p-4 rounded-xl bg-midnight-800/50 animate-pulse">
                        <div className="h-4 bg-midnight-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-midnight-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : anomalies.alerts.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary">
                    <ShieldCheckIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No anomalies detected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {anomalies.alerts.slice(0, 3).map(alert => {
                      const severityStyles = getSeverityStyles(alert.severity)
                      return (
                        <div 
                          key={alert.id}
                          className={`p-4 rounded-xl border ${severityStyles.border} ${severityStyles.bg}`}
                        >
                          <div className="flex items-start gap-3">
                            <ExclamationCircleIcon className={`h-5 w-5 flex-shrink-0 ${severityStyles.text}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${severityStyles.text}`}>{alert.title}</p>
                              <p className="text-sm text-text-tertiary mt-1 line-clamp-2">{alert.message}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                                <span>{formatTimestamp(alert.createdAt)}</span>
                                {alert.entityType && (
                                  <>
                                    <span className="text-white/20">•</span>
                                    <span>{alert.entityType}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${severityStyles.bg} ${severityStyles.text} border ${severityStyles.border}`}>
                              {alert.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recent Flagged Activity */}
              <div className="card-premium p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <DocumentMagnifyingGlassIcon className="h-5 w-5 text-status-danger" />
                    Flagged Activity
                  </h2>
                  <button 
                    onClick={() => { setActiveTab('audit'); setAuditFilter('flagged'); }}
                    className="text-sm text-electric-400 hover:text-electric-300 flex items-center gap-1"
                  >
                    View All <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {isLoadingAudit ? (
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="p-3 rounded-xl bg-midnight-800/50 animate-pulse">
                        <div className="h-4 bg-midnight-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-midnight-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditLog.entries.filter(e => isFlaggedAction(e.action)).slice(0, 4).map(entry => (
                      <div 
                        key={entry.id}
                        className="p-3 rounded-xl bg-status-danger/5 border border-status-danger/20"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-lg bg-status-danger/10 text-status-danger">
                            {getActionIcon(entry.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary">
                              {entry.action}: {entry.entityType} {entry.entityId ? `#${entry.entityId.slice(-6)}` : ''}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
                              <span>{entry.user?.name || 'Unknown'}</span>
                              <span className="text-white/20">•</span>
                              <span>{entry.user?.role || 'N/A'}</span>
                              <span className="text-white/20">•</span>
                              <span>{formatTimestamp(entry.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {auditLog.entries.filter(e => isFlaggedAction(e.action)).length === 0 && (
                      <div className="text-center py-8 text-text-tertiary">
                        <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No flagged activity</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Data Comparison Summary */}
            <div className="card-premium p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-electric-400" />
                  Song Count Comparison - Recent Sessions
                </h2>
                <button 
                  onClick={() => setActiveTab('comparisons')}
                  className="text-sm text-electric-400 hover:text-electric-300 flex items-center gap-1"
                >
                  Full Report <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              
              {isLoadingComparisons ? (
                <div className="animate-pulse space-y-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-12 bg-midnight-700 rounded"></div>
                  ))}
                </div>
              ) : songComparisons.comparisons.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No comparison data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-text-tertiary border-b border-white/10">
                        <th className="pb-3 font-medium">Session</th>
                        <th className="pb-3 font-medium text-center">Manual</th>
                        <th className="pb-3 font-medium text-center">DJ Sync</th>
                        <th className="pb-3 font-medium text-center">By Time</th>
                        <th className="pb-3 font-medium text-center">Variance</th>
                        <th className="pb-3 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {songComparisons.comparisons.slice(0, 5).map(row => {
                        const varianceStyles = getVarianceStyles(row.flagged, row.variance)
                        return (
                          <tr key={row.sessionId} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 text-sm text-text-primary">
                              {row.dancerName} - {row.boothName}
                              <span className="block text-xs text-text-tertiary">{formatTimestamp(row.startTime)}</span>
                            </td>
                            <td className="py-3 text-sm text-center font-mono tabular-nums text-text-secondary">{row.songCountManual}</td>
                            <td className="py-3 text-sm text-center font-mono tabular-nums text-text-secondary">{row.songCountDjSync || '-'}</td>
                            <td className="py-3 text-sm text-center font-mono tabular-nums text-text-tertiary">{row.songCountByTime}</td>
                            <td className={`py-3 text-sm text-center font-mono tabular-nums ${varianceStyles.text}`}>
                              {row.variance > 0 ? '+' : ''}{row.variance}
                            </td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${varianceStyles.bg} ${varianceStyles.text}`}>
                                {varianceStyles.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== DATA COMPARISONS TAB ========== */}
        {activeTab === 'comparisons' && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card-premium p-4 text-center">
                <p className="text-3xl font-bold text-status-success tabular-nums">
                  {songComparisons.comparisons.filter(d => !d.flagged && d.variance <= 2).length}
                </p>
                <p className="text-sm text-text-tertiary mt-1">Matching</p>
              </div>
              <div className="card-premium p-4 text-center">
                <p className="text-3xl font-bold text-electric-400 tabular-nums">
                  {songComparisons.comparisons.filter(d => d.variance > 2 && d.variance <= 5).length}
                </p>
                <p className="text-sm text-text-tertiary mt-1">Minor Variance</p>
              </div>
              <div className="card-premium p-4 text-center">
                <p className="text-3xl font-bold text-status-warning tabular-nums">
                  {songComparisons.comparisons.filter(d => d.variance > 5 && d.variance <= 8).length}
                </p>
                <p className="text-sm text-text-tertiary mt-1">Significant</p>
              </div>
              <div className="card-premium p-4 text-center">
                <p className="text-3xl font-bold text-status-danger tabular-nums">
                  {songComparisons.comparisons.filter(d => d.flagged || d.variance > 8).length}
                </p>
                <p className="text-sm text-text-tertiary mt-1">Critical</p>
              </div>
            </div>

            {/* Full Comparison Table */}
            <div className="card-premium p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Song Count Comparisons</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-tertiary">Legend:</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-status-success/10 text-status-success">≤2</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-electric-500/10 text-electric-400">2-5</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-status-warning/10 text-status-warning">5-8</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-status-danger/10 text-status-danger">&gt;8</span>
                </div>
              </div>
              
              {isLoadingComparisons ? (
                <div className="animate-pulse space-y-2">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="h-14 bg-midnight-700 rounded"></div>
                  ))}
                </div>
              ) : songComparisons.comparisons.length === 0 ? (
                <div className="text-center py-12 text-text-tertiary">
                  <DocumentMagnifyingGlassIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No comparison data for selected period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-text-tertiary border-b border-white/10">
                        <th className="pb-3 font-medium">Session Details</th>
                        <th className="pb-3 font-medium">Booth</th>
                        <th className="pb-3 font-medium">Host</th>
                        <th className="pb-3 font-medium text-center">
                          <div className="flex items-center justify-center gap-1">
                            <UserIcon className="h-4 w-4" /> Manual
                          </div>
                        </th>
                        <th className="pb-3 font-medium text-center">
                          <div className="flex items-center justify-center gap-1">
                            <MusicalNoteIcon className="h-4 w-4" /> DJ Sync
                          </div>
                        </th>
                        <th className="pb-3 font-medium text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ClockIcon className="h-4 w-4" /> By Time
                          </div>
                        </th>
                        <th className="pb-3 font-medium text-center">Final</th>
                        <th className="pb-3 font-medium text-center">Variance</th>
                        <th className="pb-3 font-medium text-center">Status</th>
                        <th className="pb-3 font-medium text-center">Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {songComparisons.comparisons.map(row => {
                        const varianceStyles = getVarianceStyles(row.flagged, row.variance)
                        return (
                          <tr key={row.sessionId} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-4">
                              <p className="text-sm font-medium text-text-primary">{row.dancerName}</p>
                              <p className="text-xs text-text-tertiary">{formatTimestamp(row.startTime)} - {formatDuration(row.duration)}</p>
                            </td>
                            <td className="py-4 text-sm text-text-secondary">{row.boothName}</td>
                            <td className="py-4 text-sm text-text-secondary">{row.vipHostName}</td>
                            <td className="py-4 text-center">
                              <span className="font-mono text-lg font-bold text-text-primary tabular-nums">{row.songCountManual}</span>
                            </td>
                            <td className="py-4 text-center">
                              <span className="font-mono text-lg font-bold text-electric-400 tabular-nums">{row.songCountDjSync || '-'}</span>
                            </td>
                            <td className="py-4 text-center">
                              <span className="font-mono text-sm text-text-tertiary tabular-nums">{row.songCountByTime}</span>
                            </td>
                            <td className="py-4 text-center">
                              <span className="font-mono text-lg font-bold text-gold-500 tabular-nums">{row.songCountFinal}</span>
                            </td>
                            <td className={`py-4 text-center font-mono font-bold tabular-nums ${varianceStyles.text}`}>
                              {row.variance > 0 ? '+' : ''}{row.variance}
                            </td>
                            <td className="py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${varianceStyles.bg} ${varianceStyles.text}`}>
                                {varianceStyles.label}
                              </span>
                            </td>
                            <td className="py-4 text-center">
                              {row.customerConfirmed ? (
                                <CheckCircleIcon className="h-5 w-5 text-status-success mx-auto" />
                              ) : (
                                <XCircleIcon className="h-5 w-5 text-status-warning mx-auto" />
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination */}
              {songComparisons.total > songComparisons.limit && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-text-tertiary">
                    Showing {songComparisons.comparisons.length} of {songComparisons.total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={songComparisons.page <= 1}
                      onClick={() => handleFilterComparisons({ page: songComparisons.page - 1 })}
                      className="btn-secondary py-2 px-4 text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={songComparisons.page * songComparisons.limit >= songComparisons.total}
                      onClick={() => handleFilterComparisons({ page: songComparisons.page + 1 })}
                      className="btn-secondary py-2 px-4 text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== AUDIT LOG TAB ========== */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filters */}
            <div className="card-premium p-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search by user or action..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="input-premium w-full pl-10"
                  />
                </div>
                
                {/* Filter Buttons */}
                <div className="flex items-center gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'flagged', label: 'Flagged', count: flaggedEntriesCount },
                    { id: 'overrides', label: 'Overrides' },
                    { id: 'voids', label: 'Voids' },
                    { id: 'deletes', label: 'Deletes' },
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setAuditFilter(filter.id as any)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                        ${auditFilter === filter.id
                          ? 'bg-gold-500/15 text-gold-500 border border-gold-500/30'
                          : 'text-text-tertiary hover:text-text-secondary hover:bg-white/5 border border-transparent'
                        }`}
                    >
                      {filter.label}
                      {filter.count !== undefined && filter.count > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-status-danger/20 text-status-danger">{filter.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="card-premium p-5">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Activity Log ({filteredAuditLog.length} entries)
              </h2>
              
              {isLoadingAudit ? (
                <div className="space-y-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="p-4 rounded-xl bg-midnight-800/50 animate-pulse">
                      <div className="h-4 bg-midnight-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-midnight-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAuditLog.map(entry => {
                    const isFlagged = isFlaggedAction(entry.action)
                    return (
                      <div 
                        key={entry.id}
                        className={`p-4 rounded-xl border transition-all hover:bg-white/5
                          ${isFlagged 
                            ? 'bg-status-danger/5 border-status-danger/20' 
                            : 'bg-midnight-800/50 border-white/5'
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Action Icon */}
                          <div className={`p-2.5 rounded-xl ${isFlagged ? 'bg-status-danger/10 text-status-danger' : 'bg-midnight-700 text-text-tertiary'}`}>
                            {getActionIcon(entry.action)}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-text-primary font-medium">
                                  {entry.action}: {entry.entityType}
                                  {entry.entityId && <span className="text-text-tertiary"> #{entry.entityId.slice(-8)}</span>}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-sm text-text-tertiary">
                                  <span className="font-medium text-text-secondary">{entry.user?.name || 'System'}</span>
                                  <span className="px-1.5 py-0.5 rounded text-xs bg-midnight-700">{entry.user?.role || 'N/A'}</span>
                                </div>
                              </div>
                              
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm text-text-secondary">{formatTimestamp(entry.timestamp)}</p>
                                {entry.ipAddress && <p className="text-xs text-text-tertiary mt-1">IP: {entry.ipAddress}</p>}
                              </div>
                            </div>
                            
                            {/* Old/New Values */}
                            {(entry.previousData || entry.newData) && (
                              <div className="flex items-center gap-3 mt-3 text-sm">
                                {entry.previousData && (
                                  <span className="px-2 py-1 rounded bg-status-danger/10 text-status-danger">
                                    {JSON.stringify(entry.previousData).slice(0, 50)}...
                                  </span>
                                )}
                                {entry.previousData && entry.newData && <span className="text-text-tertiary">→</span>}
                                {entry.newData && (
                                  <span className="px-2 py-1 rounded bg-status-success/10 text-status-success">
                                    {JSON.stringify(entry.newData).slice(0, 50)}...
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Flagged Badge */}
                          {isFlagged && (
                            <div className="flex-shrink-0">
                              <span className="px-2 py-1 rounded text-xs font-medium bg-status-danger/20 text-status-danger border border-status-danger/30">
                                FLAGGED
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              
              {filteredAuditLog.length === 0 && !isLoadingAudit && (
                <div className="text-center py-12 text-text-tertiary">
                  <DocumentMagnifyingGlassIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No matching entries found</p>
                </div>
              )}
              
              {/* Pagination */}
              {auditLog.total > auditLog.limit && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-text-tertiary">
                    Showing {filteredAuditLog.length} of {auditLog.total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={auditLog.page <= 1}
                      onClick={() => handleFilterAuditLog({ page: auditLog.page - 1 })}
                      className="btn-secondary py-2 px-4 text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={auditLog.page * auditLog.limit >= auditLog.total}
                      onClick={() => handleFilterAuditLog({ page: auditLog.page + 1 })}
                      className="btn-secondary py-2 px-4 text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* ========== ANOMALY ALERTS TAB ========== */}
        {activeTab === 'anomalies' && (
          <div className="space-y-6 animate-fade-in">
            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card-premium p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-status-danger/10">
                  <BellAlertIcon className="h-6 w-6 text-status-danger" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-status-danger tabular-nums">
                    {anomalies.statusSummary.pending}
                  </p>
                  <p className="text-sm text-text-tertiary">Pending</p>
                </div>
              </div>
              <div className="card-premium p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-status-warning/10">
                  <EyeIcon className="h-6 w-6 text-status-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-status-warning tabular-nums">
                    {anomalies.statusSummary.acknowledged}
                  </p>
                  <p className="text-sm text-text-tertiary">Investigating</p>
                </div>
              </div>
              <div className="card-premium p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-status-success/10">
                  <CheckCircleIcon className="h-6 w-6 text-status-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-status-success tabular-nums">
                    {anomalies.statusSummary.resolved}
                  </p>
                  <p className="text-sm text-text-tertiary">Resolved</p>
                </div>
              </div>
              <div className="card-premium p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-midnight-700">
                  <XCircleIcon className="h-6 w-6 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-secondary tabular-nums">
                    {anomalies.statusSummary.dismissed}
                  </p>
                  <p className="text-sm text-text-tertiary">Dismissed</p>
                </div>
              </div>
            </div>

            {/* Alerts List */}
            {isLoadingAnomalies ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="card-premium p-5 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-midnight-700 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-midnight-700 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-midnight-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : anomalies.alerts.length === 0 ? (
              <div className="card-premium p-12 text-center">
                <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4 text-status-success opacity-50" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">All Clear!</h3>
                <p className="text-text-tertiary">No anomalies detected for the selected period</p>
              </div>
            ) : (
              <div className="space-y-4">
                {anomalies.alerts.map(alert => {
                  const severityStyles = getSeverityStyles(alert.severity)
                  return (
                    <div 
                      key={alert.id}
                      className={`card-premium p-5 border-l-4 ${severityStyles.border}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Severity Icon */}
                        <div className={`p-3 rounded-xl ${severityStyles.bg}`}>
                          {alert.alertType === 'REVENUE_ANOMALY' && <ArrowTrendingDownIcon className={`h-6 w-6 ${severityStyles.text}`} />}
                          {alert.alertType === 'COUNT_MISMATCH' && <HashtagIcon className={`h-6 w-6 ${severityStyles.text}`} />}
                          {alert.alertType === 'PATTERN_ANOMALY' && <ChartBarIcon className={`h-6 w-6 ${severityStyles.text}`} />}
                          {alert.alertType === 'ACCESS_VIOLATION' && <LockClosedIcon className={`h-6 w-6 ${severityStyles.text}`} />}
                          {alert.alertType === 'TIME_ANOMALY' && <ClockIcon className={`h-6 w-6 ${severityStyles.text}`} />}
                          {!['REVENUE_ANOMALY', 'COUNT_MISMATCH', 'PATTERN_ANOMALY', 'ACCESS_VIOLATION', 'TIME_ANOMALY'].includes(alert.alertType) && (
                            <ExclamationCircleIcon className={`h-6 w-6 ${severityStyles.text}`} />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-text-primary">{alert.title}</h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${severityStyles.bg} ${severityStyles.text}`}>
                                  {alert.severity}
                                </span>
                              </div>
                              <p className="text-text-secondary">{alert.message}</p>
                            </div>
                            
                            <div className="text-right flex-shrink-0">
                              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium
                                ${alert.status === 'PENDING' ? 'bg-status-danger/10 text-status-danger' :
                                  alert.status === 'ACKNOWLEDGED' ? 'bg-status-warning/10 text-status-warning' :
                                  alert.status === 'RESOLVED' ? 'bg-status-success/10 text-status-success' :
                                  'bg-midnight-700 text-text-tertiary'
                                }`}
                              >
                                {alert.status}
                              </span>
                            </div>
                          </div>
                          
                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-tertiary">
                            <span className="flex items-center gap-1">
                              <CalendarDaysIcon className="h-4 w-4" />
                              {formatTimestamp(alert.createdAt)}
                            </span>
                            {alert.entityType && (
                              <span className="flex items-center gap-1">
                                <BuildingStorefrontIcon className="h-4 w-4" />
                                {alert.entityType}
                              </span>
                            )}
                          </div>
                          
                          {/* Alert Details */}
                          {alert.details && Object.keys(alert.details).length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-4">
                              {Object.entries(alert.details).map(([key, value]) => (
                                <div key={key} className="px-3 py-2 rounded-lg bg-midnight-800 border border-white/10">
                                  <p className="text-xs text-text-tertiary capitalize">{key.replace(/_/g, ' ')}</p>
                                  <p className="text-sm font-bold text-text-primary">{String(value)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Resolution Info */}
                          {alert.status === 'RESOLVED' && alert.resolvedBy && (
                            <div className="mt-4 p-3 rounded-lg bg-status-success/5 border border-status-success/20">
                              <p className="text-sm text-status-success">
                                ✓ Resolved: {alert.resolution || 'No resolution note'}
                              </p>
                              <p className="text-xs text-text-tertiary mt-1">
                                By {alert.resolvedBy} on {formatTimestamp(alert.resolvedAt || '')}
                              </p>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          {alert.status !== 'RESOLVED' && alert.status !== 'DISMISSED' && (
                            <div className="flex items-center gap-2 mt-4">
                              {alert.status === 'PENDING' && (
                                <button 
                                  onClick={() => handleInvestigateAlert(alert)}
                                  className="btn-primary py-2 px-4 text-sm"
                                >
                                  Investigate
                                </button>
                              )}
                              <button 
                                onClick={() => openResolveModal(alert)}
                                className="btn-secondary py-2 px-4 text-sm"
                              >
                                Mark Resolved
                              </button>
                              <button 
                                onClick={() => handleDismissAlert(alert)}
                                className="py-2 px-4 text-sm text-text-tertiary hover:text-text-secondary"
                              >
                                Dismiss
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== EMPLOYEE PERFORMANCE TAB ========== */}
        {activeTab === 'employees' && (
          <div className="space-y-6 animate-fade-in">
            {/* Performance Cards */}
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="card-premium p-5 animate-pulse">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-midnight-700 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-midnight-700 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-midnight-700 rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[1,2,3,4].map(j => (
                        <div key={j} className="p-3 rounded-xl bg-midnight-800/50">
                          <div className="h-3 bg-midnight-700 rounded w-1/2 mb-2"></div>
                          <div className="h-5 bg-midnight-700 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : employeePerformance.length === 0 ? (
              <div className="card-premium p-12 text-center">
                <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-text-tertiary opacity-50" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Employee Data</h3>
                <p className="text-text-tertiary">Employee performance data will appear here after shifts are completed</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {employeePerformance.map(employee => {
                    const getEmployeeStatus = (emp: EmployeePerformance) => {
                      if (emp.flaggedIncidents >= 4 || emp.avgVariance > 8) return 'concern'
                      if (emp.flaggedIncidents >= 2 || emp.avgVariance > 5) return 'watch'
                      if (emp.avgVariance <= 2 && emp.flaggedIncidents === 0) return 'excellent'
                      return 'good'
                    }
                    const status = getEmployeeStatus(employee)
                    const statusStyles = getStatusStyles(status)
                    
                    return (
                      <div key={employee.userId} className="card-premium p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-500/20 to-royal-500/20 flex items-center justify-center border border-white/10">
                              <span className="text-lg font-bold text-electric-400">{employee.userName.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-text-primary">{employee.userName}</h3>
                              <p className="text-sm text-text-tertiary">{employee.role}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles.bg} ${statusStyles.text} border ${statusStyles.border}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 rounded-xl bg-midnight-800/50 border border-white/5">
                            <p className="text-xs text-text-tertiary mb-1">Avg Variance</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xl font-bold tabular-nums ${
                                employee.avgVariance <= 3 ? 'text-status-success' : 
                                employee.avgVariance <= 6 ? 'text-status-warning' : 'text-status-danger'
                              }`}>
                                {employee.avgVariance.toFixed(1)}%
                              </span>
                              {employee.varianceTrend === 'improving' && <ArrowTrendingDownIcon className="h-4 w-4 text-status-success" />}
                              {employee.varianceTrend === 'worsening' && <ArrowTrendingUpIcon className="h-4 w-4 text-status-danger" />}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-midnight-800/50 border border-white/5">
                            <p className="text-xs text-text-tertiary mb-1">Collection Rate</p>
                            <span className={`text-xl font-bold tabular-nums ${
                              employee.collectionRate >= 98 ? 'text-status-success' : 
                              employee.collectionRate >= 95 ? 'text-electric-400' : 'text-status-warning'
                            }`}>
                              {employee.collectionRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-midnight-800/50 border border-white/5">
                            <p className="text-xs text-text-tertiary mb-1">Shifts Worked</p>
                            <span className="text-xl font-bold text-text-primary tabular-nums">{employee.shiftsWorked}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-midnight-800/50 border border-white/5">
                            <p className="text-xs text-text-tertiary mb-1">Flagged Incidents</p>
                            <span className={`text-xl font-bold tabular-nums ${
                              employee.flaggedIncidents === 0 ? 'text-status-success' : 
                              employee.flaggedIncidents <= 2 ? 'text-status-warning' : 'text-status-danger'
                            }`}>
                              {employee.flaggedIncidents}
                            </span>
                          </div>
                        </div>
                        
                        {/* Last Shift */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-tertiary">Last Shift</span>
                          <span className="text-text-secondary">{formatDate(employee.lastShift)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Comparison Table */}
                <div className="card-premium p-5">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Performance Comparison</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs text-text-tertiary border-b border-white/10">
                          <th className="pb-3 font-medium">Employee</th>
                          <th className="pb-3 font-medium">Role</th>
                          <th className="pb-3 font-medium text-center">Shifts</th>
                          <th className="pb-3 font-medium text-center">Avg Variance</th>
                          <th className="pb-3 font-medium text-center">Trend</th>
                          <th className="pb-3 font-medium text-center">Collection %</th>
                          <th className="pb-3 font-medium text-center">Flagged</th>
                          <th className="pb-3 font-medium text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeePerformance.map(emp => {
                          const getEmployeeStatus = (e: EmployeePerformance) => {
                            if (e.flaggedIncidents >= 4 || e.avgVariance > 8) return 'concern'
                            if (e.flaggedIncidents >= 2 || e.avgVariance > 5) return 'watch'
                            if (e.avgVariance <= 2 && e.flaggedIncidents === 0) return 'excellent'
                            return 'good'
                          }
                          const status = getEmployeeStatus(emp)
                          const statusStyles = getStatusStyles(status)
                          
                          return (
                            <tr key={emp.userId} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-3 font-medium text-text-primary">{emp.userName}</td>
                              <td className="py-3 text-text-secondary">{emp.role}</td>
                              <td className="py-3 text-center tabular-nums">{emp.shiftsWorked}</td>
                              <td className={`py-3 text-center font-mono tabular-nums ${
                                emp.avgVariance <= 3 ? 'text-status-success' : 
                                emp.avgVariance <= 6 ? 'text-status-warning' : 'text-status-danger'
                              }`}>
                                {emp.avgVariance.toFixed(1)}%
                              </td>
                              <td className="py-3 text-center">
                                {emp.varianceTrend === 'improving' && <span className="text-status-success">↓ Better</span>}
                                {emp.varianceTrend === 'stable' && <span className="text-text-tertiary">→ Stable</span>}
                                {emp.varianceTrend === 'worsening' && <span className="text-status-danger">↑ Worse</span>}
                              </td>
                              <td className={`py-3 text-center font-mono tabular-nums ${
                                emp.collectionRate >= 98 ? 'text-status-success' : 
                                emp.collectionRate >= 95 ? 'text-electric-400' : 'text-status-warning'
                              }`}>
                                {emp.collectionRate.toFixed(1)}%
                              </td>
                              <td className={`py-3 text-center tabular-nums ${
                                emp.flaggedIncidents === 0 ? 'text-status-success' : 'text-status-danger'
                              }`}>
                                {emp.flaggedIncidents}
                              </td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>


      {/* ========== EXPORT MODAL ========== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowExportModal(false)}
          ></div>
          
          <div className="relative w-full max-w-md card-premium p-6 animate-scale-in">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XCircleIcon className="h-5 w-5 text-text-tertiary" />
            </button>
            
            <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
              <DocumentArrowDownIcon className="h-6 w-6 text-gold-500" />
              Export Audit Trail
            </h2>
            <p className="text-text-tertiary text-sm mb-6">Download a full audit report for compliance or investigation.</p>
            
            {/* Export Options */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-midnight-800/50 border border-white/10 cursor-pointer hover:border-gold-500/30 transition-colors">
                <input type="checkbox" defaultChecked className="rounded border-white/20 bg-midnight-700 text-gold-500 focus:ring-gold-500" />
                <span className="text-text-primary">Audit Log Entries</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-midnight-800/50 border border-white/10 cursor-pointer hover:border-gold-500/30 transition-colors">
                <input type="checkbox" defaultChecked className="rounded border-white/20 bg-midnight-700 text-gold-500 focus:ring-gold-500" />
                <span className="text-text-primary">Song Count Comparisons</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-midnight-800/50 border border-white/10 cursor-pointer hover:border-gold-500/30 transition-colors">
                <input type="checkbox" defaultChecked className="rounded border-white/20 bg-midnight-700 text-gold-500 focus:ring-gold-500" />
                <span className="text-text-primary">Anomaly Alerts</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-midnight-800/50 border border-white/10 cursor-pointer hover:border-gold-500/30 transition-colors">
                <input type="checkbox" className="rounded border-white/20 bg-midnight-700 text-gold-500 focus:ring-gold-500" />
                <span className="text-text-primary">Employee Performance</span>
              </label>
            </div>
            
            {/* Format Selection */}
            <div className="mb-6">
              <label className="text-sm text-text-tertiary mb-2 block">Export Format</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setExportFormat('csv')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    exportFormat === 'csv' 
                      ? 'bg-gold-500/15 text-gold-500 border border-gold-500/30' 
                      : 'bg-midnight-800 text-text-tertiary border border-white/10 hover:border-white/20'
                  }`}
                >
                  CSV
                </button>
                <button 
                  onClick={() => setExportFormat('json')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    exportFormat === 'json' 
                      ? 'bg-gold-500/15 text-gold-500 border border-gold-500/30' 
                      : 'bg-midnight-800 text-text-tertiary border border-white/10 hover:border-white/20'
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>
            
            {/* Export Button */}
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Generate Export
                </>
              )}
            </button>
            
            <p className="text-xs text-text-tertiary text-center mt-4">
              Exports include hash verification for audit integrity
            </p>
          </div>
        </div>
      )}

      {/* ========== RESOLVE ALERT MODAL ========== */}
      {showResolveModal && selectedAlertForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowResolveModal(false)}
          ></div>
          
          <div className="relative w-full max-w-md card-premium p-6 animate-scale-in">
            <button
              onClick={() => setShowResolveModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XCircleIcon className="h-5 w-5 text-text-tertiary" />
            </button>
            
            <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
              <CheckCircleIcon className="h-6 w-6 text-status-success" />
              Resolve Alert
            </h2>
            <p className="text-text-tertiary text-sm mb-4">{selectedAlertForAction.title}</p>
            
            {/* Resolution Input */}
            <div className="mb-6">
              <label className="text-sm text-text-tertiary mb-2 block">Resolution Notes</label>
              <textarea
                value={resolutionText}
                onChange={e => setResolutionText(e.target.value)}
                placeholder="Describe how this alert was resolved..."
                className="input-premium w-full h-32 resize-none"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowResolveModal(false)}
                className="flex-1 btn-secondary py-3"
              >
                Cancel
              </button>
              <button 
                onClick={handleResolveAlert}
                disabled={!resolutionText.trim()}
                className="flex-1 btn-primary py-3 disabled:opacity-50"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecurityDashboard
