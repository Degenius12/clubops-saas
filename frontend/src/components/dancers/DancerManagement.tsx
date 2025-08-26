import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import { fetchDancers, addDancer, updateDancer } from '../../store/slices/dancerSlice'
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'

const DancerManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { dancers, loading, error } = useSelector((state: RootState) => state.dancers)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  
  useEffect(() => {
    dispatch(fetchDancers())
  }, [dispatch])

  // Filter dancers based on search and status
  const filteredDancers = dancers.filter(dancer => {
    const matchesSearch = dancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dancer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || dancer.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-400 bg-green-900/30 border-green-500/50'
      case 'expiring': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50'
      case 'expired': return 'text-red-400 bg-red-900/30 border-red-500/50'
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500/50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/30'
      case 'inactive': return 'text-gray-400 bg-gray-900/30'
      case 'on_break': return 'text-yellow-400 bg-yellow-900/30'
      default: return 'text-gray-400 bg-gray-900/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dancer Management</h1>
          <p className="text-gray-400 mt-1">
            Manage dancer profiles, compliance, and check-in status
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-accent-blue to-accent-gold hover:from-accent-gold hover:to-accent-blue text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
        >
          <UserPlusIcon className="h-5 w-5" />
          <span>Add New Dancer</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-dark-bg/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
              placeholder="Search dancers by name or email..."
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-dark-bg/50 border border-white/10 rounded-lg text-white px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_break">On Break</option>
            </select>
            <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Dancers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredDancers.length === 0 ? (
        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Dancers Found</h3>
          <p className="text-gray-400 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'No dancers match your current filters.' 
              : 'Start by adding your first dancer to the system.'
            }
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-accent-blue hover:bg-accent-gold text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Add First Dancer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDancers.map((dancer) => (
            <div 
              key={dancer.id} 
              className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-accent-blue/30 transition-all duration-300"
            >
              {/* Dancer Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-accent-blue to-accent-gold rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {dancer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{dancer.name}</h3>
                    <p className="text-gray-400 text-sm">{dancer.stage_name}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dancer.status)}`}>
                  {dancer.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              {/* Compliance Status */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Compliance Status</span>
                  {dancer.complianceStatus === 'valid' && <CheckCircleIcon className="h-4 w-4 text-green-400" />}
                  {dancer.complianceStatus === 'expiring' && <ClockIcon className="h-4 w-4 text-yellow-400" />}
                  {dancer.complianceStatus === 'expired' && <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />}
                </div>
                
                <div className={`px-3 py-2 rounded-lg border text-xs font-medium ${getComplianceColor(dancer.complianceStatus)}`}>
                  {dancer.complianceStatus === 'valid' && 'All documents valid'}
                  {dancer.complianceStatus === 'expiring' && `License expires in ${dancer.daysUntilExpiry} days`}
                  {dancer.complianceStatus === 'expired' && 'Documents expired - Action required'}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-400">Check-ins Today</p>
                  <p className="text-white font-medium">{dancer.todayCheckIns || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400">Total Earnings</p>
                  <p className="text-white font-medium">${dancer.totalEarnings?.toLocaleString() || 0}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button className="flex-1 bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/30 text-accent-blue font-medium py-2 px-3 rounded-lg transition-colors text-sm">
                  View Profile
                </button>
                
                {dancer.complianceStatus !== 'valid' && (
                  <button className="flex-1 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 text-red-300 font-medium py-2 px-3 rounded-lg transition-colors text-sm">
                    Fix Compliance
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {dancers.filter(d => d.status === 'active').length}
            </div>
            <div className="text-sm text-gray-400">Active Now</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {dancers.filter(d => d.complianceStatus === 'expiring').length}
            </div>
            <div className="text-sm text-gray-400">Expiring Soon</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {dancers.filter(d => d.complianceStatus === 'expired').length}
            </div>
            <div className="text-sm text-gray-400">Non-Compliant</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-blue">
              {dancers.length}
            </div>
            <div className="text-sm text-gray-400">Total Dancers</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DancerManagement