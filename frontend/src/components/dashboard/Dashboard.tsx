import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import { fetchDancers } from '../../store/slices/dancerSlice'
import { fetchVIPRooms } from '../../store/slices/vipSlice'
import { fetchRevenue } from '../../store/slices/revenueSlice'
import {
  UsersIcon,
  MusicalNoteIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { dancers } = useSelector((state: RootState) => state.dancers)
  const { rooms } = useSelector((state: RootState) => state.vip)
  const { currentQueue } = useSelector((state: RootState) => state.queue)
  const { todayRevenue, monthlyRevenue } = useSelector((state: RootState) => state.revenue)
  const { user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // Fetch dashboard data
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
      color: 'accent-blue',
      trend: { value: '+12%', positive: true }
    },
    {
      name: 'VIP Rooms',
      value: occupiedRooms,
      total: rooms.length,
      icon: BuildingStorefrontIcon,
      color: 'accent-gold',
      trend: { value: '85%', positive: true }
    },
    {
      name: 'DJ Queue',
      value: queueLength,
      total: '∞',
      icon: MusicalNoteIcon,
      color: 'accent-red',
      trend: { value: 'Live', positive: true }
    },
    {
      name: 'Today Revenue',
      value: `$${todayRevenue?.toLocaleString() || 0}`,
      total: null,
      icon: CurrencyDollarIcon,
      color: 'accent-green',
      trend: { value: '+18%', positive: true }
    }
  ]

  const recentAlerts = [
    { 
      id: 1, 
      type: 'compliance', 
      message: 'License expiring in 3 days for Sarah M.', 
      severity: 'warning',
      time: '5 minutes ago'
    },
    { 
      id: 2, 
      type: 'revenue', 
      message: 'New payment received: $750', 
      severity: 'success',
      time: '12 minutes ago'
    },
    { 
      id: 3, 
      type: 'system', 
      message: 'VIP Room 3 timer exceeded', 
      severity: 'info',
      time: '18 minutes ago'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-accent-blue/20 via-accent-gold/20 to-accent-red/20 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.ownerName || 'Manager'}! 👋
            </h1>
            <p className="text-gray-300">
              {user?.clubName || 'Your Club'} • {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-accent-gold">
              {complianceIssues === 0 ? '✅' : '⚠️'}
            </div>
            <p className="text-sm text-gray-400">
              {complianceIssues === 0 ? 'All Clear' : `${complianceIssues} Issues`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.name} 
              className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-accent-blue/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}/20 rounded-lg`}>
                  <Icon className={`h-6 w-6 text-${stat.color}`} />
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.trend.positive 
                    ? 'bg-green-900/30 text-green-400' 
                    : 'bg-red-900/30 text-red-400'
                }`}>
                  {stat.trend.value}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">{stat.name}</h3>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  {stat.total && (
                    <p className="text-sm text-gray-500">/ {stat.total}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
            
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="flex items-start space-x-4 p-4 bg-dark-bg/50 rounded-lg border border-white/5 hover:border-white/20 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${
                    alert.severity === 'warning' ? 'bg-yellow-900/30' :
                    alert.severity === 'success' ? 'bg-green-900/30' :
                    'bg-blue-900/30'
                  }`}>
                    {alert.severity === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />}
                    {alert.severity === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-400" />}
                    {alert.severity === 'info' && <ClockIcon className="h-5 w-5 text-blue-400" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{alert.message}</p>
                    <p className="text-gray-400 text-sm mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10">
              <button className="text-accent-blue hover:text-accent-gold transition-colors text-sm font-medium">
                View all activity →
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">This Month</span>
                <span className="text-white font-medium">${monthlyRevenue?.toLocaleString() || 0}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Avg. per Day</span>
                <span className="text-white font-medium">
                  ${Math.round((monthlyRevenue || 0) / new Date().getDate()).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Dancers</span>
                <span className="text-white font-medium">{dancers.length}</span>
              </div>
              
              <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-accent-blue to-accent-gold transition-all duration-500"
                  style={{ width: `${Math.min((activeDancers / dancers.length) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full p-3 bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/30 rounded-lg text-accent-blue font-medium transition-all duration-200 hover:scale-105">
                Add New Dancer
              </button>
              
              <button className="w-full p-3 bg-accent-gold/20 hover:bg-accent-gold/30 border border-accent-gold/30 rounded-lg text-accent-gold font-medium transition-all duration-200 hover:scale-105">
                Manage VIP Rooms
              </button>
              
              <button className="w-full p-3 bg-accent-red/20 hover:bg-accent-red/30 border border-accent-red/30 rounded-lg text-accent-red font-medium transition-all duration-200 hover:scale-105">
                View DJ Queue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard