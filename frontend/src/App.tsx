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
import VIPBooths from './components/vip/VIPBooths'
import Revenue from './components/revenue/Revenue'
import MonthlyReport from './components/revenue/MonthlyReport'
import FeeManagement from './components/fees/FeeManagement'
import DiscrepancyReport from './components/fees/DiscrepancyReport'
import { LateFeeManagement } from './components/fees/LateFeeManagement'
import ScheduleManager from './components/schedule/ScheduleManager'
import { ShiftScheduling } from './components/schedule/ShiftScheduling'
import { ShiftSwapRequests } from './components/schedule/ShiftSwapRequests'
import Settings from './components/settings/Settings'

// Role-Based Station Interfaces (Fraud Prevention)
import VipHostInterface from './components/vip-host/VipHostInterface'
import DoorStaffInterface from './components/door-staff/DoorStaffInterface'
import SecurityDashboard from './components/owner/SecurityDashboard'
import ErrorBoundary from './components/ErrorBoundary'

// SaaS Pages
import SubscriptionDashboard from './components/subscription/SubscriptionDashboard'
import BillingPanel from './components/billing/BillingPanel'
import AdminDashboard from './components/admin/AdminDashboard'

// Public Pages
import InvestorPage from './pages/InvestorPage'

// Onboarding
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { useOnboarding } from './contexts/OnboardingContext'

// Compliance
import { EntertainerOnboarding } from './components/onboarding/EntertainerOnboarding'
import { ComplianceDashboard } from './components/compliance/ComplianceDashboard'

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth)
  const { isActive: isOnboardingActive } = useOnboarding()

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
      {/* Onboarding Flow Overlay */}
      {isOnboardingActive && <OnboardingFlow />}

      <Routes>
        {/* Investor Landing Page - Fully Public, No Auth Check */}
        <Route path="/investors" element={<InvestorPage />} />

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
              <VIPBooths />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* VIP Host Station - Tablet Interface for VIP Session Management */}
        <Route path="/vip-host" element={
          <ProtectedRoute>
            <VipHostInterface />
          </ProtectedRoute>
        } />

        {/* Door Staff Station - Tablet Interface for Check-Ins & Bar Fees */}
        <Route path="/door-staff" element={
          <ProtectedRoute>
            <DoorStaffInterface />
          </ProtectedRoute>
        } />

        {/* Owner Security Dashboard - Fraud Detection & Monitoring */}
        <Route path="/security" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <SecurityDashboard />
            </ErrorBoundary>
          </ProtectedRoute>
        } />

        <Route path="/revenue" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Revenue />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/revenue/monthly" element={
          <ProtectedRoute>
            <DashboardLayout>
              <MonthlyReport />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/fees" element={
          <ProtectedRoute>
            <DashboardLayout>
              <FeeManagement />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/fees/late" element={
          <ProtectedRoute>
            <DashboardLayout>
              <LateFeeManagement />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/discrepancy" element={
          <ProtectedRoute>
            <DashboardLayout>
              <DiscrepancyReport />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/schedule" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ScheduleManager />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/shift-scheduling" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ShiftScheduling />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/shift-swaps" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ShiftSwapRequests />
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

        {/* Compliance Routes */}
        <Route path="/compliance" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ComplianceDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/onboarding/:entertainerId" element={
          <ProtectedRoute>
            <EntertainerOnboarding />
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
