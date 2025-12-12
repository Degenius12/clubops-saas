// VIP Host Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  vipHostService,
  VipBooth,
  VipSession,
  AvailableDancer,
  VipHostSummary,
  StartSessionParams,
  EndSessionParams,
} from '../../services/vipHostService';

interface VipHostState {
  booths: VipBooth[];
  activeSessions: VipSession[];
  availableDancers: AvailableDancer[];
  summary: VipHostSummary | null;
  selectedSession: VipSession | null;
  confirmationData: {
    session: VipSession;
    songBreakdown: any;
    charges: any;
  } | null;
  isLoading: boolean;
  isStartingSession: boolean;
  isEndingSession: boolean;
  error: string | null;
}

const initialState: VipHostState = {
  booths: [],
  activeSessions: [],
  availableDancers: [],
  summary: null,
  selectedSession: null,
  confirmationData: null,
  isLoading: false,
  isStartingSession: false,
  isEndingSession: false,
  error: null,
};

// Async Thunks
export const fetchBooths = createAsyncThunk(
  'vipHost/fetchBooths',
  async (_, { rejectWithValue }) => {
    try {
      return await vipHostService.getBooths();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch booths');
    }
  }
);

export const fetchAvailableDancers = createAsyncThunk(
  'vipHost/fetchAvailableDancers',
  async (_, { rejectWithValue }) => {
    try {
      return await vipHostService.getAvailableDancers();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch available dancers');
    }
  }
);

export const fetchActiveSessions = createAsyncThunk(
  'vipHost/fetchActiveSessions',
  async (_, { rejectWithValue }) => {
    try {
      return await vipHostService.getActiveSessions();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active sessions');
    }
  }
);

export const startVipSession = createAsyncThunk(
  'vipHost/startSession',
  async (params: StartSessionParams, { rejectWithValue }) => {
    try {
      return await vipHostService.startSession(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start session');
    }
  }
);

export const updateSongCount = createAsyncThunk(
  'vipHost/updateSongCount',
  async ({ sessionId, songCount }: { sessionId: string; songCount: number }, { rejectWithValue }) => {
    try {
      return await vipHostService.updateSongCount(sessionId, songCount);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update song count');
    }
  }
);

export const endVipSession = createAsyncThunk(
  'vipHost/endSession',
  async (
    { sessionId, data }: { sessionId: string; data?: EndSessionParams },
    { rejectWithValue }
  ) => {
    try {
      return await vipHostService.endSession(sessionId, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end session');
    }
  }
);

export const fetchConfirmationDisplay = createAsyncThunk(
  'vipHost/fetchConfirmation',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      return await vipHostService.getConfirmationDisplay(sessionId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch confirmation data');
    }
  }
);

export const confirmSession = createAsyncThunk(
  'vipHost/confirmSession',
  async (
    { sessionId, confirmed, signature }: { sessionId: string; confirmed: boolean; signature?: string },
    { rejectWithValue }
  ) => {
    try {
      return await vipHostService.confirmSession(sessionId, { confirmed, signature });
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to confirm session');
    }
  }
);

export const disputeSession = createAsyncThunk(
  'vipHost/disputeSession',
  async ({ sessionId, reason }: { sessionId: string; reason: string }, { rejectWithValue }) => {
    try {
      return await vipHostService.disputeSession(sessionId, reason);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record dispute');
    }
  }
);

export const fetchVipHostSummary = createAsyncThunk(
  'vipHost/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await vipHostService.getSummary();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary');
    }
  }
);

