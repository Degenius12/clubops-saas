import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

export interface QueueItem {
  id: string
  dancer_id: string
  dancer_name: string
  song_title: string
  artist: string
  position: number
  stage: 'main' | 'vip' | 'side'
  status: 'queued' | 'current' | 'completed'
  duration?: number
  created_at: string
}

export interface CurrentPerformance {
  dancer_id: string
  dancer_name: string
  song_title: string
  artist: string
  start_time: string
  duration: number
  remaining_time: number
  stage: string
}

interface QueueState {
  mainQueue: QueueItem[]
  vipQueue: QueueItem[]
  currentPerformances: CurrentPerformance[]
  isLoading: boolean
  error: string | null
  draggedItem: QueueItem | null
}

const initialState: QueueState = {
  mainQueue: [],
  vipQueue: [],
  currentPerformances: [],
  isLoading: false,
  error: null,
  draggedItem: null,
}

// Async thunks for queue management
export const fetchQueue = createAsyncThunk(
  'queue/fetchAll',
  async () => {
    const response = await axios.get('/api/queue')
    return response.data
  }
)

export const addToQueue = createAsyncThunk(
  'queue/add',
  async ({ dancerId, songTitle, artist, stage }: { 
    dancerId: string
    songTitle: string
    artist: string
    stage: 'main' | 'vip' | 'side'
  }) => {
    const response = await axios.post('/api/queue', {
      dancer_id: dancerId,
      song_title: songTitle,
      artist,
      stage
    })
    return response.data
  }
)

export const reorderQueue = createAsyncThunk(
  'queue/reorder',
  async ({ stage, itemId, newPosition }: { 
    stage: string
    itemId: string
    newPosition: number 
  }) => {
    const response = await axios.put(`/api/queue/${itemId}/position`, {
      position: newPosition,
      stage
    })
    return response.data
  }
)

export const startPerformance = createAsyncThunk(
  'queue/start',
  async (queueItemId: string) => {
    const response = await axios.post(`/api/queue/${queueItemId}/start`)
    return response.data
  }
)

export const endPerformance = createAsyncThunk(
  'queue/end',
  async (performanceId: string) => {
    const response = await axios.post(`/api/queue/${performanceId}/end`)
    return response.data
  }
)

export const playTrack = createAsyncThunk(
  'queue/playTrack',
  async (trackId: string) => {
    // Mock implementation - replace with actual music player API
    return { trackId, status: 'playing' }
  }
)

export const pauseTrack = createAsyncThunk(
  'queue/pauseTrack',
  async (trackId: string) => {
    // Mock implementation - replace with actual music player API
    return { trackId, status: 'paused' }
  }
)

export const nextTrack = createAsyncThunk(
  'queue/nextTrack',
  async () => {
    // Mock implementation - replace with actual music player API
    return { action: 'next' }
  }
)

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    setDraggedItem: (state, action: PayloadAction<QueueItem | null>) => {
      state.draggedItem = action.payload
    },
    reorderMainQueue: (state, action: PayloadAction<QueueItem[]>) => {
      state.mainQueue = action.payload
    },
    reorderVipQueue: (state, action: PayloadAction<QueueItem[]>) => {
      state.vipQueue = action.payload
    },
    updateCurrentPerformance: (state, action: PayloadAction<CurrentPerformance>) => {
      const index = state.currentPerformances.findIndex(p => p.dancer_id === action.payload.dancer_id)
      if (index !== -1) {
        state.currentPerformances[index] = action.payload
      } else {
        state.currentPerformances.push(action.payload)
      }
    },
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.mainQueue = state.mainQueue.filter(item => item.id !== action.payload)
      state.vipQueue = state.vipQueue.filter(item => item.id !== action.payload)
    }
  },
  extraReducers: (builder) => {
    // Fetch queue
    builder
      .addCase(fetchQueue.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchQueue.fulfilled, (state, action) => {
        state.isLoading = false
        state.mainQueue = action.payload.mainQueue || []
        state.vipQueue = action.payload.vipQueue || []
        state.currentPerformances = action.payload.currentPerformances || []
      })
      .addCase(fetchQueue.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch queue'
      })
      // Add to queue
      .addCase(addToQueue.fulfilled, (state, action) => {
        const newItem = action.payload
        if (newItem.stage === 'main') {
          state.mainQueue.push(newItem)
        } else {
          state.vipQueue.push(newItem)
        }
      })
      // Start performance
      .addCase(startPerformance.fulfilled, (state, action) => {
        const performance = action.payload
        state.currentPerformances.push(performance)
        // Remove from queue
        state.mainQueue = state.mainQueue.filter(item => item.dancer_id !== performance.dancer_id)
        state.vipQueue = state.vipQueue.filter(item => item.dancer_id !== performance.dancer_id)
      })
      // End performance
      .addCase(endPerformance.fulfilled, (state, action) => {
        const performanceId = action.payload.id
        state.currentPerformances = state.currentPerformances.filter(p => p.dancer_id !== performanceId)
      })
  },
})

export const { 
  setDraggedItem, 
  reorderMainQueue, 
  reorderVipQueue, 
  updateCurrentPerformance,
  removeFromQueue 
} = queueSlice.actions
export default queueSlice.reducer
