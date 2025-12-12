// Shift Management Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { shiftService, Shift, StartShiftParams, EndShiftParams } from '../../services/shiftService';

interface ShiftState {
  activeShift: Shift | null;
  shifts: Shift[];
  isLoading: boolean;
  error: string | null;
  isStartingShift: boolean;
  isEndingShift: boolean;
}

const initialState: ShiftState = {
  activeShift: null,
  shifts: [],
  isLoading: false,
  error: null,
  isStartingShift: false,
  isEndingShift: false,
};

// Async Thunks
export const fetchActiveShift = createAsyncThunk(
  'shift/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      return await shiftService.getActiveShift();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active shift');
    }
  }
);

export const fetchShifts = createAsyncThunk(
  'shift/fetchAll',
  async (
    params: {
      status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
      userId?: string;
      startDate?: string;
      endDate?: string;
    } | undefined,
    { rejectWithValue }
  ) => {
    try {
      return await shiftService.getShifts(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch shifts');
    }
  }
);

export const startShift = createAsyncThunk(
  'shift/start',
  async (params: StartShiftParams, { rejectWithValue }) => {
    try {
      return await shiftService.startShift(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start shift');
    }
  }
);

export const endShift = createAsyncThunk(
  'shift/end',
  async (params: EndShiftParams, { rejectWithValue }) => {
    try {
      return await shiftService.endShift(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end shift');
    }
  }
);

// Slice
const shiftSlice = createSlice({
  name: 'shift',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearActiveShift: (state) => {
      state.activeShift = null;
    },
    updateShiftFromSocket: (state, action: PayloadAction<Partial<Shift>>) => {
      if (state.activeShift && action.payload.id === state.activeShift.id) {
        state.activeShift = { ...state.activeShift, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Active Shift
      .addCase(fetchActiveShift.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveShift.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeShift = action.payload;
      })
      .addCase(fetchActiveShift.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch All Shifts
      .addCase(fetchShifts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchShifts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.shifts = action.payload.shifts;
      })
      .addCase(fetchShifts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Start Shift
      .addCase(startShift.pending, (state) => {
        state.isStartingShift = true;
        state.error = null;
      })
      .addCase(startShift.fulfilled, (state, action) => {
        state.isStartingShift = false;
        state.activeShift = action.payload;
      })
      .addCase(startShift.rejected, (state, action) => {
        state.isStartingShift = false;
        state.error = action.payload as string;
      })
      // End Shift
      .addCase(endShift.pending, (state) => {
        state.isEndingShift = true;
        state.error = null;
      })
      .addCase(endShift.fulfilled, (state, action) => {
        state.isEndingShift = false;
        state.activeShift = null;
        // Add completed shift to list if present
        const existingIndex = state.shifts.findIndex((s) => s.id === action.payload.id);
        if (existingIndex >= 0) {
          state.shifts[existingIndex] = action.payload;
        } else {
          state.shifts.unshift(action.payload);
        }
      })
      .addCase(endShift.rejected, (state, action) => {
        state.isEndingShift = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearActiveShift, updateShiftFromSocket } = shiftSlice.actions;
export default shiftSlice.reducer;
