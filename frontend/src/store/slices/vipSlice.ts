import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../../config/api'

export interface VipRoom {
  id: string
  booth_name: string
  booth_number: number
  capacity: number
  song_rate: number | null
  is_available: boolean
  is_active: boolean
  status: 'available' | 'occupied' | 'unavailable'
  current_session: {
    id: string
    dancer_id: string
    dancer_name: string
    customer_name: string | null
    started_at: string
    song_count: number
    song_rate: number
    song_total: number
    items_count: number
    items_total: number
    grand_total: number
    minimum_spend: number
    remaining: number
    percent_complete: number
    meets_minimum: boolean
  } | null
  created_at: string
  // Legacy aliases for compatibility
  name?: string
  hourly_rate?: number
  dancer_name?: string
  start_time?: string
  elapsed_time?: number
}

export interface VipAlert {
  id: string
  alert_type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
  title: string
  description: string
  booth_number: number
  booth_name: string
  dancer_name: string
  customer_name: string | null
  minimum_spend: number
  current_spending: number
  remaining: number
  percent_complete: number
  session_duration_minutes: number
  acknowledged_by: string | null
  acknowledged_at: string | null
  created_at: string
}

interface VipState {
  rooms: VipRoom[]
  alerts: VipAlert[]
  alertCount: number
  isLoading: boolean
  loading: boolean // alias for isLoading for compatibility
  error: string | null
}

const initialState: VipState = {
  rooms: [],
  alerts: [],
  alertCount: 0,
  isLoading: false,
  loading: false,
  error: null,
}

// Async thunks
export const fetchVIPRooms = createAsyncThunk(
  'vip/fetchVIPRooms',
  async () => {
    const response = await apiClient.get('/api/vip-rooms')
    return response.data
  }
)

export const startVipSession = createAsyncThunk(
  'vip/startSession',
  async ({
    boothId,
    dancerId,
    customerName,
    customerPhone,
    songRate,
    minimumSpend
  }: {
    boothId: string
    dancerId: string
    customerName?: string
    customerPhone?: string
    songRate?: number
    minimumSpend?: number
  }) => {
    const response = await apiClient.post(`/api/vip-rooms/${boothId}/start-session`, {
      dancer_id: dancerId,
      customer_name: customerName,
      customer_phone: customerPhone,
      song_rate: songRate,
      minimum_spend: minimumSpend
    })
    return { boothId, session: response.data }
  }
)

export const addItemToSession = createAsyncThunk(
  'vip/addItem',
  async ({
    boothId,
    itemType,
    itemName,
    quantity,
    unitPrice,
    notes
  }: {
    boothId: string
    itemType: 'BOTTLE' | 'SERVICE' | 'FOOD' | 'OTHER'
    itemName: string
    quantity: number
    unitPrice: number
    notes?: string
  }) => {
    const response = await apiClient.post(`/api/vip-rooms/${boothId}/add-item`, {
      item_type: itemType,
      item_name: itemName,
      quantity,
      unit_price: unitPrice,
      notes
    })
    return { boothId, item: response.data }
  }
)

export const endVipSession = createAsyncThunk(
  'vip/endSession',
  async (boothId: string) => {
    const response = await apiClient.post(`/api/vip-rooms/${boothId}/end-session`)
    return { boothId, result: response.data }
  }
)

export const updateSongCount = createAsyncThunk(
  'vip/updateSongCount',
  async ({ boothId, songCount }: { boothId: string, songCount: number }) => {
    const response = await apiClient.put(`/api/vip-rooms/${boothId}/update-song-count`, {
      song_count: songCount
    })
    return { boothId, data: response.data }
  }
)

// Alert thunks
export const fetchVipAlerts = createAsyncThunk(
  'vip/fetchAlerts',
  async () => {
    const response = await apiClient.get('/api/vip-rooms/alerts')
    return response.data
  }
)

export const checkMinimumSpendAlerts = createAsyncThunk(
  'vip/checkAlerts',
  async () => {
    const response = await apiClient.get('/api/vip-rooms/check-minimum-spend-alerts')
    return response.data
  }
)

export const acknowledgeAlert = createAsyncThunk(
  'vip/acknowledgeAlert',
  async (alertId: string) => {
    const response = await apiClient.post(`/api/vip-rooms/alerts/${alertId}/acknowledge`)
    return response.data
  }
)

export const resolveAlert = createAsyncThunk(
  'vip/resolveAlert',
  async ({ alertId, resolution }: { alertId: string, resolution?: string }) => {
    const response = await apiClient.post(`/api/vip-rooms/alerts/${alertId}/resolve`, {
      resolution
    })
    return response.data
  }
)

// Legacy thunks for compatibility
export const updateRoomStatus = createAsyncThunk(
  'vip/updateRoomStatus',
  async ({ roomId, status }: { roomId: string, status: string }) => {
    return { roomId, status }
  }
)

export const startRoomTimer = startVipSession
export const stopRoomTimer = endVipSession

const vipSlice = createSlice({
  name: 'vip',
  initialState,
  reducers: {
    updateRoom: (state, action: PayloadAction<VipRoom>) => {
      const index = state.rooms.findIndex(room => room.id === action.payload.id)
      if (index !== -1) {
        state.rooms[index] = action.payload
      }
    },
    startSession: (state, action: PayloadAction<{ roomId: string; dancerName: string }>) => {
      const room = state.rooms.find(r => r.id === action.payload.roomId)
      if (room) {
        room.status = 'occupied'
        room.dancer_name = action.payload.dancerName
        room.start_time = new Date().toISOString()
        room.elapsed_time = 0
        room.currentSession = {
          dancerName: action.payload.dancerName,
          startTime: new Date().toISOString(),
          elapsedTime: 0
        }
      }
    },
    endSession: (state, action: PayloadAction<string>) => {
      const room = state.rooms.find(r => r.id === action.payload)
      if (room) {
        room.status = 'available'
        room.dancer_name = undefined
        room.start_time = undefined
        room.elapsed_time = undefined
        room.currentSession = undefined
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch VIP rooms
      .addCase(fetchVIPRooms.pending, (state) => {
        state.isLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(fetchVIPRooms.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        // Backend returns array directly, not wrapped in { rooms: [] }
        state.rooms = Array.isArray(action.payload) ? action.payload : action.payload.rooms || []
      })
      .addCase(fetchVIPRooms.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to fetch VIP booths'
      })
      // Start VIP session
      .addCase(startVipSession.pending, (state) => {
        state.isLoading = true
        state.loading = true
      })
      .addCase(startVipSession.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        // Refetch to get updated booth state
      })
      .addCase(startVipSession.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to start session'
      })
      // End VIP session
      .addCase(endVipSession.pending, (state) => {
        state.isLoading = true
        state.loading = true
      })
      .addCase(endVipSession.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        // Refetch to get updated booth state
      })
      .addCase(endVipSession.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to end session'
      })
      // Update song count
      .addCase(updateSongCount.pending, (state) => {
        state.isLoading = true
        state.loading = true
      })
      .addCase(updateSongCount.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
      })
      .addCase(updateSongCount.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to update song count'
      })
      // Add item to session
      .addCase(addItemToSession.pending, (state) => {
        state.isLoading = true
        state.loading = true
      })
      .addCase(addItemToSession.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
      })
      .addCase(addItemToSession.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to add item'
      })
      // Legacy compatibility
      .addCase(updateRoomStatus.fulfilled, (state, action) => {
        const room = state.rooms.find(r => r.id === action.payload.roomId)
        if (room) {
          room.status = action.payload.status as any
        }
      })
      // Fetch VIP alerts
      .addCase(fetchVipAlerts.pending, (state) => {
        state.isLoading = true
        state.loading = true
      })
      .addCase(fetchVipAlerts.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.alerts = Array.isArray(action.payload) ? action.payload : []
        state.alertCount = state.alerts.filter(a => a.status === 'OPEN').length
      })
      .addCase(fetchVipAlerts.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to fetch alerts'
      })
      // Check minimum spend alerts
      .addCase(checkMinimumSpendAlerts.fulfilled, (state, action) => {
        // Alerts created, refetch to update list
        if (action.payload.alerts_created > 0) {
          state.alertCount += action.payload.alerts_created
        }
      })
      // Acknowledge alert
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        const alert = state.alerts.find(a => a.id === action.payload.id)
        if (alert) {
          alert.status = 'ACKNOWLEDGED'
          alert.acknowledged_at = action.payload.acknowledged_at
        }
      })
      // Resolve alert
      .addCase(resolveAlert.fulfilled, (state, action) => {
        const alert = state.alerts.find(a => a.id === action.payload.id)
        if (alert) {
          alert.status = 'RESOLVED'
        }
        // Decrease alert count
        state.alertCount = state.alerts.filter(a => a.status === 'OPEN').length
      })
  },
})

export const { updateRoom, startSession, endSession } = vipSlice.actions
export default vipSlice.reducer
