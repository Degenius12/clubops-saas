import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'

interface RevenueState {
  todayTotal: number
  barFees: number
  vipDances: number
  yesterdayComparison: number
  weeklyGoal: number
  weeklyProgress: number
  isLoading: boolean
}

const initialState: RevenueState = {
  todayTotal: 2847,
  barFees: 1640,
  vipDances: 1207,
  yesterdayComparison: 12,
  weeklyGoal: 18000,
  weeklyProgress: 78,
  isLoading: false,
}

// Async thunks
export const fetchRevenue = createAsyncThunk(
  'revenue/fetchRevenue',
  async () => {
    // Mock API call - replace with actual API
    return {
      todayTotal: 2847,
      barFees: 1640,
      vipDances: 1207,
      yesterdayComparison: 12,
      weeklyGoal: 18000,
      weeklyProgress: 78,
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
    }
  },
})

export const { updateRevenue, addBarFee } = revenueSlice.actions
export default revenueSlice.reducer
