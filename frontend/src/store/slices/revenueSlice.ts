import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../../config/api'

interface RevenueState {
  todayTotal: number
  todayRevenue: number // alias for todayTotal
  barFees: number
  vipFees: number
  coverCharges: number
  otherRevenue: number
  yesterdayTotal: number
  yesterdayComparison: number
  comparisonPercent: number
  weeklyRevenue: number
  weeklyHistory: Array<{ date: string; day: string; total: number }>
  weeklyChange: number
  monthlyRevenue: number
  monthlyChange: number
  yearlyRevenue: number
  revenueHistory: any[] // Legacy field
  weeklyGoal: number // Legacy field
  weeklyProgress: number // Legacy field
  vipDances: number // Legacy field
  isLoading: boolean
  loading: boolean // alias for isLoading
  error: string | null
}

const initialState: RevenueState = {
  todayTotal: 0,
  todayRevenue: 0,
  barFees: 0,
  vipFees: 0,
  coverCharges: 0,
  otherRevenue: 0,
  yesterdayTotal: 0,
  yesterdayComparison: 0,
  comparisonPercent: 0,
  weeklyRevenue: 0,
  weeklyHistory: [],
  weeklyChange: 0,
  monthlyRevenue: 0,
  monthlyChange: 0,
  yearlyRevenue: 0,
  // Legacy fields
  revenueHistory: [],
  weeklyGoal: 18000,
  weeklyProgress: 0,
  vipDances: 0,
  isLoading: false,
  loading: false,
  error: null,
}

// Async thunks
export const fetchRevenue = createAsyncThunk(
  'revenue/fetchRevenue',
  async (params?: { period?: string }) => {
    const response = await apiClient.get('/api/revenue/all')
    return response.data
  }
)

export const fetchRevenueSummary = createAsyncThunk(
  'revenue/fetchSummary',
  async () => {
    const response = await apiClient.get('/api/revenue/summary')
    return response.data
  }
)

export const fetchWeeklyRevenue = createAsyncThunk(
  'revenue/fetchWeekly',
  async () => {
    const response = await apiClient.get('/api/revenue/weekly')
    return response.data
  }
)

export const fetchMonthlyRevenue = createAsyncThunk(
  'revenue/fetchMonthly',
  async () => {
    const response = await apiClient.get('/api/revenue/monthly')
    return response.data
  }
)

const revenueSlice = createSlice({
  name: 'revenue',
  initialState,
  reducers: {
    updateRevenue: (state, action: PayloadAction<Partial<RevenueState>>) => {
      Object.assign(state, action.payload)
    },
    addBarFee: (state, action: PayloadAction<number>) => {
      state.barFees += action.payload
      state.todayTotal += action.payload
      state.todayRevenue += action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all revenue metrics
      .addCase(fetchRevenue.pending, (state) => {
        state.isLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(fetchRevenue.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.todayTotal = action.payload.today || 0
        state.todayRevenue = action.payload.today || 0
        state.weeklyRevenue = action.payload.week || 0
        state.monthlyRevenue = action.payload.month || 0
        state.yearlyRevenue = action.payload.year || 0
      })
      .addCase(fetchRevenue.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to fetch revenue'
      })
      // Fetch revenue summary (daily breakdown and comparison)
      .addCase(fetchRevenueSummary.pending, (state) => {
        state.isLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(fetchRevenueSummary.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.todayTotal = action.payload.today?.total || 0
        state.todayRevenue = action.payload.today?.total || 0
        state.barFees = action.payload.today?.breakdown?.bar_fees || 0
        state.vipFees = action.payload.today?.breakdown?.vip_fees || 0
        state.coverCharges = action.payload.today?.breakdown?.cover_charges || 0
        state.otherRevenue = action.payload.today?.breakdown?.other || 0
        state.yesterdayTotal = action.payload.yesterday?.total || 0
        state.yesterdayComparison = action.payload.comparison?.amount || 0
        state.comparisonPercent = action.payload.comparison?.percent || 0
      })
      .addCase(fetchRevenueSummary.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to fetch revenue summary'
      })
      // Fetch weekly revenue trends
      .addCase(fetchWeeklyRevenue.pending, (state) => {
        state.isLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(fetchWeeklyRevenue.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.weeklyRevenue = action.payload.weekly_total || 0
        state.weeklyHistory = action.payload.daily || []
        state.weeklyChange = action.payload.change_percent || 0
        // Update weeklyProgress for legacy components
        state.weeklyProgress = state.weeklyGoal > 0
          ? (state.weeklyRevenue / state.weeklyGoal) * 100
          : 0
      })
      .addCase(fetchWeeklyRevenue.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to fetch weekly revenue'
      })
      // Fetch monthly revenue
      .addCase(fetchMonthlyRevenue.pending, (state) => {
        state.isLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(fetchMonthlyRevenue.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.monthlyRevenue = action.payload.total || 0
        state.monthlyChange = action.payload.change_percent || 0
      })
      .addCase(fetchMonthlyRevenue.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to fetch monthly revenue'
      })
  },
})

export const { updateRevenue, addBarFee } = revenueSlice.actions
export default revenueSlice.reducer
