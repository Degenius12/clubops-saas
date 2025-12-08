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
  UserIcon,
  XMarkIcon,
  EyeIcon,
  ShieldExclamationIcon
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

  // Helper to get dancer name (handles both API formats) - BULLETPROOF
  const getDancerName = (dancer: any): string => {
    try {
      const name = dancer?.legalName || dancer?.stageName || dancer?.name || dancer?.stage_name
      return name ? String(name) : 'Unknown'
    } catch {
      return 'Unknown'
    }
  }

  // Helper to get stage name - BULLETPROOF
  const getStageName = (dancer: any): string => {
    try {
      const name = dancer?.stageName || dancer?.stage_name
      return name ? String(name) : ''
    } catch {
      return ''
    }
  }

  // Helper to get dancer status - BULLETPROOF
  const getDancerStatus = (dancer: any): string => {
    try {
      if (dancer?.isActive === true) return 'active'
      if (dancer?.isActive === false) return 'inactive'
      return dancer?.status ? String(dancer.status) : 'inactive'
    } catch {
      return 'inactive'
    }
  }

  // Helper to get compliance/license status - BULLETPROOF
  const getComplianceStatus = (dancer: any): string => {
    try {
      const status = dancer?.licenseStatus || dancer?.complianceStatus || dancer?.compliance_status
      if (status === 'warning') return 'expiring'
      return status ? String(status) : 'unknown'
    } catch {
      return 'unknown'
    }
  }

  // Filter dancers based on search and status - BULLETPROOF
  const filteredDancers = (dancers || []).filter(dancer => {
    try {
      if (!dancer || typeof dancer !== 'object') return false
      
      const name = getDancerName(dancer)
      const stageName = getStageName(dancer)
      const email = dancer?.email ? String(dancer.email) : ''
      const status = getDancerStatus(dancer)
      
      const searchLower = (searchTerm || '').toLowerCase()
      const matchesSearch = 
        name.toLowerCase().includes(searchLower) ||
        stageName.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower)
      const matchesStatus = filterStatus === 'all' || status === filterStatus
      return matchesSearch && matchesStatus
    } catch (err) {
      console.error('Filter error for dancer:', dancer, err)
      return false
    }
  })

  // Calculate days until expiry
  const getDaysUntilExpiry = (dancer: any): number | null => {
    const expiryDate = dancer?.licenseExpiryDate || dancer?.license_expiry
    if (!expiryDate) return null
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Dancer Management</h1>
          <p className="text-sm text-text-tertiary mt-1">
            Manage profiles, compliance, and check-in status
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 touch-target"
        >
          <UserPlusIcon className="h-5 w-5" />
          <span>Add Dancer</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card-premium p-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-text-tertiary" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input w-full text-sm"
              placeholder="Search by name or email..."
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-premium appearance-none pl-4 pr-10 py-2.5 text-sm min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_break">On Break</option>
            </select>
            <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Dancers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredDancers.length === 0 ? (
        /* Empty State */
        <div className="card-premium p-12 text-center animate-fade-in">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-electric-500/20 rounded-full blur-2xl"></div>
            <div className="relative p-6 rounded-full bg-midnight-800 border border-white/5">
              <UserIcon className="h-12 w-12 text-text-tertiary" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No Dancers Found</h3>
          <p className="text-text-tertiary mb-6 max-w-sm mx-auto">
            {searchTerm || filterStatus !== 'all' 
              ? 'No dancers match your current filters.' 
              : 'Start by adding your first dancer to the system.'
            }
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary touch-target"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add First Dancer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDancers.map((dancer, index) => {
            const dancerName = getDancerName(dancer)
            const stageName = getStageName(dancer)
            const dancerStatus = getDancerStatus(dancer)
            const complianceStatus = getComplianceStatus(dancer)
            const daysUntilExpiry = getDaysUntilExpiry(dancer)
            const isExpired = complianceStatus === 'expired'
            const isExpiring = complianceStatus === 'expiring' || complianceStatus === 'warning'
            
            return (
              <div 
                key={dancer.id} 
                className={`
                  card-premium p-5 transition-all duration-200 animate-fade-in-up
                  ${isExpired ? 'compliance-expired border-status-danger/30' : ''}
                  ${isExpiring ? 'compliance-warning border-status-warning/30' : ''}
                `}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Dancer Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-midnight-900 font-semibold text-sm">
                          {(() => {
                            try {
                              return dancerName.split(' ').map(n => (n && n[0]) || '').join('').toUpperCase().slice(0, 2) || '??'
                            } catch { return '??' }
                          })()}
                        </span>
                      </div>
                      {/* Status indicator dot */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-midnight-800 ${
                        dancerStatus === 'active' ? 'bg-status-success' : 
                        dancerStatus === 'on_break' ? 'bg-status-warning' : 'bg-text-tertiary'
                      }`}></div>
                    </div>
                    
                    <div className="min-w-0">
                      <h3 className="font-semibold text-text-primary truncate">
                        {stageName || dancerName}
                      </h3>
                      {stageName && (
                        <p className="text-xs text-text-tertiary truncate">{dancerName}</p>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`badge text-xs ${
                    dancerStatus === 'active' ? 'badge-success' : 
                    dancerStatus === 'on_break' ? 'badge-warning' : 'badge-info'
                  }`}>
                    {dancerStatus.replace('_', ' ')}
                  </span>
                </div>

                {/* Compliance Status */}
                <div className={`
                  p-3 rounded-xl mb-4
                  ${complianceStatus === 'valid' ? 'bg-status-success-muted border border-status-success-border' : ''}
                  ${isExpiring ? 'bg-status-warning-muted border border-status-warning-border' : ''}
                  ${isExpired ? 'bg-status-danger-muted border border-status-danger-border' : ''}
                  ${!['valid', 'expiring', 'warning', 'expired'].includes(complianceStatus) ? 'bg-midnight-800 border border-white/5' : ''}
                `}>
                  <div className="flex items-center gap-2">
                    {complianceStatus === 'valid' && <CheckCircleIcon className="h-4 w-4 text-status-success flex-shrink-0" />}
                    {isExpiring && <ClockIcon className="h-4 w-4 text-status-warning flex-shrink-0" />}
                    {isExpired && <ShieldExclamationIcon className="h-4 w-4 text-status-danger flex-shrink-0" />}
                    
                    <span className={`text-xs font-medium ${
                      complianceStatus === 'valid' ? 'text-status-success' :
                      isExpiring ? 'text-status-warning' :
                      isExpired ? 'text-status-danger' : 'text-text-tertiary'
                    }`}>
                      {complianceStatus === 'valid' && 'All documents valid'}
                      {isExpiring && `Expires in ${daysUntilExpiry || '?'} days`}
                      {isExpired && 'Action required'}
                      {!['valid', 'expiring', 'warning', 'expired'].includes(complianceStatus) && 'Status unknown'}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-midnight-800/50">
                    <p className="text-xs text-text-tertiary mb-0.5">Bar Fee</p>
                    <p className={`text-sm font-medium ${dancer.bar_fee_paid ? 'text-status-success' : 'text-status-danger'}`}>
                      {dancer.bar_fee_paid ? '✓ Paid' : '✗ Unpaid'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-midnight-800/50">
                    <p className="text-xs text-text-tertiary mb-0.5">Contract</p>
                    <p className={`text-sm font-medium ${dancer.contract_signed ? 'text-status-success' : 'text-status-warning'}`}>
                      {dancer.contract_signed ? '✓ Signed' : '○ Pending'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 btn-secondary py-2 text-sm touch-target">
                    <EyeIcon className="h-4 w-4 mr-1.5" />
                    View
                  </button>
                  
                  {(isExpiring || isExpired) && (
                    <button className="flex-1 py-2 text-sm font-medium rounded-xl bg-status-danger-muted border border-status-danger-border text-status-danger hover:bg-status-danger/20 transition-colors touch-target">
                      Fix Issues
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary Stats */}
      <div className="card-premium p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-status-success-muted border border-status-success-border">
            <div className="text-2xl font-bold font-mono text-status-success tabular-nums">
              {(dancers || []).filter(d => getDancerStatus(d) === 'active').length}
            </div>
            <div className="text-xs text-status-success mt-1">Active Now</div>
          </div>
          
          <div className="text-center p-4 rounded-xl bg-status-warning-muted border border-status-warning-border">
            <div className="text-2xl font-bold font-mono text-status-warning tabular-nums">
              {(dancers || []).filter(d => ['expiring', 'warning'].includes(getComplianceStatus(d))).length}
            </div>
            <div className="text-xs text-status-warning mt-1">Expiring Soon</div>
          </div>
          
          <div className="text-center p-4 rounded-xl bg-status-danger-muted border border-status-danger-border">
            <div className="text-2xl font-bold font-mono text-status-danger tabular-nums">
              {(dancers || []).filter(d => getComplianceStatus(d) === 'expired').length}
            </div>
            <div className="text-xs text-status-danger mt-1">Non-Compliant</div>
          </div>
          
          <div className="text-center p-4 rounded-xl bg-electric-500/10 border border-electric-500/20">
            <div className="text-2xl font-bold font-mono text-electric-400 tabular-nums">
              {(dancers || []).length}
            </div>
            <div className="text-xs text-electric-400 mt-1">Total Dancers</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DancerManagement
