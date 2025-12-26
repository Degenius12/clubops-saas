import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../config/api';

// ============================================================================
// TYPES
// ============================================================================

export interface FeeTransaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  dueDate?: string;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: string;
  isOverdue?: boolean;
}

export interface EntertainerFees {
  entertainerId: string;
  stageName: string;
  legalName?: string;
  phone?: string;
  pending: {
    barFees: number;
    vipHouseFees: number;
    lateFees: number;
    tipOuts: number;
    other: number;
    total: number;
    transactions: FeeTransaction[];
  };
  paid: {
    barFees: number;
    vipHouseFees: number;
    lateFees: number;
    tipOuts: number;
    other: number;
    total: number;
    transactions: FeeTransaction[];
  };
  summary: {
    totalOwed: number;
    totalPaid: number;
    lifetimeTotal: number;
  };
}

export interface FeeSummary {
  collected: number;
  collectedCount: number;
  pending: number;
  pendingCount: number;
  waived: number;
  waivedCount: number;
  total: number;
  totalCount: number;
}

export interface EntertainerFeeSummary {
  entertainerId: string;
  stageName: string;
  collected: number;
  pending: number;
  total: number;
}

export interface PendingFeesResponse {
  totalPending: number;
  entertainerCount: number;
  transactionCount: number;
  entertainers: Array<{
    entertainerId: string;
    stageName: string;
    legalName?: string;
    phone?: string;
    transactions: FeeTransaction[];
    totalOwed: number;
  }>;
}

export interface CollectPaymentRequest {
  entertainerId: string;
  amount?: number;
  paymentMethod?: string;
  transactionIds?: string[];
  notes?: string;
  collectAll?: boolean;
}

export interface CollectPaymentResponse {
  success: boolean;
  message: string;
  payment: {
    entertainerId: string;
    stageName: string;
    amount: number;
    paymentMethod: string;
    transactionCount: number;
    paidAt: string;
  };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
  }>;
}

export interface WaiveFeeRequest {
  transactionId: string;
  reason: string;
}

export interface FeesState {
  // Current entertainer fees being viewed
  currentEntertainerFees: EntertainerFees | null;

  // All pending fees across all entertainers
  allPending: PendingFeesResponse | null;

  // Summary data for dashboard
  summary: FeeSummary | null;
  summaryByEntertainer: EntertainerFeeSummary[];

  // Date range for summary
  summaryDateRange: {
    startDate: string;
    endDate: string;
  } | null;

  // UI state
  loading: boolean;
  error: string | null;
  lastPaymentCollected: CollectPaymentResponse | null;
}

const initialState: FeesState = {
  currentEntertainerFees: null,
  allPending: null,
  summary: null,
  summaryByEntertainer: [],
  summaryDateRange: null,
  loading: false,
  error: null,
  lastPaymentCollected: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Fetch all fees for a specific entertainer
 */
export const fetchEntertainerFees = createAsyncThunk(
  'fees/fetchEntertainerFees',
  async (entertainerId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<EntertainerFees>(
        `/api/fees/entertainer/${entertainerId}`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch entertainer fees');
    }
  }
);

/**
 * Fetch all pending fees across all entertainers
 */
export const fetchAllPendingFees = createAsyncThunk(
  'fees/fetchAllPendingFees',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<PendingFeesResponse>('/api/fees/pending');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch pending fees');
    }
  }
);

/**
 * Fetch fee collection summary for date range
 */
export const fetchFeeSummary = createAsyncThunk(
  'fees/fetchFeeSummary',
  async (dateRange?: { startDate?: string; endDate?: string }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);

      const response = await apiClient.get<{
        summary: FeeSummary;
        byEntertainer: EntertainerFeeSummary[];
        dateRange: { startDate: string; endDate: string };
      }>(`/api/fees/summary?${params.toString()}`);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch fee summary');
    }
  }
);

/**
 * Collect payment from an entertainer
 */
export const collectPayment = createAsyncThunk(
  'fees/collectPayment',
  async (request: CollectPaymentRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<CollectPaymentResponse>(
        '/api/fees/collect-payment',
        request
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to collect payment');
    }
  }
);

/**
 * Waive a fee with manager override
 */
export const waiveFee = createAsyncThunk(
  'fees/waiveFee',
  async (request: WaiveFeeRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        transaction: {
          id: string;
          type: string;
          amount: number;
          status: string;
          reason: string;
        };
      }>('/api/fees/waive', request);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to waive fee');
    }
  }
);

/**
 * Calculate house fee for a check-in
 */
