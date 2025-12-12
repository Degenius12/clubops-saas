// Security Dashboard Redux Slice (Owner Only)
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  securityService,
  IntegrityMetrics,
  AuditLogEntry,
  SongCountComparison,
  AnomalyAlert,
  EmployeePerformance,
  AnomalyReport,
} from '../../services/securityService';

interface SecurityState {
  integrityMetrics: IntegrityMetrics | null;
  auditLog: {
    entries: AuditLogEntry[];
    total: number;
    page: number;
    limit: number;
  };
  songComparisons: {
    comparisons: SongCountComparison[];
    total: number;
    page: number;
    limit: number;
  };
  anomalies: {
    alerts: AnomalyAlert[];
    statusSummary: {
      pending: number;
      acknowledged: number;
      resolved: number;
      dismissed: number;
    };
  };
  employeePerformance: EmployeePerformance[];
  reports: AnomalyReport[];
  selectedAlert: AnomalyAlert | null;
  isLoading: boolean;
  isLoadingMetrics: boolean;
  isLoadingAudit: boolean;
  isLoadingComparisons: boolean;
  isLoadingAnomalies: boolean;
  error: string | null;
}

const initialState: SecurityState = {
  integrityMetrics: null,
  auditLog: { entries: [], total: 0, page: 1, limit: 50 },
  songComparisons: { comparisons: [], total: 0, page: 1, limit: 50 },
  anomalies: {
    alerts: [],
    statusSummary: { pending: 0, acknowledged: 0, resolved: 0, dismissed: 0 },
  },
  employeePerformance: [],
  reports: [],
  selectedAlert: null,
  isLoading: false,
  isLoadingMetrics: false,
  isLoadingAudit: false,
  isLoadingComparisons: false,
  isLoadingAnomalies: false,
  error: null,
};

// Async Thunks
export const fetchIntegrityMetrics = createAsyncThunk(
  'security/fetchIntegrityMetrics',
  async (_, { rejectWithValue }) => {
    try {
      return await securityService.getIntegrityMetrics();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch integrity metrics');
    }
  }
);

