import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import {
  BuildingStorefrontIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showClubModal, setShowClubModal] = useState(false)
  const [selectedClub, setSelectedClub] = useState<any>(null)

  // Mock data for admin dashboard
  const platformStats = {
    totalClubs: 47,
    activeClubs: 42,
    totalRevenue: 127500,
    monthlyGrowth: 18.5,
    totalDancers: 1247,
    activeDancers: 986
  }

  const mockClubs = [
    {
      id: 1,
      name: 'Platinum Lounge',
      owner: 'John Smith',
      email: 'john@platinum.com',
      plan: 'Pro',
      status: 'active',
      dancers: 28,
      revenue: 12500,
      lastActivity: '2024-01-20',
      joinDate: '2023-06-15'
    },
    {
      id: 2,
      name: 'Diamond Club',
      owner: 'Sarah Wilson',
      email: 'sarah@diamond.com',
      plan: 'Enterprise',
      status: 'active',
      dancers: 45,
      revenue: 23400,
      lastActivity: '2024-01-19',
      joinDate: '2023-03-22'
    },
    {
      id: 3,
      name: 'VIP Nights',
      owner: 'Mike Johnson',
      email: 'mike@vipnights.com',
      plan: 'Basic',
      status: 'inactive',
      dancers: 12,
      revenue: 3200,
      lastActivity: '2024-01-10',
      joinDate: '2023-11-08'
    }
  ]

  const systemAlerts = [
    { id: 1, type: 'warning', message: 'High server load detected', time: '5 min ago', severity: 'medium' },
    { id: 2, type: 'success', message: 'Database backup completed', time: '15 min ago', severity: 'low' },
    { id: 3, type: 'error', message: 'Payment gateway timeout for Club XYZ', time: '32 min ago', severity: 'high' }
  ]

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'clubs', name: 'Clubs', icon: BuildingStorefrontIcon },
    { id: 'users', name: 'Users', icon: UsersIcon },
    { id: 'system', name: 'System', icon: Cog6ToothIcon }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/30'
      case 'inactive': return 'text-red-400 bg-red-900/30'
      case 'suspended': return 'text-yellow-400 bg-yellow-900/30'
      default: return 'text-gray-400 bg-gray-900/30'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Enterprise': return 'text-accent-red'
      case 'Pro': return 'text-accent-gold'
      case 'Basic': return 'text-accent-blue'
      case 'Free': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-900/20 border-red-500/30 text-red-300'
      case 'warning': return 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
      case 'success': return 'bg-green-900/20 border-green-500/30 text-green-300'
      default: return 'bg-blue-900/20 border-blue-500/30 text-blue-300'
    }
  }

  const viewClubDetails = (club: any) => {
    setSelectedClub(club)
    setShowClubModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Manage platform operations and monitor system health
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">System Status</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-400 text-sm font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl">
        <div className="flex space-x-1 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  selectedTab === tab.id
                    ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-accent-blue/20 rounded-lg">
                  <BuildingStorefrontIcon className="h-6 w-6 text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Total Clubs</h3>
                  <p className="text-2xl font-bold text-white">{platformStats.totalClubs}</p>
                  <p className="text-xs text-green-400">+5 this month</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-accent-gold/20 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-accent-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Total Dancers</h3>
                  <p className="text-2xl font-bold text-white">{platformStats.totalDancers}</p>
                  <p className="text-xs text-green-400">+{platformStats.activeDancers} active</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-accent-red/20 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-accent-red" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Platform Revenue</h3>
                  <p className="text-2xl font-bold text-white">${platformStats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-green-400">+{platformStats.monthlyGrowth}% MoM</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Active Clubs</h3>
                  <p className="text-2xl font-bold text-white">{platformStats.activeClubs}</p>
                  <p className="text-xs text-gray-400">{(platformStats.activeClubs/platformStats.totalClubs*100).toFixed(1)}% uptime</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">System Alerts</h2>
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {alert.type === 'error' && <ExclamationTriangleIcon className="h-5 w-5" />}
                      {alert.type === 'warning' && <ClockIcon className="h-5 w-5" />}
                      {alert.type === 'success' && <CheckCircleIcon className="h-5 w-5" />}
                      <span className="font-medium">{alert.message}</span>
                    </div>
                    <span className="text-xs opacity-70">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clubs Tab */}
      {selectedTab === 'clubs' && (
        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Club Management</h2>
            <button className="bg-accent-blue hover:bg-accent-gold text-white font-medium px-4 py-2 rounded-lg transition-colors">
              Export Data
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Club</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Owner</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Plan</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Dancers</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Revenue</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockClubs.map((club) => (
                  <tr key={club.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{club.name}</p>
                        <p className="text-gray-400 text-sm">Joined {new Date(club.joinDate).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white">{club.owner}</p>
                        <p className="text-gray-400 text-sm">{club.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-medium ${getPlanColor(club.plan)}`}>{club.plan}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(club.status)}`}>
                        {club.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white">{club.dancers}</td>
                    <td className="py-4 px-4 text-white">${club.revenue.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewClubDetails(club)}
                          className="p-2 text-accent-blue hover:text-accent-gold transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          title="Suspend"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">User Management</h2>
          <div className="text-center py-12">
            <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">User Management</h3>
            <p className="text-gray-400">Advanced user management features coming soon</p>
          </div>
        </div>
      )}

      {/* System Tab */}
      {selectedTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">System Health</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Server Uptime</h4>
                <p className="text-2xl font-bold text-green-400">99.9%</p>
                <p className="text-xs text-gray-400 mt-1">30 days average</p>
              </div>
              
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Database Load</h4>
                <p className="text-2xl font-bold text-yellow-400">73%</p>
                <p className="text-xs text-gray-400 mt-1">Current usage</p>
              </div>
              
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Active Sessions</h4>
                <p className="text-2xl font-bold text-accent-blue">247</p>
                <p className="text-xs text-gray-400 mt-1">Concurrent users</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Club Details Modal */}
      {showClubModal && selectedClub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-white/20 rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{selectedClub.name} - Details</h3>
              <button
                onClick={() => setShowClubModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Owner</label>
                  <p className="text-white">{selectedClub.owner}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <p className="text-white">{selectedClub.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Plan</label>
                  <p className={`font-medium ${getPlanColor(selectedClub.plan)}`}>{selectedClub.plan}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedClub.status)}`}>
                    {selectedClub.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Dancers</label>
                  <p className="text-white">{selectedClub.dancers} total</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Monthly Revenue</label>
                  <p className="text-white">${selectedClub.revenue.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Last Activity</label>
                  <p className="text-white">{new Date(selectedClub.lastActivity).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Join Date</label>
                  <p className="text-white">{new Date(selectedClub.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowClubModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Close
              </button>
              <button className="flex-1 bg-accent-red hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors">
                Suspend Club
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard