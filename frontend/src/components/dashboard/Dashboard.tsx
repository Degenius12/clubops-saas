import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState, AppDispatch } from '../../store/store'
import { fetchDancers } from '../../store/slices/dancerSlice'
import { fetchVIPRooms } from '../../store/slices/vipSlice'
import { fetchRevenue } from '../../store/slices/revenueSlice'
import apiClient from '../../config/api'
import ShiftControl from '../shift/ShiftControl'
import { useWebSocket } from '../../hooks/useWebSocket'
import {
  UsersIcon,
  MusicalNoteIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpRightIcon,
  PlusIcon,
  PlayIcon,
  SparklesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

// Animated number component with spring physics feel
const AnimatedNumber: React.FC<{ value: number; prefix?: string; decimals?: number }> = ({ 
  value, 
  prefix = '',
  decimals = 0 
}) => {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const duration = 800
    const steps = 40
    const increment = value / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [value])
  
  return (
    <span className="tabular-nums">
      {prefix}{displayValue.toLocaleString(undefined, { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
      })}
    </span>
  )
}

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { dancers } = useSelector((state: RootState) => state.dancers)
  const { rooms } = useSelector((state: RootState) => state.vip)
  const { currentQueue } = useSelector((state: RootState) => state.queue)
  const { todayRevenue, monthlyRevenue } = useSelector((state: RootState) => state.revenue)
  const { user } = useSelector((state: RootState) => state.auth)

  // Shift tracking state
  const [shiftData, setShiftData] = useState<any>(null)
  const [loadingShifts, setLoadingShifts] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Real-time updates with WebSocket (Feature #20)
  const { isConnected } = useWebSocket({
    clubId: user?.clubId || '',
    enabled: !!user?.clubId,
    // @ts-ignore - Custom event handler for revenue updates
    onRevenueUpdate: () => {
      // Refresh revenue data when a payment is collected
      dispatch(fetchRevenue({ period: 'today' }))
      setLastUpdate(new Date())
    }
  })

  useEffect(() => {
    dispatch(fetchDancers())
    dispatch(fetchVIPRooms())
    dispatch(fetchRevenue({ period: 'today' }))
    fetchShiftData()
  }, [dispatch])

  const fetchShiftData = async () => {
    try {
      setLoadingShifts(true)
      const response = await apiClient.get('/api/dashboard/shifts')
      setShiftData(response.data)
    } catch (error) {
      console.error('Failed to fetch shift data:', error)
    } finally {
      setLoadingShifts(false)
    }
  }

  // Calculate dashboard metrics
  const activeDancers = (dancers || []).filter(d => d.status === 'active').length
  const occupiedRooms = (rooms || []).filter(r => r.status === 'occupied').length
  const queueLength = (currentQueue || []).length
  const complianceIssues = (dancers || []).filter(d => d.complianceStatus !== 'valid').length

  // Get user role for filtering
  const userRole = user?.role?.toUpperCase() || 'MANAGER'
  const isDJ = userRole === 'DJ'

  const allStats = [
    {
      name: 'Active Entertainers',
      value: activeDancers,
      total: (dancers || []).length,
      icon: UsersIcon,
      iconBg: 'bg-electric-500/10',
      iconColor: 'text-electric-400',
      accentColor: 'electric-500',
      href: '/dancers',
      trend: { value: '+12%', positive: true },
      roles: ['OWNER', 'MANAGER', 'DJ', 'VIP_HOST', 'DOOR_STAFF', 'BARTENDER'] // Everyone can see dancers
    },
    {
      name: 'VIP Booths',
      value: occupiedRooms,
      total: (rooms || []).length,
      icon: BuildingStorefrontIcon,
      iconBg: 'bg-gold-500/10',
      iconColor: 'text-gold-500',
      accentColor: 'gold-500',
      href: '/vip',
      trend: { value: '85% occ.', positive: true },
      roles: ['OWNER', 'MANAGER', 'DJ', 'VIP_HOST'] // DJ can see VIP booth status for dancer locations
    },
    {
      name: 'DJ Queue',
      value: queueLength,
      total: null,
      icon: MusicalNoteIcon,
      iconBg: 'bg-royal-500/10',
      iconColor: 'text-royal-400',
      accentColor: 'royal-500',
      href: '/queue',
      trend: { value: 'Live', positive: true, isLive: true },
      roles: ['OWNER', 'MANAGER', 'DJ'] // Only DJ, Manager, and Owner see queue
    },
    {
      name: 'Today Revenue',
      value: todayRevenue || 0,
      isCurrency: true,
      total: null,
      icon: CurrencyDollarIcon,
      iconBg: 'bg-status-success/10',
      iconColor: 'text-status-success',
      accentColor: 'status-success',
      href: '/revenue',
      trend: { value: '+18%', positive: true },
      roles: ['OWNER', 'MANAGER'] // Only Owner and Manager see revenue
    }
  ]

  // Filter stats based on user role
  const stats = allStats.filter(stat => stat.roles.includes(userRole))

  const allAlerts = [
    {
      id: 1,
      type: 'compliance',
      message: 'License expiring in 3 days',
      detail: 'Sarah M.',
      severity: 'warning',
      time: '5m ago',
      roles: ['OWNER', 'MANAGER', 'DJ', 'VIP_HOST', 'DOOR_STAFF', 'BARTENDER']
    },
    {
      id: 2,
      type: 'revenue',
      message: 'VIP Booth payment received',
      detail: '$750',
      severity: 'success',
      time: '12m ago',
      roles: ['OWNER', 'MANAGER'] // Only Owner and Manager see revenue alerts
    },
    {
      id: 3,
      type: 'system',
      message: 'VIP Booth 3 timer exceeded',
      detail: '+15 min over',
      severity: 'info',
      time: '18m ago',
      roles: ['OWNER', 'MANAGER', 'DJ', 'VIP_HOST']
    },
    {
      id: 4,
      type: 'dancer',
      message: 'New dancer checked in',
      detail: 'Crystal R.',
      severity: 'success',
      time: '25m ago',
      roles: ['OWNER', 'MANAGER', 'DJ', 'VIP_HOST', 'DOOR_STAFF', 'BARTENDER']
    }
  ]

  // Filter alerts based on user role
  const recentAlerts = allAlerts.filter(alert => alert.roles.includes(userRole))

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'warning':
        return {
          bg: 'bg-status-warning/[0.06]',
          border: 'border-status-warning/15',
          icon: 'text-status-warning',
          dot: 'bg-status-warning',
          IconComponent: ExclamationTriangleIcon
        }
      case 'success':
        return {
          bg: 'bg-status-success/[0.06]',
          border: 'border-status-success/15',
          icon: 'text-status-success',
          dot: 'bg-status-success',
          IconComponent: CheckCircleIcon
        }
      default:
        return {
          bg: 'bg-status-info/[0.06]',
          border: 'border-status-info/15',
          icon: 'text-status-info',
          dot: 'bg-status-info',
          IconComponent: ClockIcon
        }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto" data-tour="dashboard">
      {/* Compact Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Welcome back, <span className="text-gradient-gold">{user?.firstName || user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-sm text-text-tertiary">
            {/* Real-time connection indicator (Feature #20) */}
            {isConnected && lastUpdate && (
              <span className="text-xs text-text-tertiary flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Last updated {new Date(lastUpdate).toLocaleTimeString()}
                <span className="mx-2">•</span>
              </span>
            )}
            {user?.clubName || 'Your Club'} • {user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase().replace('_', ' ') : 'User'} • {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
        
        {/* Compliance Status Badge */}
        <div className={`
          inline-flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-sm
          transition-all duration-300
          ${complianceIssues === 0 
            ? 'bg-status-success/[0.06] border border-status-success/20' 
            : 'bg-status-warning/[0.06] border border-status-warning/20'
          }
        `}>
          {complianceIssues === 0 ? (
            <>
              <div className="relative">
                <CheckCircleIcon className="h-5 w-5 text-status-success" />
              </div>
              <span className="text-sm font-medium text-status-success">All Compliant</span>
            </>
          ) : (
            <>
              <ExclamationTriangleIcon className="h-5 w-5 text-status-warning" />
              <span className="text-sm font-medium text-status-warning">{complianceIssues} Issues</span>
              <Link to="/dancers" className="text-xs text-gold-500 hover:underline ml-1">View</Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              to={stat.href}
              data-tour={stat.name === 'Today Revenue' ? 'revenue-kpi' : undefined}
              className="card-premium p-5 sm:p-6 group touch-target animate-fade-in-up"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between mb-4 sm:mb-5">
                {/* Icon - No Gradient */}
                <div className={`
                  p-3 rounded-xl ${stat.iconBg}
                  border border-white/[0.06]
                  transition-all duration-200
                  group-hover:border-white/[0.12]
                  group-hover:${stat.iconBg.replace('/10', '/15')}
                `}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                </div>

                {/* Trend Badge */}
                {stat.trend.isLive ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-success/10 text-status-success">
                    <span className="w-1.5 h-1.5 bg-status-success rounded-full animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-medium">Live</span>
                  </span>
                ) : (
                  <span className={`
                    inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium
                    ${stat.trend.positive
                      ? 'bg-status-success/10 text-status-success'
                      : 'bg-status-danger/10 text-status-danger'
                    }
                  `}>
                    <ArrowTrendingUpIcon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${!stat.trend.positive && 'rotate-180'}`} />
                    {stat.trend.value}
                  </span>
                )}
              </div>

              {/* Value */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-text-primary tabular-nums">
                    {stat.isCurrency ? (
                      <AnimatedNumber value={stat.value} prefix="$" />
                    ) : (
                      <AnimatedNumber value={stat.value} />
                    )}
                  </span>
                  {stat.total !== null && (
                    <span className="text-sm text-text-muted font-mono tabular-nums">/ {stat.total}</span>
                  )}
                </div>
                <p className="text-sm text-text-secondary flex items-center gap-1.5 group-hover:text-text-primary transition-colors">
                  {stat.name}
                  <ArrowUpRightIcon className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Shift Tracking Section */}
      {shiftData && shiftData.shifts && shiftData.shifts.length > 0 && (
        <div className="card-premium p-5 sm:p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-text-primary">Dancers by Shift</h2>
            <span className="text-sm text-text-tertiary">
              <span className="font-mono tabular-nums text-gold-500 font-semibold">{shiftData.totalActive}</span> total active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shiftData.shifts.map((shift: any, index: number) => (
              <div
                key={shift.id}
                className="p-4 rounded-xl bg-midnight-800/50 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{shift.name}</h3>
                    <p className="text-xs text-text-tertiary font-mono mt-0.5">
                      {shift.startTime} - {shift.endTime}
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-electric-500/10 border border-electric-500/20">
                    <span className="text-lg font-bold font-mono text-electric-400">{shift.dancerCount}</span>
                  </span>
                </div>

                {shift.dancers && shift.dancers.length > 0 ? (
                  <div className="space-y-1.5">
                    {shift.dancers.slice(0, 3).map((dancer: any) => (
                      <div key={dancer.id} className="flex items-center gap-2 text-xs text-text-secondary">
                        <div className="w-1.5 h-1.5 rounded-full bg-status-success" />
                        <span className="truncate">{dancer.stageName}</span>
                      </div>
                    ))}
                    {shift.dancers.length > 3 && (
                      <p className="text-xs text-text-muted italic">+{shift.dancers.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic">No dancers checked in</p>
                )}
              </div>
            ))}

            {/* Unassigned Dancers */}
            {shiftData.unassigned && shiftData.unassigned.count > 0 && (
              <div className="p-4 rounded-xl bg-status-warning/[0.06] border border-status-warning/15">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-status-warning">Unassigned</h3>
                    <p className="text-xs text-text-tertiary mt-0.5">No shift assigned</p>
                  </div>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-status-warning/10 border border-status-warning/20">
                    <span className="text-lg font-bold font-mono text-status-warning">{shiftData.unassigned.count}</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  {shiftData.unassigned.dancers.slice(0, 3).map((dancer: any) => (
                    <div key={dancer.id} className="flex items-center gap-2 text-xs text-text-secondary">
                      <div className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                      <span className="truncate">{dancer.stageName}</span>
                    </div>
                  ))}
                  {shiftData.unassigned.dancers.length > 3 && (
                    <p className="text-xs text-text-muted italic">+{shiftData.unassigned.dancers.length - 3} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card-premium overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.04]">
            <h2 className="text-base sm:text-lg font-semibold text-text-primary">Recent Activity</h2>
            <button className="text-xs sm:text-sm text-text-tertiary hover:text-gold-500 transition-colors touch-target">
              View all
            </button>
          </div>
          
          <div className="divide-y divide-white/[0.03]">
            {recentAlerts.map((alert, index) => {
              const styles = getSeverityStyles(alert.severity)
              const AlertIcon = styles.IconComponent
              return (
                <div 
                  key={alert.id} 
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-white/[0.015] transition-colors duration-150 touch-target"
                >
                  {/* Status Dot + Icon */}
                  <div className="relative flex-shrink-0">
                    <div className={`p-2 sm:p-2.5 rounded-xl ${styles.bg}`}>
                      <AlertIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${styles.icon}`} />
                    </div>
                    <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${styles.dot} ring-2 ring-midnight-800`} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-text-primary truncate">{alert.message}</p>
                    <p className="text-[10px] sm:text-xs text-text-tertiary mt-0.5">{alert.detail}</p>
                  </div>
                  
                  {/* Time */}
                  <span className="text-[10px] sm:text-xs text-text-muted whitespace-nowrap font-mono flex-shrink-0">
                    {alert.time}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 lg:space-y-6">
          {/* Shift Control - Only show to Manager, Super Manager, Owner */}
          {['MANAGER', 'SUPER_MANAGER', 'OWNER'].includes(userRole) && (
            <div className="animate-fade-in-up" style={{ animationDelay: '350ms' }}>
              <ShiftControl />
            </div>
          )}

          {/* Revenue Summary - Only show to Owner and Manager */}
          {!isDJ && (
            <div className="card-premium p-4 sm:p-5 animate-fade-in-up" style={{ animationDelay: '375ms' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gold-500/10">
                  <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gold-500" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-text-primary">Revenue</h3>
              </div>

              <div className="space-y-4">
                {/* Monthly Total */}
                <div>
                  <span className="text-[10px] sm:text-xs text-text-tertiary uppercase tracking-wider">This Month</span>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-text-primary mt-1">
                    <AnimatedNumber value={monthlyRevenue || 0} prefix="$" />
                  </div>
                </div>

                {/* Daily Average */}
                <div className="flex justify-between items-center py-2.5 border-t border-white/[0.04]">
                  <span className="text-xs sm:text-sm text-text-tertiary">Daily Average</span>
                  <span className="text-xs sm:text-sm font-semibold font-mono text-text-secondary tabular-nums">
                    ${Math.round((monthlyRevenue || 0) / Math.max(new Date().getDate(), 1)).toLocaleString()}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary font-medium">Monthly Goal</span>
                    <span className="text-gold-500 font-semibold tabular-nums">
                      {Math.min(Math.round(((monthlyRevenue || 0) / 50000) * 100), 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-midnight-700 rounded-full overflow-hidden border border-white/[0.04]">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.min(((monthlyRevenue || 0) / 50000) * 100, 100)}%`,
                        backgroundColor: '#D4AF37'
                      }}
                    />
                  </div>
                  <p className="text-xs text-text-muted tabular-nums">
                    ${((monthlyRevenue || 0)).toLocaleString()} of $50,000 goal
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card-premium p-5 sm:p-6 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>

            <div className="space-y-3">
              <Link
                to="/dancers"
                className="flex items-center gap-3 p-3 rounded-xl bg-electric-500/[0.05] border border-electric-500/10 hover:border-electric-500/25 hover:bg-electric-500/[0.08] transition-all duration-200 group touch-target"
              >
                <div className="p-2 rounded-lg bg-electric-500/15 border border-electric-500/20">
                  <PlusIcon className="h-4 w-4 text-electric-400" />
                </div>
                <span className="text-sm font-medium text-electric-400 flex-1">Add New Dancer</span>
                <ArrowUpRightIcon className="h-4 w-4 text-electric-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>

              <Link
                to="/vip"
                className="flex items-center gap-3 p-3 rounded-xl bg-gold-500/[0.05] border border-gold-500/10 hover:border-gold-500/25 hover:bg-gold-500/[0.08] transition-all duration-200 group touch-target"
              >
                <div className="p-2 rounded-lg bg-gold-500/15 border border-gold-500/20">
                  <BuildingStorefrontIcon className="h-4 w-4 text-gold-500" />
                </div>
                <span className="text-sm font-medium text-gold-500 flex-1">Manage VIP Booths</span>
                <ArrowUpRightIcon className="h-4 w-4 text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>

              <Link
                to="/queue"
                className="flex items-center gap-3 p-3 rounded-xl bg-royal-500/[0.05] border border-royal-500/10 hover:border-royal-500/25 hover:bg-royal-500/[0.08] transition-all duration-200 group touch-target"
              >
                <div className="p-2 rounded-lg bg-royal-500/15 border border-royal-500/20">
                  <PlayIcon className="h-4 w-4 text-royal-400" />
                </div>
                <span className="text-sm font-medium text-royal-400 flex-1">Open DJ Queue</span>
                <ArrowUpRightIcon className="h-4 w-4 text-royal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard