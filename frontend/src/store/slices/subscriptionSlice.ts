import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise'

interface SubscriptionState {
  currentTier: SubscriptionTier
  currentPlan?: any
  usage?: any
  billing?: any
  invoices?: any[]
  paymentMethods?: any[]
  features: Record<string, boolean>
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
  isLoading: boolean
  loading: boolean // alias for isLoading for compatibility
  error: string | null
}

const initialState: SubscriptionState = {
  currentTier: 'free',
  currentPlan: null,
  usage: null,
  billing: null,
  invoices: [],
  paymentMethods: [],
  features: {
    dancerManagement: true,
    licenseAlerts: true,
    basicReporting: true,
    djQueue: false,
    vipRooms: false,
    advancedAnalytics: false,
    multiUser: false,
    apiAccess: false,
  },
  billingCycle: 'monthly',
  nextBillingDate: '',
  isLoading: false,
  loading: false,
  error: null,
}

// Async thunks
export const fetchSubscription = createAsyncThunk(
  'subscription/fetchSubscription',
  async () => {
    const response = await axios.get('/api/subscription')
    return response.data
  }
)

export const upgradeSubscription = createAsyncThunk(
  'subscription/upgradeSubscription',
  async (planId: string) => {
    const response = await axios.post('/api/subscription/upgrade', { planId })
    return response.data
  }
)

export const fetchBilling = createAsyncThunk(
  'subscription/fetchBilling',
  async () => {
    const response = await axios.get('/api/billing')
    return response.data
  }
)

export const updatePaymentMethod = createAsyncThunk(
  'subscription/updatePaymentMethod',
  async (paymentData: any) => {
    const response = await axios.post('/api/billing/payment-methods', paymentData)
    return response.data
  }
)

export const downloadInvoice = createAsyncThunk(
  'subscription/downloadInvoice',
  async (invoiceId: string) => {
    const response = await axios.get(`/api/billing/invoices/${invoiceId}/download`)
    return response.data
  }
)

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscriptionTier: (state, action: PayloadAction<SubscriptionTier>) => {
      state.currentTier = action.payload
      // Update features based on tier
      switch (action.payload) {
        case 'basic':
          state.features = { ...state.features, djQueue: true }
          break
        case 'pro':
          state.features = { ...state.features, djQueue: true, vipRooms: true, advancedAnalytics: true }
          break
        case 'enterprise':
          state.features = { ...state.features, djQueue: true, vipRooms: true, advancedAnalytics: true, multiUser: true, apiAccess: true }
          break
        default:
          break
      }
    },
    updateFeatures: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.features = { ...state.features, ...action.payload }
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchSubscription
      .addCase(fetchSubscription.pending, (state) => {
        state.isLoading = true
        state.loading = true
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.currentPlan = action.payload.plan
        state.usage = action.payload.usage
        state.billing = action.payload.billing
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to fetch subscription'
      })
      // upgradeSubscription
      .addCase(upgradeSubscription.fulfilled, (state, action) => {
        state.currentPlan = action.payload.plan
      })
      // fetchBilling
      .addCase(fetchBilling.fulfilled, (state, action) => {
        state.billing = action.payload.billing
        state.invoices = action.payload.invoices
        state.paymentMethods = action.payload.paymentMethods
      })
      // updatePaymentMethod
      .addCase(updatePaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods = action.payload.paymentMethods
      })
  },
})

export const { setSubscriptionTier, updateFeatures } = subscriptionSlice.actions
export default subscriptionSlice.reducer
