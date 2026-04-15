import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../../store/store'
import { logout } from '../../store/slices/authSlice'
import apiClient from '../../config/api'
import {
  HomeIcon,
  UsersIcon,
  MusicalNoteIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  BanknotesIcon,
  CogIcon,
  ChartBarIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentChartBarIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeShift, setActiveShift] = useState<any>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)

  // Role-based navigation - filter based on user role
  const userRole = user?.role?.toUpperCase() || 'MANAGER'

  // Check if user can manage shifts
  const canManageShifts = ['MANAGER', 'SUPER_MANAGER', 'OWNER'].includes(userRole)

  // Fetch active shift status
  useEffect(() => {
    const fetchShiftStatus = async () => {
      if (!canManageShifts) return

      try {
        const response = await apiClient.get('/api/shift-management/status')
        if (response.data.hasActiveShift) {
          setActiveShift(response.data)
        } else {
          setActiveShift(null)
        }
      } catch (error) {
        console.error('Failed to fetch shift status:', error)
      }
    }

    fetchShiftStatus()

    // Poll every 30 seconds for shift status updates
    const interval = setInterval(fetchShiftStatus, 30000)

    return () => clearInterval(interval)
  }, [canManageShifts])

  const allNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER', 'DJ', 'VIP_HOST', 'DOOR_STAFF', 'BARTENDER'] },
    { name: 'Entertainers', href: '/dancers', icon: UsersIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER'] },
    { name: 'Door Staff', href: '/door-staff', icon: ArrowRightOnRectangleIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER', 'DOOR_STAFF'] },
    { name: 'DJ Queue', href: '/queue', icon: MusicalNoteIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER', 'DJ'] },
    { name: 'VIP Booths', href: '/vip', icon: BuildingStorefrontIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER', 'VIP_HOST'] },
    { name: 'Revenue', href: '/revenue', icon: CurrencyDollarIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER'] },
    { name: 'Monthly Report', href: '/revenue/monthly', icon: DocumentChartBarIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER'] },
    { name: 'Fees', href: '/fees', icon: BanknotesIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER'] },
    { name: 'Late Fees', href: '/fees/late', icon: ClockIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER'] },
    { name: 'Discrepancies', href: '/discrepancy', icon: ExclamationTriangleIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER'] },
    { name: 'Schedule', href: '/schedule', icon: CalendarIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER'] },
    { name: 'Shift Scheduling', href: '/shift-scheduling', icon: CalendarIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER'] },
    { name: 'Shift Swaps', href: '/shift-swaps', icon: UserIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER'] },
    { name: 'Compliance', href: '/compliance', icon: DocumentTextIcon, roles: ['OWNER', 'SUPER_MANAGER', 'MANAGER'] },
    { name: 'Security', href: '/security', icon: ShieldCheckIcon, roles: ['OWNER', 'SUPER_MANAGER'] },
  ]

  const allSaasNavigation = [
    { name: 'Subscription', href: '/subscription', icon: CreditCardIcon, roles: ['OWNER'] },
    { name: 'Billing', href: '/billing', icon: ChartBarIcon, roles: ['OWNER'] },
    { name: 'Admin', href: '/admin', icon: CogIcon, roles: ['OWNER', 'SUPER_MANAGER'] },
  ]

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => item.roles.includes(userRole))
  const saasNavigation = allSaasNavigation.filter(item => item.roles.includes(userRole))

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const isCurrentPath = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-midnight-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-midnight-900
          border-r border-white/[0.06]
          transform transition-all duration-300 ease-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}
        `}
      >
        {/* Logo Section */}
        <div className={`
          flex items-center h-16 border-b border-white/[0.06]
          ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-5'}
        `}>
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gradient-gold tracking-tight">
              ClubOps
            </h1>
          )}
          {sidebarCollapsed && (
            <div className="w-9 h-9 rounded-lg bg-gold-500 border border-gold-400/20 flex items-center justify-center">
              <span className="text-midnight-900 font-bold text-sm">CO</span>
            </div>
          )}
          
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/[0.05] transition-colors touch-target"
          >
            <XMarkIcon className="h-5 w-5 text-text-secondary" />
          </button>
          
          {/* Desktop collapse button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`
              hidden lg:flex items-center justify-center w-7 h-7 rounded-md
              bg-midnight-800 border border-white/[0.08] hover:bg-midnight-700
              transition-all duration-200 hover:border-gold-500/30
              ${sidebarCollapsed ? 'absolute -right-3.5 top-5' : ''}
            `}
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 text-text-secondary" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4 text-text-secondary" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <p className="nav-section-label mb-2">Club Management</p>
            )}
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = isCurrentPath(item.href)
              // Add data-tour attributes for onboarding
              const tourAttr = item.name === 'Entertainers' ? 'dancer-nav' :
                               item.name === 'VIP Booths' ? 'vip-nav' :
                               item.name === 'Security' ? 'security-nav' : undefined
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  data-tour={tourAttr}
                  className={`
                    group flex items-center rounded-xl transition-all duration-200 touch-target
                    ${sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                    ${isActive
                      ? 'bg-gold-500/[0.08] text-gold-500 border-l-2 border-gold-500'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-gold-500' : ''}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="ml-3 text-sm font-medium">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse" />
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>

          {/* SaaS Navigation */}
          <div className="mt-8 space-y-1">
            {!sidebarCollapsed && (
              <p className="nav-section-label mb-2">Platform</p>
            )}
            {saasNavigation.map((item) => {
              const Icon = item.icon
              const isActive = isCurrentPath(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`
                    group flex items-center rounded-xl transition-all duration-200 touch-target
                    ${sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                    ${isActive
                      ? 'bg-royal-500/[0.08] text-royal-400 border-l-2 border-royal-500'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-royal-400' : ''}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="ml-3 text-sm font-medium">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-royal-500 rounded-full animate-pulse" />
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Settings */}
          <div className="mt-8 pt-4 border-t border-white/[0.06]">
            <Link
              to="/settings"
              title={sidebarCollapsed ? 'Settings' : undefined}
              className={`
                group flex items-center rounded-xl transition-all duration-200 touch-target
                ${sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                ${isCurrentPath('/settings')
                  ? 'bg-electric-500/[0.08] text-electric-400 border-l-2 border-electric-500'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                }
              `}
            >
              <CogIcon className={`h-5 w-5 flex-shrink-0 ${isCurrentPath('/settings') ? 'text-electric-400' : ''}`} />
              {!sidebarCollapsed && (
                <span className="ml-3 text-sm font-medium">Settings</span>
              )}
            </Link>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className={`
          border-t border-white/[0.06] p-3
          ${sidebarCollapsed ? 'flex justify-center' : ''}
        `}>
          {sidebarCollapsed ? (
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/20
                         flex items-center justify-center hover:bg-gold-500/25
                         transition-all duration-200 touch-target"
              title="Logout"
            >
              <UserCircleIcon className="h-5 w-5 text-gold-500" />
            </button>
          ) : (
            <div className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
              <div className="w-9 h-9 rounded-xl bg-gold-500 border border-gold-400/20
                            flex items-center justify-center flex-shrink-0">
                <UserCircleIcon className="h-5 w-5 text-midnight-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName || user?.email || 'User'}
                </p>
                <p className="text-xs text-text-tertiary truncate">
                  {user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase().replace('_', ' ') : 'User'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-text-tertiary hover:text-text-primary 
                         hover:bg-white/[0.05] rounded-lg transition-all duration-200 touch-target"
                title="Logout"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6
                         bg-midnight-900/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/[0.05] transition-colors touch-target"
            >
              <Bars3Icon className="h-5 w-5 text-text-secondary" />
            </button>

            {/* Active Shift Indicator */}
            {activeShift && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-success/[0.08] border border-status-success/20 animate-fade-in">
                <div className="relative">
                  <ClockIcon className="h-4 w-4 text-status-success" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-status-success rounded-full animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-status-success">Shift Level {activeShift.activeShiftLevel}</span>
                  <span className="text-[10px] text-text-tertiary">{activeShift.activeShiftName}</span>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-text-tertiary" />
              </div>
              <input
                type="text"
                className="w-64 lg:w-80 pl-10 pr-4 py-2 rounded-xl text-sm
                         bg-midnight-800/50 border border-white/[0.06]
                         text-text-primary placeholder-text-tertiary
                         focus:outline-none focus:border-gold-500/30 focus:ring-1 focus:ring-gold-500/20
                         transition-all duration-200"
                placeholder="Search entertainers, booths..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile search button */}
            <button className="sm:hidden p-2 rounded-lg hover:bg-white/[0.05] transition-colors touch-target">
              <MagnifyingGlassIcon className="h-5 w-5 text-text-secondary" />
            </button>
            
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-white/[0.05] transition-colors touch-target">
              <BellIcon className="h-5 w-5 text-text-secondary" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-danger rounded-full 
                             ring-2 ring-midnight-900" />
            </button>

            {/* User avatar (desktop) */}
            <div className="hidden lg:flex w-9 h-9 rounded-xl bg-gold-500 border border-gold-400/20
                          items-center justify-center cursor-pointer hover:bg-gold-400
                          transition-colors duration-200">
              <span className="text-midnight-900 font-semibold text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
