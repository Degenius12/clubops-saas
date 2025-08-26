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
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    <div className="min-h-screen bg-dark-bg flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-card/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <h1 className="text-xl font-bold text-gradient-premium">ClubOps</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Club Management
            </p>
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isCurrentPath(item.href)
                      ? 'bg-gradient-to-r from-accent-blue/20 to-accent-gold/20 text-accent-blue border border-accent-blue/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                  {isCurrentPath(item.href) && (
                    <div className="ml-auto w-2 h-2 bg-accent-blue rounded-full"></div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* SaaS Navigation */}
          <div className="mt-8 space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              SaaS Management
            </p>
            {saasNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isCurrentPath(item.href)
                      ? 'bg-gradient-to-r from-accent-gold/20 to-accent-red/20 text-accent-gold border border-accent-gold/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                  {isCurrentPath(item.href) && (
                    <div className="ml-auto w-2 h-2 bg-accent-gold rounded-full"></div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Settings */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <Link
              to="/settings"
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isCurrentPath('/settings')
                  ? 'bg-gradient-to-r from-accent-red/20 to-accent-blue/20 text-accent-red border border-accent-red/30'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <CogIcon className="mr-3 h-5 w-5 flex-shrink-0" />
              Settings
              {isCurrentPath('/settings') && (
                <div className="ml-auto w-2 h-2 bg-accent-red rounded-full"></div>
              )}
            </Link>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-dark-card/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-accent-blue to-accent-gold rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.clubName || 'Club'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Logout"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-0">
        {/* Top bar */}
        <div className="bg-dark-card/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>

              {/* Search */}
              <div className="relative max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 bg-dark-bg/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  placeholder="Search..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-red rounded-full"></span>
              </button>

              {/* User menu placeholder */}
              <div className="w-8 h-8 bg-gradient-to-r from-accent-blue to-accent-gold rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout