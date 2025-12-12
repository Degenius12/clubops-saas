// Door Staff Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  doorStaffService,
  CheckedInDancer,
  DancerSearchResult,
  VerificationAlert,
  DoorStaffSummary,
  CheckInParams,
} from '../../services/doorStaffService';

interface DoorStaffState {
  presentDancers: CheckedInDancer[];
  departedDancers: CheckedInDancer[];
  searchResults: DancerSearchResult[];
  alerts: VerificationAlert[];
  summary: DoorStaffSummary | null;
  isLoading: boolean;
  isSearching: boolean;
  isCheckingIn: boolean;
  error: string | null;
  searchError: string | null;
}

const initialState: DoorStaffState = {
  presentDancers: [],
  departedDancers: [],
  searchResults: [],
  alerts: [],
  summary: null,
  isLoading: false,
  isSearching: false,
  isCheckingIn: false,
  error: null,
  searchError: null,
};

// Async Thunks
export const fetchCheckedInDancers = createAsyncThunk(
  'doorStaff/fetchCheckedIn',
  async (_, { rejectWithValue }) => {
    try {
      return await doorStaffService.getCheckedInDancers();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch checked-in dancers');
    }
  }
);

export const searchDancers = createAsyncThunk(
  'doorStaff/search',
  async (query: string, { rejectWithValue }) => {
    try {
      return await doorStaffService.searchDancers(query);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const lookupDancerByQR = createAsyncThunk(
  'doorStaff/lookupQR',
  async (code: string, { rejectWithValue }) => {
    try {
      return await doorStaffService.lookupByQR(code);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'QR lookup failed');
    }
  }
);

export const checkInDancer = createAsyncThunk(
  'doorStaff/checkIn',
  async (params: CheckInParams, { rejectWithValue }) => {
    try {
      return await doorStaffService.checkInDancer(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Check-in failed');
    }
  }
);

export const checkOutDancer = createAsyncThunk(
  'doorStaff/checkOut',
  async (checkInId: string, { rejectWithValue }) => {
    try {
      return await doorStaffService.checkOutDancer(checkInId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Check-out failed');
    }
  }
);

export const collectBarFee = createAsyncThunk(
  'doorStaff/collectBarFee',
  async (
    { checkInId, paymentMethod }: { checkInId: string; paymentMethod: 'CASH' | 'CARD' },
    { rejectWithValue }
  ) => {
    try {
      return await doorStaffService.collectBarFee(checkInId, paymentMethod);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Collection failed');
    }
  }
);

export const fetchAlerts = createAsyncThunk(
  'doorStaff/fetchAlerts',
  async (params: { status?: string; severity?: string } | undefined, { rejectWithValue }) => {
    try {
      return await doorStaffService.getAlerts(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch alerts');
    }
  }
);

export const acknowledgeAlert = createAsyncThunk(
  'doorStaff/acknowledgeAlert',
  async (alertId: string, { rejectWithValue }) => {
    try {
      return await doorStaffService.acknowledgeAlert(alertId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to acknowledge alert');
    }
  }
);

export const fetchDoorStaffSummary = createAsyncThunk(
  'doorStaff/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await doorStaffService.getSummary();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary');
    }
  }
);

// Slice
const doorStaffSlice = createSlice({
  name: 'doorStaff',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.searchError = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    addDancerFromSocket: (state, action: PayloadAction<CheckedInDancer>) => {
      // Add to present list if not already there
      if (!state.presentDancers.find((d) => d.id === action.payload.id)) {
        state.presentDancers.unshift(action.payload);
      }
    },
    removeDancerFromSocket: (state, action: PayloadAction<string>) => {
      const dancer = state.presentDancers.find((d) => d.id === action.payload);
      if (dancer) {
        state.presentDancers = state.presentDancers.filter((d) => d.id !== action.payload);
        state.departedDancers.unshift(dancer);
      }
    },
    addAlertFromSocket: (state, action: PayloadAction<VerificationAlert>) => {
      // Add alert to beginning of list
      state.alerts.unshift(action.payload);
    },
    updateSummaryFromSocket: (state, action: PayloadAction<Partial<DoorStaffSummary>>) => {
      if (state.summary) {
        state.summary = { ...state.summary, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Checked-In Dancers
      .addCase(fetchCheckedInDancers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCheckedInDancers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.presentDancers = action.payload.present;
        state.departedDancers = action.payload.departed;
      })
      .addCase(fetchCheckedInDancers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Search Dancers
      .addCase(searchDancers.pending, (state) => {
        state.isSearching = true;
        state.searchError = null;
      })
      .addCase(searchDancers.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchDancers.rejected, (state, action) => {
        state.isSearching = false;
        state.searchError = action.payload as string;
      })
      // QR Lookup
      .addCase(lookupDancerByQR.pending, (state) => {
        state.isSearching = true;
        state.searchError = null;
      })
      .addCase(lookupDancerByQR.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = [action.payload];
      })
      .addCase(lookupDancerByQR.rejected, (state, action) => {
        state.isSearching = false;
        state.searchError = action.payload as string;
      })
      // Check In
      .addCase(checkInDancer.pending, (state) => {
        state.isCheckingIn = true;
        state.error = null;
      })
      .addCase(checkInDancer.fulfilled, (state, action) => {
        state.isCheckingIn = false;
        state.presentDancers.unshift(action.payload);
        state.searchResults = [];
      })
      .addCase(checkInDancer.rejected, (state, action) => {
        state.isCheckingIn = false;
        state.error = action.payload as string;
      })
      // Check Out
      .addCase(checkOutDancer.fulfilled, (state, action) => {
        const index = state.presentDancers.findIndex((d) => d.id === action.payload.id);
        if (index >= 0) {
          state.presentDancers.splice(index, 1);
          state.departedDancers.unshift(action.payload);
        }
      })
      // Collect Bar Fee
      .addCase(collectBarFee.fulfilled, (state, action) => {
        const index = state.presentDancers.findIndex((d) => d.id === action.payload.id);
        if (index >= 0) {
          state.presentDancers[index] = action.payload;
        }
      })
      // Fetch Alerts
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.alerts = action.payload;
      })
      // Acknowledge Alert
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        const index = state.alerts.findIndex((a) => a.id === action.payload.id);
        if (index >= 0) {
          state.alerts[index] = action.payload;
        }
      })
      // Fetch Summary
      .addCase(fetchDoorStaffSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      });
  },
});

export const {
  clearError,
  clearSearchResults,
  addDancerFromSocket,
  removeDancerFromSocket,
  addAlertFromSocket,
  updateSummaryFromSocket,
} = doorStaffSlice.actions;
export default doorStaffSlice.reducer;
