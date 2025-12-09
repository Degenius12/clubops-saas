import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'

export interface VipRoom {
  id: string
  name: string
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning'
  dancer_name?: string
  start_time?: string
  elapsed_time?: number
  hourly_rate: number
  hourlyRate?: number // alias for hourly_rate for compatibility
  currentSession?: {
    dancerName: string
    startTime: string
    elapsedTime: number
  }
}

interface VipState {
  rooms: VipRoom[]
  isLoading: boolean
  loading: boolean // alias for isLoading for compatibility
  error: string | null
}

const initialState: VipState = {
  rooms: [
    { 
      id: '1', 
      name: 'VIP Booth 1', 
      status: 'occupied', 
      dancer_name: 'Diamond Rose', 
      start_time: '2024-08-26T18:00:00Z', 
      elapsed_time: 1122, 
      hourly_rate: 200,
      hourlyRate: 200,
      currentSession: {
        dancerName: 'Diamond Rose',
        startTime: '2024-08-26T18:00:00Z',
        elapsedTime: 1122
      }
    },
    { 
      id: '2', 
      name: 'VIP Booth 2', 
      status: 'occupied', 
      dancer_name: 'Samantha Lee', 
      start_time: '2024-08-26T19:30:00Z', 
      elapsed_time: 735, 
      hourly_rate: 200,
      hourlyRate: 200,
      currentSession: {
        dancerName: 'Samantha Lee',
        startTime: '2024-08-26T19:30:00Z',
        elapsedTime: 735
      }
    },
    { 
      id: '3', 
      name: 'VIP Booth 3', 
      status: 'available', 
      hourly_rate: 200,
      hourlyRate: 200
    }
  ],
  isLoading: false,
  loading: false,
  error: null,
}

// Async thunks
export const fetchVIPRooms = createAsyncThunk(
  'vip/fetchVIPRooms',
  async () => {
    // Mock API call - replace with actual API
    return {
      rooms: [
        { id: '1', name: 'VIP Booth 1', status: 'occupied' as const, dancer_name: 'Diamond Rose', start_time: '2024-08-26T18:00:00Z', elapsed_time: 1122, hourly_rate: 200 },
        { id: '2', name: 'VIP Booth 2', status: 'occupied' as const, dancer_name: 'Samantha Lee', start_time: '2024-08-26T19:30:00Z', elapsed_time: 735, hourly_rate: 200 },
        { id: '3', name: 'VIP Booth 3', status: 'available' as const, hourly_rate: 200 }
      ]
    }
  }
)

export const updateRoomStatus = createAsyncThunk(
  'vip/updateRoomStatus',
  async ({ roomId, status }: { roomId: string, status: 'available' | 'occupied' | 'maintenance' | 'cleaning' }) => {
    // Mock API call - replace with actual API
    return { roomId, status }
  }
)

export const startRoomTimer = createAsyncThunk(
  'vip/startRoomTimer',
  async (params: string | { roomId: string, dancerName: string }) => {
    let roomId: string
    let dancerName: string
    
    if (typeof params === 'string') {
      roomId = params
      dancerName = 'Anonymous'
    } else {
      roomId = params.roomId
      dancerName = params.dancerName
    }
    
    // Mock API call - replace with actual API
    return { roomId, dancerName, startTime: new Date().toISOString() }
  }
)

export const stopRoomTimer = createAsyncThunk(
  'vip/stopRoomTimer',
  async (roomId: string) => {
    // Mock API call - replace with actual API
    return { roomId }
  }
)

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
      .addCase(fetchVIPRooms.pending, (state) => {
        state.isLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(fetchVIPRooms.fulfilled, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.rooms = action.payload.rooms
      })
      .addCase(fetchVIPRooms.rejected, (state, action) => {
        state.isLoading = false
        state.loading = false
        state.error = action.error.message || 'Failed to fetch VIP booths'
      })
      .addCase(updateRoomStatus.fulfilled, (state, action) => {
        const room = state.rooms.find(r => r.id === action.payload.roomId)
        if (room) {
          room.status = action.payload.status
        }
      })
      .addCase(startRoomTimer.fulfilled, (state, action) => {
        const room = state.rooms.find(r => r.id === action.payload.roomId)
        if (room) {
          room.status = 'occupied'
          room.dancer_name = action.payload.dancerName
          room.start_time = action.payload.startTime
          room.currentSession = {
            dancerName: action.payload.dancerName,
            startTime: action.payload.startTime,
            elapsedTime: 0
          }
        }
      })
      .addCase(stopRoomTimer.fulfilled, (state, action) => {
        const room = state.rooms.find(r => r.id === action.payload.roomId)
        if (room) {
          room.status = 'available'
          room.dancer_name = undefined
          room.start_time = undefined
          room.currentSession = undefined
        }
      })
  },
})

export const { updateRoom, startSession, endSession } = vipSlice.actions
export default vipSlice.reducer