// Slice
const vipHostSlice = createSlice({
  name: 'vipHost',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    selectSession: (state, action: PayloadAction<string | null>) => {
      state.selectedSession =
        state.activeSessions.find((s) => s.id === action.payload) || null;
    },
    clearConfirmationData: (state) => {
      state.confirmationData = null;
    },
    updateSessionFromSocket: (state, action: PayloadAction<VipSession>) => {
      const index = state.activeSessions.findIndex((s) => s.id === action.payload.id);
      if (index >= 0) {
        state.activeSessions[index] = action.payload;
      }
      if (state.selectedSession?.id === action.payload.id) {
        state.selectedSession = action.payload;
      }
    },
    addSessionFromSocket: (state, action: PayloadAction<VipSession>) => {
      if (!state.activeSessions.find((s) => s.id === action.payload.id)) {
        state.activeSessions.unshift(action.payload);
      }
      // Update booth status
      const booth = state.booths.find((b) => b.id === action.payload.boothId);
      if (booth) {
        booth.status = 'OCCUPIED';
        booth.currentSession = action.payload;
      }
    },
    removeSessionFromSocket: (state, action: PayloadAction<string>) => {
      const session = state.activeSessions.find((s) => s.id === action.payload);
      state.activeSessions = state.activeSessions.filter((s) => s.id !== action.payload);
      if (state.selectedSession?.id === action.payload) {
        state.selectedSession = null;
      }
      // Update booth status
      if (session) {
        const booth = state.booths.find((b) => b.id === session.boothId);
        if (booth) {
          booth.status = 'AVAILABLE';
          booth.currentSession = undefined;
        }
      }
    },
    updateSongCountFromSocket: (
      state,
      action: PayloadAction<{ sessionId: string; songCount: number }>
    ) => {
      const session = state.activeSessions.find((s) => s.id === action.payload.sessionId);
      if (session) {
        session.songCountManual = action.payload.songCount;
      }
      if (state.selectedSession?.id === action.payload.sessionId) {
        state.selectedSession.songCountManual = action.payload.songCount;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Booths
      .addCase(fetchBooths.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBooths.fulfilled, (state, action) => {
        state.isLoading = false;
        state.booths = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchBooths.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Available Dancers
      .addCase(fetchAvailableDancers.fulfilled, (state, action) => {
        state.availableDancers = Array.isArray(action.payload) ? action.payload : [];
      })
      // Fetch Active Sessions
      .addCase(fetchActiveSessions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchActiveSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeSessions = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchActiveSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Start Session
      .addCase(startVipSession.pending, (state) => {
        state.isStartingSession = true;
        state.error = null;
      })
      .addCase(startVipSession.fulfilled, (state, action) => {
        state.isStartingSession = false;
        state.activeSessions.unshift(action.payload);
        // Update booth status
        const booth = state.booths.find((b) => b.id === action.payload.boothId);
        if (booth) {
          booth.status = 'OCCUPIED';
          booth.currentSession = action.payload;
        }
        // Remove dancer from available list
        state.availableDancers = state.availableDancers.filter(
          (d) => d.id !== action.payload.dancerId
        );
      })
      .addCase(startVipSession.rejected, (state, action) => {
        state.isStartingSession = false;
        state.error = action.payload as string;
      })
      // Update Song Count
      .addCase(updateSongCount.fulfilled, (state, action) => {
        const index = state.activeSessions.findIndex((s) => s.id === action.payload.id);
        if (index >= 0) {
          state.activeSessions[index] = action.payload;
        }
        if (state.selectedSession?.id === action.payload.id) {
          state.selectedSession = action.payload;
        }
      })
      // End Session
      .addCase(endVipSession.pending, (state) => {
        state.isEndingSession = true;
        state.error = null;
      })
      .addCase(endVipSession.fulfilled, (state, action) => {
        state.isEndingSession = false;
        state.activeSessions = state.activeSessions.filter((s) => s.id !== action.payload.id);
        if (state.selectedSession?.id === action.payload.id) {
          state.selectedSession = null;
        }
        // Update booth status
        const booth = state.booths.find((b) => b.id === action.payload.boothId);
        if (booth) {
          booth.status = 'AVAILABLE';
          booth.currentSession = undefined;
        }
      })
      .addCase(endVipSession.rejected, (state, action) => {
        state.isEndingSession = false;
        state.error = action.payload as string;
      })
      // Fetch Confirmation Display
      .addCase(fetchConfirmationDisplay.fulfilled, (state, action) => {
        state.confirmationData = action.payload;
      })
      // Confirm/Dispute Session
      .addCase(confirmSession.fulfilled, (state, action) => {
        const index = state.activeSessions.findIndex((s) => s.id === action.payload.id);
        if (index >= 0) {
          state.activeSessions[index] = action.payload;
        }
        state.confirmationData = null;
      })
      .addCase(disputeSession.fulfilled, (state, action) => {
        const index = state.activeSessions.findIndex((s) => s.id === action.payload.id);
        if (index >= 0) {
          state.activeSessions[index] = action.payload;
        }
        state.confirmationData = null;
      })
      // Fetch Summary
      .addCase(fetchVipHostSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      });
  },
});

export const {
  clearError,
  selectSession,
  clearConfirmationData,
  updateSessionFromSocket,
  addSessionFromSocket,
  removeSessionFromSocket,
  updateSongCountFromSocket,
} = vipHostSlice.actions;
export default vipHostSlice.reducer;
