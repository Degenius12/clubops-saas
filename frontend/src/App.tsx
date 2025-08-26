import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from './store/store'
import { getCurrentUser } from './store/slices/authSlice'

// Layout Components
import AuthLayout from './components/layouts/AuthLayout'
import DashboardLayout from './components/layouts/DashboardLayout'

// Auth Pages
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'

// Dashboard Pages
import Dashboard from './components/dashboard/Dashboard'
import DancerManagement from './components/dancers/DancerManagement'
import DJQueue from './components/queue/DJQueue'
import VIPRooms from './components/vip/VIPRooms'
import Revenue from './components/revenue/Revenue'
import Settings from './components/settings/Settings'

// SaaS Pages
import SubscriptionDashboard from './components/subscription/SubscriptionDashboard'
import BillingPanel from './components/billing/BillingPanel'
import AdminDashboard from './components/admin/AdminDashboard'

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // Check for existing token and validate user
    if (token && !user) {
      dispatch(getCurrentUser())
    }
  }, [dispatch, token, user])

  // Protected Route Component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
  }

  // Public Route Component (redirect if authenticated)
  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />
  }

  return (
    <div className="App bg-dark-bg text-white min-h-screen">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute>
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          </PublicRoute>
        } />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/dancers" element={
          <ProtectedRoute>
            <DashboardLayout>
              <DancerManagement />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/queue" element={
          <ProtectedRoute>
            <DashboardLayout>
              <DJQueue />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/vip" element={
          <ProtectedRoute>
            <DashboardLayout>
              <VIPRooms />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/revenue" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Revenue />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* SaaS Management Routes */}
        <Route path="/subscription" element={
          <ProtectedRoute>
            <DashboardLayout>
              <SubscriptionDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/billing" element={
          <ProtectedRoute>
            <DashboardLayout>
              <BillingPanel />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Default Redirects */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />
        
        {/* 404 Fallback */}
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gradient-premium mb-4">404</h1>
              <p className="text-gray-400 mb-6">Page not found</p>
              <button 
                onClick={() => window.history.back()}
                className="btn-primary"
              >
                Go Back
              </button>
            </div>
          </div>
        } />
      </Routes>
    </div>
  )
}

export default App
