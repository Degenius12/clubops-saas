import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'

interface RevenueState {
  todayTotal: number
  todayRevenue: number // alias for todayTotal
  barFees: number
  vipDances: number
  yesterdayComparison: number
  weeklyGoal: number
  weeklyProgress: number
  weeklyRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
  revenueHistory: any[]
  isLoading: boolean
  loading: boolean // alias for isLoading
  error: string | null
}

const initialState: RevenueState = {
  todayTotal: 2847,
  todayRevenue: 2847,
  barFees: 1640,
  vipDances: 1207,
  yesterdayComparison: 12,
  weeklyGoal: 18000,
  weeklyProgress: 78,
  weeklyRevenue: 12500,
  monthlyRevenue: 48500,
  yearlyRevenue: 485000,
  revenueHistory: [],
  isLoading: false,
  loading: false,
  error: null,
}

// Async thunks
export const fetchRevenue = createAsyncThunk(
  'revenue/fetchRevenue',
  async (params?: { period?: string }) => {
    // Mock API call - replace with actual API
    return {
      todayTotal: 2847,
      barFees: 1640,
      vipDances: 1207,
      yesterdayComparison: 12,
      weeklyGoal: 18000,
      weeklyProgress: 78,
      weeklyRevenue: 12500,
      monthlyRevenue: 48500,
      yearlyRevenue: 485000,
      revenueHistory: [],
    }
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
      .addCase(fetchRevenue.pending, (state) => {
        state.isLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(fetchRevenue.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        Object.assign(state, action.payload)
        state.todayRevenue = action.payload.todayTotal
      })
      .addCase(fetchRevenue.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to fetch revenue'
      })
  },
})

export const { updateRevenue, addBarFee } = revenueSlice.actions
export default revenueSlice.reducer
