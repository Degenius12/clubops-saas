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
  ChevronLeftIcon,
  ArrowRightOnRectangleIcon
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
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 
          ${sidebarCollapsed ? 'w-[72px]' : 'w-64'} 
          bg-gradient-to-b from-midnight-900 via-midnight-900 to-midnight-950
          border-r border-white/[0.06]
          transform transition-all duration-300 ease-out
          lg:translate-x-0 lg:static lg:inset-0 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo Header */}
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} h-16 px-4 border-b border-white/[0.06]`}>
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gradient-gold tracking-tight">ClubOps</h1>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
              <span className="text-midnight-900 font-bold text-sm">C</span>
            </div>
          )}
          
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/[0.04] transition-colors touch-target"
          >
            <XMarkIcon className="h-5 w-5 text-text-secondary" />
          </button>
          
          {/* Desktop collapse button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex p-2 rounded-lg hover:bg-white/[0.04] transition-all duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`}
          >
            <ChevronLeftIcon className="h-4 w-4 text-text-tertiary" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3 flex-1 overflow-y-auto scrollbar-hide">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <p className="nav-section-label mb-2">Club Management</p>
            )}
            {navigation.map((item, index) => {
              const Icon = item.icon
              const isActive = isCurrentPath(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`
                    group flex items-center ${sidebarCollapsed ? 'justify-center' : ''} 
                    px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200 touch-target
                    animate-fade-in
                    ${isActive 
                      ? 'bg-gradient-to-r from-gold-500/10 to-transparent text-gold-500 border-l-2 border-gold-500' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    }
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Icon className={`${sidebarCollapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-gold-500' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span>{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse"></div>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-white/[0.04]"></div>

          {/* SaaS Navigation */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <p className="nav-section-label mb-2">SaaS Management</p>
            )}
            {saasNavigation.map((item, index) => {
              const Icon = item.icon
              const isActive = isCurrentPath(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`
                    group flex items-center ${sidebarCollapsed ? 'justify-center' : ''} 
                    px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200 touch-target
                    ${isActive 
                      ? 'bg-gradient-to-r from-royal-500/10 to-transparent text-royal-400 border-l-2 border-royal-500' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <Icon className={`${sidebarCollapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-royal-400' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span>{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-royal-500 rounded-full animate-pulse"></div>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Settings */}
          <div className="mt-6 pt-4 border-t border-white/[0.04]">
            <Link
              to="/settings"
              title={sidebarCollapsed ? 'Settings' : undefined}
              className={`
                group flex items-center ${sidebarCollapsed ? 'justify-center' : ''} 
                px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 touch-target
                ${isCurrentPath('/settings') 
                  ? 'bg-gradient-to-r from-electric-500/10 to-transparent text-electric-400 border-l-2 border-electric-500' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                }
              `}
            >
              <CogIcon className={`${sidebarCollapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 transition-colors ${isCurrentPath('/settings') ? 'text-electric-400' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
              {!sidebarCollapsed && <span>Settings</span>}
            </Link>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className={`border-t border-white/[0.06] p-3 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          {sidebarCollapsed ? (
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 flex items-center justify-center hover:from-gold-500/30 hover:to-gold-600/20 transition-all duration-200 touch-target"
              title="Logout"
            >
              <UserCircleIcon className="h-5 w-5 text-gold-500" />
            </button>
          ) : (
            <div className="flex items-center space-x-3 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0">
                <UserCircleIcon className="h-5 w-5 text-midnight-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user?.email || 'User'}</p>
                <p className="text-xs text-text-tertiary truncate">{user?.clubName || 'Club'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-text-tertiary hover:text-text-primary hover:bg-white/[0.04] rounded-lg transition-all duration-150 touch-target"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-midnight-900/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-white/[0.04] transition-colors touch-target"
              >
                <Bars3Icon className="h-5 w-5 text-text-secondary" />
              </button>

              {/* Search */}
              <div className="relative hidden sm:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-text-tertiary" />
                </div>
                <input
                  type="text"
                  className="search-input w-64 text-sm"
                  placeholder="Search dancers, songs..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mobile search button */}
              <button className="sm:hidden btn-icon touch-target">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <button className="relative btn-icon touch-target">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-danger rounded-full ring-2 ring-midnight-900"></span>
              </button>

              {/* User avatar (mobile) */}
              <div className="lg:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
                <span className="text-midnight-900 font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
