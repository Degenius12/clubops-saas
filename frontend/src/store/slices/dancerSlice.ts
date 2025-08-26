import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

export interface Dancer {
  id: string
  name: string
  stage_name: string
  email: string
  phone: string
  license_number: string
  license_expiry: string
  emergency_contact: string
  status: 'active' | 'inactive' | 'suspended'
  is_checked_in: boolean
  check_in_time?: string
  bar_fee_paid: boolean
  bar_fee_amount: number
  created_at: string
  updated_at: string
}

export interface LicenseAlert {
  dancer_id: string
  dancer_name: string
  license_expiry: string
  days_until_expiry: number
  severity: 'critical' | 'warning' | 'info'
}

interface DancerState {
  dancers: Dancer[]
  activeDancers: Dancer[]
  licenseAlerts: LicenseAlert[]
  isLoading: boolean
  error: string | null
  selectedDancer: Dancer | null
}const initialState: DancerState = {
  dancers: [],
  activeDancers: [],
  licenseAlerts: [],
  isLoading: false,
  error: null,
  selectedDancer: null,
}

// Async thunks for dancer management
export const fetchDancers = createAsyncThunk(
  'dancers/fetchAll',
  async (_, { getState }) => {
    const response = await axios.get('/api/dancers')
    return response.data
  }
)

export const checkInDancer = createAsyncThunk(
  'dancers/checkIn',
  async ({ dancerId, barFeeAmount }: { dancerId: string; barFeeAmount: number }) => {
    const response = await axios.post(`/api/dancers/${dancerId}/check-in`, {
      bar_fee_amount: barFeeAmount
    })
    return response.data
  }
)

export const checkOutDancer = createAsyncThunk(
  'dancers/checkOut',
  async (dancerId: string) => {
    const response = await axios.post(`/api/dancers/${dancerId}/check-out`)
    return response.data
  }
)

export const createDancer = createAsyncThunk(
  'dancers/create',
  async (dancerData: Partial<Dancer>) => {
    const response = await axios.post('/api/dancers', dancerData)
    return response.data
  }
)

export const updateDancer = createAsyncThunk(
  'dancers/update',
  async ({ id, data }: { id: string; data: Partial<Dancer> }) => {
    const response = await axios.put(`/api/dancers/${id}`, data)
    return response.data
  }
)

export const fetchLicenseAlerts = createAsyncThunk(
  'dancers/fetchLicenseAlerts',
  async () => {
    const response = await axios.get('/api/dancers/license-alerts')
    return response.data
  }
)

const dancerSlice = createSlice({
  name: 'dancers',
  initialState,
  reducers: {
    setSelectedDancer: (state, action: PayloadAction<Dancer | null>) => {
      state.selectedDancer = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    updateDancerStatus: (state, action: PayloadAction<{ id: string; status: Dancer['status'] }>) => {
      const dancer = state.dancers.find(d => d.id === action.payload.id)
      if (dancer) {
        dancer.status = action.payload.status
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch dancers
    builder
      .addCase(fetchDancers.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDancers.fulfilled, (state, action) => {
        state.isLoading = false
        state.dancers = action.payload
        state.activeDancers = action.payload.filter((d: Dancer) => d.is_checked_in)
      })
      .addCase(fetchDancers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch dancers'
      })
      // Check in dancer
      .addCase(checkInDancer.fulfilled, (state, action) => {
        const updatedDancer = action.payload
        const index = state.dancers.findIndex(d => d.id === updatedDancer.id)
        if (index !== -1) {
          state.dancers[index] = updatedDancer
          state.activeDancers.push(updatedDancer)
        }
      })
      // Check out dancer
      .addCase(checkOutDancer.fulfilled, (state, action) => {
        const updatedDancer = action.payload
        const index = state.dancers.findIndex(d => d.id === updatedDancer.id)
        if (index !== -1) {
          state.dancers[index] = updatedDancer
          state.activeDancers = state.activeDancers.filter(d => d.id !== updatedDancer.id)
        }
      })
      // Create dancer
      .addCase(createDancer.fulfilled, (state, action) => {
        state.dancers.push(action.payload)
      })
      // Update dancer
      .addCase(updateDancer.fulfilled, (state, action) => {
        const index = state.dancers.findIndex(d => d.id === action.payload.id)
        if (index !== -1) {
          state.dancers[index] = action.payload
        }
      })
      // License alerts
      .addCase(fetchLicenseAlerts.fulfilled, (state, action) => {
        state.licenseAlerts = action.payload
      })
  },
})

export const { setSelectedDancer, clearError, updateDancerStatus } = dancerSlice.actions
export default dancerSlice.reducer