export const fetchAuditLog = createAsyncThunk(
  'security/fetchAuditLog',
  async (
    params: {
      action?: string;
      entityType?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    } | undefined,
    { rejectWithValue }
  ) => {
    try {
      return await securityService.getAuditLog(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch audit log');
    }
  }
);

export const fetchSongComparisons = createAsyncThunk(
  'security/fetchSongComparisons',
  async (
    params: {
      startDate?: string;
      endDate?: string;
      flaggedOnly?: boolean;
      minVariance?: number;
      page?: number;
      limit?: number;
    } | undefined,
    { rejectWithValue }
  ) => {
    try {
      return await securityService.getSongComparisons(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch song comparisons');
    }
  }
);

export const fetchAnomalies = createAsyncThunk(
  'security/fetchAnomalies',
  async (
    params: {
      status?: string;
      severity?: string;
      alertType?: string;
      startDate?: string;
      endDate?: string;
    } | undefined,
    { rejectWithValue }
  ) => {
    try {
      return await securityService.getAnomalies(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch anomalies');
    }
  }
);

export const investigateAnomaly = createAsyncThunk(
  'security/investigateAnomaly',
  async (alertId: string, { rejectWithValue }) => {
    try {
      return await securityService.investigateAnomaly(alertId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to investigate anomaly');
    }
  }
);

export const resolveAnomaly = createAsyncThunk(
  'security/resolveAnomaly',
  async ({ alertId, resolution }: { alertId: string; resolution: string }, { rejectWithValue }) => {
    try {
      return await securityService.resolveAnomaly(alertId, resolution);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resolve anomaly');
    }
  }
);

export const dismissAnomaly = createAsyncThunk(
  'security/dismissAnomaly',
  async ({ alertId, reason }: { alertId: string; reason?: string }, { rejectWithValue }) => {
    try {
      return await securityService.dismissAnomaly(alertId, reason);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to dismiss anomaly');
    }
  }
);

export const fetchEmployeePerformance = createAsyncThunk(
  'security/fetchEmployeePerformance',
  async (
    params: { role?: string; startDate?: string; endDate?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      return await securityService.getEmployeePerformance(params);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch employee performance'
      );
    }
  }
);

export const fetchReports = createAsyncThunk(
  'security/fetchReports',
  async (
    params: {
      reportType?: string;
      startDate?: string;
      endDate?: string;
      unviewedOnly?: boolean;
    } | undefined,
    { rejectWithValue }
  ) => {
    try {
      return await securityService.getReports(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reports');
    }
  }
);

export const markReportViewed = createAsyncThunk(
  'security/markReportViewed',
  async (reportId: string, { rejectWithValue }) => {
    try {
      return await securityService.markReportViewed(reportId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark report as viewed');
    }
  }
);

// Slice
const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    selectAlert: (state, action: PayloadAction<string | null>) => {
      state.selectedAlert = state.anomalies.alerts.find((a) => a.id === action.payload) || null;
    },
    addAlertFromSocket: (state, action: PayloadAction<AnomalyAlert>) => {
      state.anomalies.alerts.unshift(action.payload);
      state.anomalies.statusSummary.pending += 1;
    },
    updateMetricsFromSocket: (state, action: PayloadAction<Partial<IntegrityMetrics>>) => {
      if (state.integrityMetrics) {
        state.integrityMetrics = { ...state.integrityMetrics, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Integrity Metrics
      .addCase(fetchIntegrityMetrics.pending, (state) => {
        state.isLoadingMetrics = true;
        state.error = null;
      })
      .addCase(fetchIntegrityMetrics.fulfilled, (state, action) => {
        state.isLoadingMetrics = false;
        state.integrityMetrics = action.payload;
      })
      .addCase(fetchIntegrityMetrics.rejected, (state, action) => {
        state.isLoadingMetrics = false;
        state.error = action.payload as string;
      })
      // Fetch Audit Log
      .addCase(fetchAuditLog.pending, (state) => {
        state.isLoadingAudit = true;
        state.error = null;
      })
      .addCase(fetchAuditLog.fulfilled, (state, action) => {
        state.isLoadingAudit = false;
        state.auditLog = action.payload;
      })
      .addCase(fetchAuditLog.rejected, (state, action) => {
        state.isLoadingAudit = false;
        state.error = action.payload as string;
      })
      // Fetch Song Comparisons
      .addCase(fetchSongComparisons.pending, (state) => {
        state.isLoadingComparisons = true;
        state.error = null;
      })
      .addCase(fetchSongComparisons.fulfilled, (state, action) => {
        state.isLoadingComparisons = false;
        state.songComparisons = action.payload;
      })
      .addCase(fetchSongComparisons.rejected, (state, action) => {
        state.isLoadingComparisons = false;
        state.error = action.payload as string;
      })
      // Fetch Anomalies
      .addCase(fetchAnomalies.pending, (state) => {
        state.isLoadingAnomalies = true;
        state.error = null;
      })
      .addCase(fetchAnomalies.fulfilled, (state, action) => {
        state.isLoadingAnomalies = false;
        state.anomalies = action.payload;
      })
      .addCase(fetchAnomalies.rejected, (state, action) => {
        state.isLoadingAnomalies = false;
        state.error = action.payload as string;
      })
      // Investigate Anomaly
      .addCase(investigateAnomaly.fulfilled, (state, action) => {
        const index = state.anomalies.alerts.findIndex((a) => a.id === action.payload.id);
        if (index >= 0) {
          const oldStatus = state.anomalies.alerts[index].status.toLowerCase();
          state.anomalies.alerts[index] = action.payload;
          // Update status summary
          if (oldStatus === 'pending') state.anomalies.statusSummary.pending -= 1;
          state.anomalies.statusSummary.acknowledged += 1;
        }
        if (state.selectedAlert?.id === action.payload.id) {
          state.selectedAlert = action.payload;
        }
      })
      // Resolve Anomaly
      .addCase(resolveAnomaly.fulfilled, (state, action) => {
        const index = state.anomalies.alerts.findIndex((a) => a.id === action.payload.id);
        if (index >= 0) {
          const oldStatus = state.anomalies.alerts[index].status.toLowerCase();
          state.anomalies.alerts[index] = action.payload;
          // Update status summary
          if (oldStatus === 'pending') state.anomalies.statusSummary.pending -= 1;
          if (oldStatus === 'acknowledged') state.anomalies.statusSummary.acknowledged -= 1;
          state.anomalies.statusSummary.resolved += 1;
        }
        if (state.selectedAlert?.id === action.payload.id) {
          state.selectedAlert = action.payload;
        }
      })
      // Dismiss Anomaly
      .addCase(dismissAnomaly.fulfilled, (state, action) => {
        const index = state.anomalies.alerts.findIndex((a) => a.id === action.payload.id);
        if (index >= 0) {
          const oldStatus = state.anomalies.alerts[index].status.toLowerCase();
          state.anomalies.alerts[index] = action.payload;
          // Update status summary
          if (oldStatus === 'pending') state.anomalies.statusSummary.pending -= 1;
          if (oldStatus === 'acknowledged') state.anomalies.statusSummary.acknowledged -= 1;
          state.anomalies.statusSummary.dismissed += 1;
        }
        if (state.selectedAlert?.id === action.payload.id) {
          state.selectedAlert = null;
        }
      })
      // Fetch Employee Performance
      .addCase(fetchEmployeePerformance.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchEmployeePerformance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employeePerformance = action.payload;
      })
      .addCase(fetchEmployeePerformance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Reports
      .addCase(fetchReports.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Mark Report Viewed
      .addCase(markReportViewed.fulfilled, (state, action) => {
        const index = state.reports.findIndex((r) => r.id === action.payload.id);
        if (index >= 0) {
          state.reports[index] = action.payload;
        }
      });
  },
});

export const { clearError, selectAlert, addAlertFromSocket, updateMetricsFromSocket } =
  securitySlice.actions;
export default securitySlice.reducer;
