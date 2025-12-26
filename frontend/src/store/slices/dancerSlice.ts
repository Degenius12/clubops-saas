import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import apiClient from '../../config/api'

// Entertainer interface (API still uses /api/dancers endpoint for backward compatibility)
export interface Entertainer {
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
  contract_signed: boolean
  created_at: string
  updated_at: string
  complianceStatus: 'valid' | 'expiring' | 'expired' | 'compliant' | 'warning' | 'expiring_soon'
  daysUntilExpiry: number
  todayCheckIns: number
  totalEarnings: number
  ownerName?: string
  clubName?: string
}

// Backward compatibility alias
export type Dancer = Entertainer

export interface LicenseAlert {
  dancer_id: string // API response field (backward compatibility)
  dancer_name: string // API response field (backward compatibility)
  license_expiry: string
  days_until_expiry: number
  severity: 'critical' | 'warning' | 'info'
}

interface EntertainerState {
  entertainers: Entertainer[]
  activeEntertainers: Entertainer[]
  licenseAlerts: LicenseAlert[]
  isLoading: boolean
  loading: boolean // alias for isLoading for compatibility
  error: string | null
  selectedEntertainer: Entertainer | null
}

// Backward compatibility aliases
interface DancerState extends EntertainerState {
  dancers: Entertainer[]
  activeDancers: Entertainer[]
  selectedDancer: Entertainer | null
}

const initialState: EntertainerState = {
  entertainers: [],
  activeEntertainers: [],
  licenseAlerts: [],
  isLoading: false,
  loading: false,
  error: null,
  selectedEntertainer: null,
}

// Async thunks for entertainer management (API endpoints kept as /api/dancers for backward compatibility)
export const fetchEntertainers = createAsyncThunk(
  'entertainers/fetchAll',
  async () => {
    const response = await apiClient.get('/api/dancers')
    // Backend returns { dancers: [...], total: N } - extract the array
    return response.data.dancers || response.data || []
  }
)

export const checkInEntertainer = createAsyncThunk(
  'entertainers/checkIn',
  async ({ entertainerId, barFeeAmount }: { entertainerId: string; barFeeAmount: number }) => {
    const response = await apiClient.post(`/api/dancers/${entertainerId}/check-in`, {
      bar_fee_amount: barFeeAmount
    })
    return response.data
  }
)

export const checkOutEntertainer = createAsyncThunk(
  'entertainers/checkOut',
  async (entertainerId: string) => {
    const response = await apiClient.post(`/api/dancers/${entertainerId}/check-out`)
    return response.data
  }
)

export const createEntertainer = createAsyncThunk(
  'entertainers/create',
  async (entertainerData: Partial<Entertainer>) => {
    const response = await apiClient.post('/api/dancers', entertainerData)
    return response.data
  }
)

export const updateEntertainer = createAsyncThunk(
  'entertainers/update',
  async ({ id, data }: { id: string; data: Partial<Entertainer> }) => {
    const response = await apiClient.put(`/api/dancers/${id}`, data)
    return response.data
  }
)

export const fetchLicenseAlerts = createAsyncThunk(
  'entertainers/fetchLicenseAlerts',
  async () => {
    const response = await apiClient.get('/api/dancers/license-alerts')
    return response.data
  }
)

// Backward compatibility aliases
export const fetchDancers = fetchEntertainers
export const checkInDancer = checkInEntertainer
export const checkOutDancer = checkOutEntertainer
export const createDancer = createEntertainer
export const updateDancer = updateEntertainer

const entertainerSlice = createSlice({
  name: 'entertainers',
  initialState,
  reducers: {
    setSelectedEntertainer: (state, action: PayloadAction<Entertainer | null>) => {
      state.selectedEntertainer = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    updateEntertainerStatus: (state, action: PayloadAction<{ id: string; status: Entertainer['status'] }>) => {
      const entertainer = state.entertainers.find(e => e.id === action.payload.id)
      if (entertainer) {
        entertainer.status = action.payload.status
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch entertainers
    builder
      .addCase(fetchEntertainers.pending, (state) => {
        state.isLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(fetchEntertainers.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.entertainers = action.payload
        state.activeEntertainers = action.payload.filter((e: Entertainer) => e.is_checked_in)
      })
      .addCase(fetchEntertainers.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to fetch entertainers'
      })
      // Check in entertainer
      .addCase(checkInEntertainer.fulfilled, (state, action) => {
        const updatedEntertainer = action.payload
        const index = state.entertainers.findIndex(e => e.id === updatedEntertainer.id)
        if (index !== -1) {
          state.entertainers[index] = updatedEntertainer
          state.activeEntertainers.push(updatedEntertainer)
        }
      })
      // Check out entertainer
      .addCase(checkOutEntertainer.fulfilled, (state, action) => {
        const updatedEntertainer = action.payload
        const index = state.entertainers.findIndex(e => e.id === updatedEntertainer.id)
        if (index !== -1) {
          state.entertainers[index] = updatedEntertainer
          state.activeEntertainers = state.activeEntertainers.filter(e => e.id !== updatedEntertainer.id)
        }
      })
      // Create entertainer
      .addCase(createEntertainer.fulfilled, (state, action) => {
        state.entertainers.push(action.payload)
      })
      // Update entertainer
      .addCase(updateEntertainer.fulfilled, (state, action) => {
        const index = state.entertainers.findIndex(e => e.id === action.payload.id)
        if (index !== -1) {
          state.entertainers[index] = action.payload
        }
      })
      // License alerts
      .addCase(fetchLicenseAlerts.fulfilled, (state, action) => {
        state.licenseAlerts = action.payload
      })
  },
})

export const { setSelectedEntertainer, clearError, updateEntertainerStatus } = entertainerSlice.actions

// Backward compatibility aliases
export const setSelectedDancer = setSelectedEntertainer
export const updateDancerStatus = updateEntertainerStatus

// Export addEntertainer as alias for createEntertainer to maintain compatibility
export const addEntertainer = createEntertainer
export const addDancer = createEntertainer

export default entertainerSlice.reducer
