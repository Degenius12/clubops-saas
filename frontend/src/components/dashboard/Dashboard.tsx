import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState, AppDispatch } from '../../store/store'
import { fetchDancers } from '../../store/slices/dancerSlice'
import { fetchVIPRooms } from '../../store/slices/vipSlice'
import { fetchRevenue } from '../../store/slices/revenueSlice'
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

  useEffect(() => {
    dispatch(fetchDancers())
    dispatch(fetchVIPRooms())
    dispatch(fetchRevenue({ period: 'today' }))
  }, [dispatch])

  // Calculate dashboard metrics
  const activeDancers = dancers.filter(d => d.status === 'active').length
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length
  const queueLength = currentQueue.length
  const complianceIssues = dancers.filter(d => d.complianceStatus !== 'valid').length

  const stats = [
    {
      name: 'Active Dancers',
      value: activeDancers,
      total: dancers.length,
      icon: UsersIcon,
      gradient: 'from-electric-500 to-electric-600',
      iconBg: 'bg-electric-500/15',
      iconColor: 'text-electric-400',
      href: '/dancers',
      trend: { value: '+12%', positive: true }
    },
    {
      name: 'VIP Booth',
      value: occupiedRooms,
      total: rooms.length,
      icon: BuildingStorefrontIcon,
      gradient: 'from-gold-500 to-gold-600',
      iconBg: 'bg-gold-500/15',
      iconColor: 'text-gold-500',
      href: '/vip',
      trend: { value: '85% occ.', positive: true }
    },
    {
      name: 'DJ Queue',
      value: queueLength,
      total: null,
      icon: MusicalNoteIcon,
      gradient: 'from-royal-500 to-royal-600',
      iconBg: 'bg-royal-500/15',
      iconColor: 'text-royal-400',
      href: '/queue',
      trend: { value: 'Live', positive: true, isLive: true }
    },
    {
      name: 'Today Revenue',
      value: todayRevenue || 0,
      isCurrency: true,
      total: null,
      icon: CurrencyDollarIcon,
      gradient: 'from-status-success to-emerald-600',
      iconBg: 'bg-status-success/15',
      iconColor: 'text-status-success',
      href: '/revenue',
      trend: { value: '+18%', positive: true }
    }
  ]

  const recentAlerts = [
    { 
      id: 1, 
      type: 'compliance', 
      message: 'License expiring in 3 days', 
      detail: 'Sarah M.',
      severity: 'warning',
      time: '5m ago'
    },
    { 
      id: 2, 
      type: 'revenue', 
      message: 'VIP Booth payment received', 
      detail: '$750',
      severity: 'success',
      time: '12m ago'
    },
    { 
      id: 3, 
      type: 'system', 
      message: 'VIP Booth 3 timer exceeded', 
      detail: '+15 min over',
      severity: 'info',
      time: '18m ago'
    },
    { 
      id: 4, 
      type: 'dancer', 
      message: 'New dancer checked in', 
      detail: 'Crystal R.',
      severity: 'success',
      time: '25m ago'
    }
  ]

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Compact Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Welcome back, <span className="text-gradient-gold">{user?.ownerName?.split(' ')[0] || 'Manager'}</span>
          </h1>
          <p className="text-sm text-text-tertiary">
            {user?.clubName || 'Your Club'} • {new Date().toLocaleDateString('en-US', { 
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link 
              key={stat.name} 
              to={stat.href}
              className="card-premium p-4 sm:p-5 group touch-target animate-fade-in-up"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                {/* Icon with Glow */}
                <div className="relative">
                  <div className={`
                    absolute inset-0 rounded-xl bg-gradient-to-br ${stat.gradient}
                    blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300
                  `} />
                  <div className={`
                    relative p-2.5 sm:p-3 rounded-xl ${stat.iconBg}
                    border border-white/[0.06] backdrop-blur-sm
                  `}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`} />
                  </div>
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
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-text-primary">
                    {stat.isCurrency ? (
                      <AnimatedNumber value={stat.value} prefix="$" />
                    ) : (
                      <AnimatedNumber value={stat.value} />
                    )}
                  </span>
                  {stat.total !== null && (
                    <span className="text-xs sm:text-sm text-text-tertiary font-mono">/ {stat.total}</span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-text-secondary flex items-center gap-1 group-hover:text-text-primary transition-colors">
                  {stat.name}
                  <ArrowUpRightIcon className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </p>
              </div>
            </Link>
          )
        })}
      </div>

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
          {/* Revenue Summary */}
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
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-text-tertiary">Monthly Goal</span>
                  <span className="text-gold-500 font-medium">
                    {Math.min(Math.round(((monthlyRevenue || 0) / 50000) * 100), 100)}%
                  </span>
                </div>
                <div className="h-1.5 sm:h-2 bg-midnight-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ 
                      width: `${Math.min(((monthlyRevenue || 0) / 50000) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #D4AF37, #B8960C)'
                    }}
                  >
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-text-muted">
                  ${((monthlyRevenue || 0)).toLocaleString()} of $50,000 goal
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-premium p-4 sm:p-5 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
            <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">Quick Actions</h3>
            
            <div className="space-y-2 sm:space-y-3">
              <Link 
                to="/dancers" 
                className="flex items-center gap-3 p-3 rounded-xl bg-electric-500/[0.06] border border-electric-500/15 hover:border-electric-500/30 hover:bg-electric-500/[0.10] transition-all duration-200 group touch-target"
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-electric-500/20">
                  <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-electric-400" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-electric-400">Add New Dancer</span>
                <ArrowUpRightIcon className="h-3.5 w-3.5 text-electric-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
              
              <Link 
                to="/vip" 
                className="flex items-center gap-3 p-3 rounded-xl bg-gold-500/[0.06] border border-gold-500/15 hover:border-gold-500/30 hover:bg-gold-500/[0.10] transition-all duration-200 group touch-target"
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-gold-500/20">
                  <BuildingStorefrontIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gold-500" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gold-500">Manage VIP Booths</span>
                <ArrowUpRightIcon className="h-3.5 w-3.5 text-gold-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
              
              <Link 
                to="/queue" 
                className="flex items-center gap-3 p-3 rounded-xl bg-royal-500/[0.06] border border-royal-500/15 hover:border-royal-500/30 hover:bg-royal-500/[0.10] transition-all duration-200 group touch-target"
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-royal-500/20">
                  <PlayIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-royal-400" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-royal-400">Open DJ Queue</span>
                <ArrowUpRightIcon className="h-3.5 w-3.5 text-royal-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard