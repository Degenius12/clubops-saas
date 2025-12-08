import React, { useEffect } from 'react'
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
  SparklesIcon
} from '@heroicons/react/24/outline'

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
      iconBg: 'from-electric-500/20 to-electric-600/10',
      iconColor: 'text-electric-400',
      href: '/dancers',
      trend: { value: '+12%', positive: true }
    },
    {
      name: 'VIP Rooms',
      value: occupiedRooms,
      total: rooms.length,
      icon: BuildingStorefrontIcon,
      iconBg: 'from-gold-500/20 to-gold-600/10',
      iconColor: 'text-gold-500',
      href: '/vip',
      trend: { value: '85% occ.', positive: true }
    },
    {
      name: 'DJ Queue',
      value: queueLength,
      total: null,
      icon: MusicalNoteIcon,
      iconBg: 'from-royal-500/20 to-royal-600/10',
      iconColor: 'text-royal-400',
      href: '/queue',
      trend: { value: 'Live', positive: true }
    },
    {
      name: 'Today Revenue',
      value: todayRevenue || 0,
      isCurrency: true,
      total: null,
      icon: CurrencyDollarIcon,
      iconBg: 'from-status-success/20 to-status-success/10',
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
      message: 'VIP Room payment received', 
      detail: '$750',
      severity: 'success',
      time: '12m ago'
    },
    { 
      id: 3, 
      type: 'system', 
      message: 'VIP Room 3 timer exceeded', 
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
          bg: 'bg-status-warning-muted',
          border: 'border-status-warning-border',
          icon: 'text-status-warning',
          IconComponent: ExclamationTriangleIcon
        }
      case 'success':
        return {
          bg: 'bg-status-success-muted',
          border: 'border-status-success-border',
          icon: 'text-status-success',
          IconComponent: CheckCircleIcon
        }
      default:
        return {
          bg: 'bg-status-info-muted',
          border: 'border-status-info-border',
          icon: 'text-status-info',
          IconComponent: ClockIcon
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Compact Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Welcome back, {user?.ownerName?.split(' ')[0] || 'Manager'}
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            {user?.clubName || 'Your Club'} • {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        {/* Compliance Status Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
          complianceIssues === 0 
            ? 'bg-status-success-muted border border-status-success-border' 
            : 'bg-status-warning-muted border border-status-warning-border animate-pulse'
        }`}>
          {complianceIssues === 0 ? (
            <>
              <CheckCircleIcon className="h-5 w-5 text-status-success" />
              <span className="text-sm font-medium text-status-success">All Compliant</span>
            </>
          ) : (
            <>
              <ExclamationTriangleIcon className="h-5 w-5 text-status-warning" />
              <span className="text-sm font-medium text-status-warning">{complianceIssues} Issues</span>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link 
              key={stat.name} 
              to={stat.href}
              className="card-stat group animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Icon with Glow */}
              <div className="flex items-start justify-between mb-4">
                <div className={`relative p-3 rounded-xl bg-gradient-to-br ${stat.iconBg}`}>
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-xl ${stat.iconBg} blur-xl opacity-50`}></div>
                  <Icon className={`relative h-5 w-5 ${stat.iconColor}`} />
                </div>
                
                {/* Trend Badge */}
                <span className={`stat-change-${stat.trend.positive ? 'positive' : 'negative'}`}>
                  {stat.trend.value}
                </span>
              </div>
              
              {/* Value */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="stat-value">
                    {stat.isCurrency ? `$${stat.value.toLocaleString()}` : stat.value}
                  </span>
                  {stat.total && (
                    <span className="text-sm text-text-tertiary">/ {stat.total}</span>
                  )}
                </div>
                <p className="stat-label flex items-center gap-1">
                  {stat.name}
                  <ArrowUpRightIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card-premium p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2>
            <button className="text-sm text-text-tertiary hover:text-gold-500 transition-colors">
              View all
            </button>
          </div>
          
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => {
              const styles = getSeverityStyles(alert.severity)
              const AlertIcon = styles.IconComponent
              return (
                <div 
                  key={alert.id} 
                  className={`
                    flex items-center gap-4 p-4 rounded-xl
                    ${styles.bg} border ${styles.border}
                    hover:scale-[1.01] transition-all duration-200
                    animate-fade-in
                  `}
                  style={{ animationDelay: `${300 + index * 50}ms` }}
                >
                  <div className={`p-2 rounded-lg ${styles.bg}`}>
                    <AlertIcon className={`h-5 w-5 ${styles.icon}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{alert.message}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{alert.detail}</p>
                  </div>
                  
                  <span className="text-xs text-text-tertiary whitespace-nowrap">{alert.time}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Revenue Summary */}
          <div className="card-premium p-6 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="h-5 w-5 text-gold-500" />
              <h3 className="text-lg font-semibold text-text-primary">Revenue</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-text-secondary">This Month</span>
                <span className="text-2xl font-bold font-mono text-text-primary tabular-nums">
                  ${(monthlyRevenue || 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-tertiary">Daily Average</span>
                <span className="text-text-secondary font-mono tabular-nums">
                  ${Math.round((monthlyRevenue || 0) / Math.max(new Date().getDate(), 1)).toLocaleString()}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-tertiary">Monthly Goal</span>
                  <span className="text-text-secondary">{Math.min(Math.round(((monthlyRevenue || 0) / 50000) * 100), 100)}%</span>
                </div>
                <div className="h-2 bg-midnight-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gold-500 to-gold-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(((monthlyRevenue || 0) / 50000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-premium p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <Link 
                to="/dancers" 
                className="flex items-center gap-3 p-3 rounded-xl bg-electric-500/10 border border-electric-500/20 hover:border-electric-500/40 hover:bg-electric-500/15 transition-all duration-200 group touch-target"
              >
                <div className="p-2 rounded-lg bg-electric-500/20">
                  <PlusIcon className="h-4 w-4 text-electric-400" />
                </div>
                <span className="text-sm font-medium text-electric-400">Add New Dancer</span>
                <ArrowUpRightIcon className="h-4 w-4 text-electric-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link 
                to="/vip" 
                className="flex items-center gap-3 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 hover:border-gold-500/40 hover:bg-gold-500/15 transition-all duration-200 group touch-target"
              >
                <div className="p-2 rounded-lg bg-gold-500/20">
                  <BuildingStorefrontIcon className="h-4 w-4 text-gold-500" />
                </div>
                <span className="text-sm font-medium text-gold-500">Manage VIP Rooms</span>
                <ArrowUpRightIcon className="h-4 w-4 text-gold-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link 
                to="/queue" 
                className="flex items-center gap-3 p-3 rounded-xl bg-royal-500/10 border border-royal-500/20 hover:border-royal-500/40 hover:bg-royal-500/15 transition-all duration-200 group touch-target"
              >
                <div className="p-2 rounded-lg bg-royal-500/20">
                  <PlayIcon className="h-4 w-4 text-royal-400" />
                </div>
                <span className="text-sm font-medium text-royal-400">Open DJ Queue</span>
                <ArrowUpRightIcon className="h-4 w-4 text-royal-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
