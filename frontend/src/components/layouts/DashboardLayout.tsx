import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../../store/store'
import { logout } from '../../store/slices/authSlice'
import {
  HomeIcon,
  UsersIcon,
  MusicalNoteIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  CogIcon,
  ChartBarIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Dancers', href: '/dancers', icon: UsersIcon },
    { name: 'DJ Queue', href: '/queue', icon: MusicalNoteIcon },
    { name: 'VIP Rooms', href: '/vip', icon: BuildingStorefrontIcon },
    { name: 'Revenue', href: '/revenue', icon: CurrencyDollarIcon },
  ]

  const saasNavigation = [
    { name: 'Subscription', href: '/subscription', icon: CreditCardIcon },
    { name: 'Billing', href: '/billing', icon: ChartBarIcon },
    { name: 'Admin', href: '/admin', icon: CogIcon },
  ]

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
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-gradient-to-b from-midnight-900 via-midnight-900 to-midnight-950
          border-r border-white/[0.04]
          transform transition-all duration-300 ease-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}
        `}
      >
        {/* Logo Header */}
        <div className={`
          flex items-center h-16 px-4 border-b border-white/[0.04]
          ${sidebarCollapsed ? 'justify-center' : 'justify-between'}
        `}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-glow-gold">
                <span className="text-midnight-950 font-bold text-sm">CO</span>
              </div>
              <span className="text-lg font-bold text-gradient-gold">ClubOps</span>
            </div>
          )}
          
          {sidebarCollapsed && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-glow-gold">
              <span className="text-midnight-950 font-bold text-sm">CO</span>
            </div>
          )}
          
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <p className="nav-section-label mb-3">Club Management</p>
            )}
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = isCurrentPath(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200 touch-target
                    ${sidebarCollapsed ? 'justify-center' : ''}
                    ${isActive 
                      ? 'bg-gradient-to-r from-gold-500/10 to-transparent text-gold-500 border-l-2 border-gold-500' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-gold-500' : ''}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-sm font-medium">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-gold-500 rounded-full shadow-glow-gold" />
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
              <p className="nav-section-label mb-3">SaaS Management</p>
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
                    group flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200 touch-target
                    ${sidebarCollapsed ? 'justify-center' : ''}
                    ${isActive 
                      ? 'bg-gradient-to-r from-royal-500/10 to-transparent text-royal-400 border-l-2 border-royal-500' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-royal-400' : ''}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-sm font-medium">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-royal-500 rounded-full shadow-glow-purple" />
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Settings */}
          <div className="mt-8 pt-6 border-t border-white/[0.04]">
            <Link
              to="/settings"
              title={sidebarCollapsed ? 'Settings' : undefined}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 touch-target
                ${sidebarCollapsed ? 'justify-center' : ''}
                ${isCurrentPath('/settings')
                  ? 'bg-gradient-to-r from-electric-500/10 to-transparent text-electric-400 border-l-2 border-electric-500'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                }
              `}
            >
              <CogIcon className={`h-5 w-5 flex-shrink-0 ${isCurrentPath('/settings') ? 'text-electric-400' : ''}`} />
              {!sidebarCollapsed && (
                <>
                  <span className="text-sm font-medium">Settings</span>
                  {isCurrentPath('/settings') && (
                    <div className="ml-auto w-1.5 h-1.5 bg-electric-500 rounded-full shadow-glow-cyan" />
                  )}
                </>
              )}
            </Link>
          </div>
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-midnight-800 border border-white/10 items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-midnight-700 transition-all duration-200"
        >
          {sidebarCollapsed ? (
            <ChevronRightIcon className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          )}
        </button>

        {/* User Profile Section */}
        <div className={`
          p-4 border-t border-white/[0.04] bg-midnight-950/50
          ${sidebarCollapsed ? 'flex justify-center' : ''}
        `}>
          {sidebarCollapsed ? (
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 flex items-center justify-center text-gold-500 hover:from-gold-500/30 hover:to-gold-600/20 transition-all duration-200"
            >
              <UserCircleIcon className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 flex items-center justify-center border border-gold-500/20">
                <UserCircleIcon className="h-5 w-5 text-gold-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-text-tertiary truncate">
                  {user?.clubName || 'Club Manager'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-text-tertiary hover:text-text-primary hover:bg-white/5 rounded-lg transition-all duration-150"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 bg-midnight-900/80 backdrop-blur-xl border-b border-white/[0.04]">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors text-text-secondary hover:text-text-primary touch-target"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            {/* Search */}
            <div className="relative hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-text-tertiary" />
              </div>
              <input
                type="text"
                className="search-input w-64 text-sm"
                placeholder="Search dancers, rooms..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile search button */}
            <button className="sm:hidden btn-icon">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button className="btn-icon relative">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-status-danger rounded-full ring-2 ring-midnight-900" />
            </button>

            {/* User avatar (desktop) */}
            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 items-center justify-center border border-gold-500/20">
              <UserCircleIcon className="h-5 w-5 text-gold-500" />
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
