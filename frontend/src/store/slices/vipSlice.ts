import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'

export interface VipRoom {
  id: string
  name: string
  status: 'available' | 'occupied' | 'maintenance'
  dancer_name?: string
  start_time?: string
  elapsed_time?: number
  hourly_rate: number
}

interface VipState {
  rooms: VipRoom[]
  isLoading: boolean
  error: string | null
}

const initialState: VipState = {
  rooms: [
    { id: '1', name: 'VIP Room 1', status: 'occupied', dancer_name: 'Diamond Rose', start_time: '2024-08-26T18:00:00Z', elapsed_time: 1122, hourly_rate: 200 },
    { id: '2', name: 'VIP Room 2', status: 'occupied', dancer_name: 'Samantha Lee', start_time: '2024-08-26T19:30:00Z', elapsed_time: 735, hourly_rate: 200 },
    { id: '3', name: 'VIP Room 3', status: 'available', hourly_rate: 200 }
  ],
  isLoading: false,
  error: null,
}

// Async thunks
export const fetchVIPRooms = createAsyncThunk(
  'vip/fetchVIPRooms',
  async () => {
    // Mock API call - replace with actual API
    return {
      rooms: [
        { id: '1', name: 'VIP Room 1', status: 'occupied' as const, dancer_name: 'Diamond Rose', start_time: '2024-08-26T18:00:00Z', elapsed_time: 1122, hourly_rate: 200 },
        { id: '2', name: 'VIP Room 2', status: 'occupied' as const, dancer_name: 'Samantha Lee', start_time: '2024-08-26T19:30:00Z', elapsed_time: 735, hourly_rate: 200 },
        { id: '3', name: 'VIP Room 3', status: 'available' as const, hourly_rate: 200 }
      ]
    }
  }
)

export const updateRoomStatus = createAsyncThunk(
  'vip/updateRoomStatus',
  async ({ roomId, status }: { roomId: string, status: 'available' | 'occupied' | 'maintenance' }) => {
    // Mock API call - replace with actual API
    return { roomId, status }
  }
)

export const startRoomTimer = createAsyncThunk(
  'vip/startRoomTimer',
  async ({ roomId, dancerName }: { roomId: string, dancerName: string }) => {
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
      }
    },
    endSession: (state, action: PayloadAction<string>) => {
      const room = state.rooms.find(r => r.id === action.payload)
      if (room) {
        room.status = 'available'
        room.dancer_name = undefined
        room.start_time = undefined
        room.elapsed_time = undefined
      }
    }
  },
})

export const { updateRoom, startSession, endSession } = vipSlice.actions
export default vipSlice.reducer