export const calculateHouseFee = createAsyncThunk(
  'fees/calculateHouseFee',
  async (checkInId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{
        checkInId: string;
        entertainerId: string;
        stageName: string;
        shift: {
          checkedInAt: string;
          checkedOutAt: string;
          durationHours: string;
          durationMinutes: number;
        };
        fee: {
          amount: number;
          calculation: string;
          type: string;
          alreadyPaid: boolean;
        };
      }>('/api/fees/calculate-house-fee', { checkInId });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to calculate house fee');
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

const feesSlice = createSlice({
  name: 'fees',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentEntertainerFees: (state) => {
      state.currentEntertainerFees = null;
    },
    clearLastPayment: (state) => {
      state.lastPaymentCollected = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Entertainer Fees
    builder
      .addCase(fetchEntertainerFees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEntertainerFees.fulfilled, (state, action: PayloadAction<EntertainerFees>) => {
        state.loading = false;
        state.currentEntertainerFees = action.payload;
      })
      .addCase(fetchEntertainerFees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch All Pending Fees
    builder
      .addCase(fetchAllPendingFees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPendingFees.fulfilled, (state, action: PayloadAction<PendingFeesResponse>) => {
        state.loading = false;
        state.allPending = action.payload;
      })
      .addCase(fetchAllPendingFees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Fee Summary
    builder
      .addCase(fetchFeeSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeeSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.summary;
        state.summaryByEntertainer = action.payload.byEntertainer;
        state.summaryDateRange = action.payload.dateRange;
      })
      .addCase(fetchFeeSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Collect Payment
    builder
      .addCase(collectPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(collectPayment.fulfilled, (state, action: PayloadAction<CollectPaymentResponse>) => {
        state.loading = false;
        state.lastPaymentCollected = action.payload;

        // Update current entertainer fees if viewing the same entertainer
        if (state.currentEntertainerFees?.entertainerId === action.payload.payment.entertainerId) {
          // Move pending transactions to paid
          const updatedTransactionIds = new Set(action.payload.transactions.map(t => t.id));

          if (state.currentEntertainerFees.pending.transactions) {
            const stillPending = state.currentEntertainerFees.pending.transactions.filter(
              tx => !updatedTransactionIds.has(tx.id)
            );

            const newlyPaid = state.currentEntertainerFees.pending.transactions.filter(
              tx => updatedTransactionIds.has(tx.id)
            );

            // Update pending
            state.currentEntertainerFees.pending.transactions = stillPending;
            state.currentEntertainerFees.pending.total -= action.payload.payment.amount;

            // Update paid (add newly paid transactions)
            state.currentEntertainerFees.paid.transactions = [
              ...newlyPaid.map(tx => ({ ...tx, status: 'PAID', paidAt: action.payload.payment.paidAt })),
              ...state.currentEntertainerFees.paid.transactions
            ];
            state.currentEntertainerFees.paid.total += action.payload.payment.amount;

            // Update summary
            state.currentEntertainerFees.summary.totalOwed -= action.payload.payment.amount;
            state.currentEntertainerFees.summary.totalPaid += action.payload.payment.amount;
          }
        }

        // Update all pending fees
        if (state.allPending) {
          const entertainerIndex = state.allPending.entertainers.findIndex(
            e => e.entertainerId === action.payload.payment.entertainerId
          );

          if (entertainerIndex !== -1) {
            const entertainer = state.allPending.entertainers[entertainerIndex];
            const updatedTransactionIds = new Set(action.payload.transactions.map(t => t.id));

            entertainer.transactions = entertainer.transactions.filter(
              tx => !updatedTransactionIds.has(tx.id)
            );
            entertainer.totalOwed -= action.payload.payment.amount;

            if (entertainer.totalOwed <= 0) {
              state.allPending.entertainers.splice(entertainerIndex, 1);
              state.allPending.entertainerCount--;
            }

            state.allPending.totalPending -= action.payload.payment.amount;
            state.allPending.transactionCount -= action.payload.payment.transactionCount;
          }
        }
      })
      .addCase(collectPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Waive Fee
    builder
      .addCase(waiveFee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(waiveFee.fulfilled, (state, action) => {
        state.loading = false;

        // Remove waived transaction from current entertainer fees
        if (state.currentEntertainerFees?.pending.transactions) {
          const waivedTxIndex = state.currentEntertainerFees.pending.transactions.findIndex(
            tx => tx.id === action.payload.transaction.id
          );

          if (waivedTxIndex !== -1) {
            const waivedAmount = state.currentEntertainerFees.pending.transactions[waivedTxIndex].amount;
            state.currentEntertainerFees.pending.transactions.splice(waivedTxIndex, 1);
            state.currentEntertainerFees.pending.total -= waivedAmount;
            state.currentEntertainerFees.summary.totalOwed -= waivedAmount;
          }
        }

        // Remove from all pending fees
        if (state.allPending) {
          for (const entertainer of state.allPending.entertainers) {
            const txIndex = entertainer.transactions.findIndex(
              tx => tx.id === action.payload.transaction.id
            );

            if (txIndex !== -1) {
              const waivedAmount = entertainer.transactions[txIndex].amount;
              entertainer.transactions.splice(txIndex, 1);
              entertainer.totalOwed -= waivedAmount;
              state.allPending.totalPending -= waivedAmount;
              state.allPending.transactionCount--;
              break;
            }
          }
        }
      })
      .addCase(waiveFee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Calculate House Fee (read-only, doesn't update state)
    builder
      .addCase(calculateHouseFee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateHouseFee.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(calculateHouseFee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentEntertainerFees, clearLastPayment } = feesSlice.actions;

export default feesSlice.reducer;
