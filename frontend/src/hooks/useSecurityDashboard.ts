// Security Dashboard Data Hook (Owner Only)
import { useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from './index';
import { useWebSocket } from './useWebSocket';
import {
  fetchIntegrityMetrics,
  fetchAuditLog,
  fetchSongComparisons,
  fetchAnomalies,
  investigateAnomaly,
  resolveAnomaly,
  dismissAnomaly,
  fetchEmployeePerformance,
  fetchReports,
  markReportViewed,
  selectAlert,
  addAlertFromSocket,
  updateMetricsFromSocket,
} from '../store/slices/securitySlice';
import { securityService } from '../services/securityService';

interface DateFilter {
  startDate?: string;
  endDate?: string;
}

export function useSecurityDashboard(clubId: string) {
  const dispatch = useAppDispatch();
  const [dateFilter, setDateFilter] = useState<DateFilter>({});
  
  // Redux state
  const {
    integrityMetrics,
    auditLog,
    songComparisons,
    anomalies,
    employeePerformance,
    reports,
    selectedAlert,
    isLoading,
    isLoadingMetrics,
    isLoadingAudit,
    isLoadingComparisons,
    isLoadingAnomalies,
    error,
  } = useAppSelector((state) => state.security);

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket({
    clubId,
    enabled: !!clubId,
    onNewAlert: (event) => {
      dispatch(addAlertFromSocket({
        id: event.alertId,
        clubId,
        alertType: event.alertType,
        severity: event.severity,
        status: 'PENDING',
        entityType: event.entityType,
        entityId: event.entityId,
        title: event.title,
        message: event.message,
        createdAt: new Date().toISOString(),
      }));
      // Refresh metrics when new alert arrives
      dispatch(fetchIntegrityMetrics());
    },
  });

  // Initial data fetch
  useEffect(() => {
    if (clubId) {
      dispatch(fetchIntegrityMetrics());
      dispatch(fetchAuditLog(dateFilter));
      dispatch(fetchSongComparisons(dateFilter));
      dispatch(fetchAnomalies());
      dispatch(fetchEmployeePerformance());
      dispatch(fetchReports());
    }
  }, [dispatch, clubId]);

  // Refresh when date filter changes
  useEffect(() => {
    if (clubId && (dateFilter.startDate || dateFilter.endDate)) {
      dispatch(fetchAuditLog(dateFilter));
      dispatch(fetchSongComparisons(dateFilter));
      dispatch(fetchEmployeePerformance(dateFilter));
    }
  }, [dispatch, clubId, dateFilter]);

  // Actions
  const handleInvestigate = useCallback(async (alertId: string) => {
    const result = await dispatch(investigateAnomaly(alertId));
    if (investigateAnomaly.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Failed to investigate');
  }, [dispatch]);

  const handleResolve = useCallback(async (alertId: string, resolution: string) => {
    const result = await dispatch(resolveAnomaly({ alertId, resolution }));
    if (resolveAnomaly.fulfilled.match(result)) {
      dispatch(fetchIntegrityMetrics()); // Refresh metrics
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Failed to resolve');
  }, [dispatch]);

  const handleDismiss = useCallback(async (alertId: string, reason?: string) => {
    const result = await dispatch(dismissAnomaly({ alertId, reason }));
    if (dismissAnomaly.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Failed to dismiss');
  }, [dispatch]);

  const handleSelectAlert = useCallback((alertId: string | null) => {
    dispatch(selectAlert(alertId));
  }, [dispatch]);

  const handleMarkReportViewed = useCallback(async (reportId: string) => {
    const result = await dispatch(markReportViewed(reportId));
    if (markReportViewed.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Failed to mark as viewed');
  }, [dispatch]);

  const handleExportAuditLog = useCallback(async (format: 'json' | 'csv') => {
    try {
      const blob = await securityService.exportAuditLog(format, dateFilter);
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }, [dateFilter]);

  const handleExportComparisons = useCallback(async (format: 'json' | 'csv') => {
    try {
      const blob = await securityService.exportComparisons(format, dateFilter);
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `song-comparisons.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }, [dateFilter]);

  const handleVerifyAuditChain = useCallback(async () => {
    try {
      return await securityService.verifyAuditChain(dateFilter);
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  }, [dateFilter]);

  const handleFilterByDate = useCallback((start?: string, end?: string) => {
    setDateFilter({ startDate: start, endDate: end });
  }, []);

  const handleFilterAnomalies = useCallback((params: {
    status?: string;
    severity?: string;
    alertType?: string;
  }) => {
    dispatch(fetchAnomalies({ ...dateFilter, ...params }));
  }, [dispatch, dateFilter]);

  const handleFilterAuditLog = useCallback((params: {
    action?: string;
    entityType?: string;
    userId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    dispatch(fetchAuditLog({ ...dateFilter, ...params }));
  }, [dispatch, dateFilter]);

  const handleFilterComparisons = useCallback((params: {
    flaggedOnly?: boolean;
    minVariance?: number;
    page?: number;
    limit?: number;
  }) => {
    dispatch(fetchSongComparisons({ ...dateFilter, ...params }));
  }, [dispatch, dateFilter]);

  const refreshData = useCallback(() => {
    dispatch(fetchIntegrityMetrics());
    dispatch(fetchAuditLog(dateFilter));
    dispatch(fetchSongComparisons(dateFilter));
    dispatch(fetchAnomalies());
    dispatch(fetchEmployeePerformance(dateFilter));
    dispatch(fetchReports());
  }, [dispatch, dateFilter]);

  // Computed values
  const pendingAlertsCount = anomalies.statusSummary.pending;
  const unviewedReportsCount = reports.filter((r) => !r.viewedByOwner).length;
  const flaggedComparisonsCount = songComparisons.comparisons.filter((c) => c.flagged).length;

  return {
    // State
    integrityMetrics,
    auditLog,
    songComparisons,
    anomalies,
    employeePerformance,
    reports,
    selectedAlert,
    dateFilter,
    isConnected,
    
    // Computed
    pendingAlertsCount,
    unviewedReportsCount,
    flaggedComparisonsCount,
    
    // Loading states
    isLoading,
    isLoadingMetrics,
    isLoadingAudit,
    isLoadingComparisons,
    isLoadingAnomalies,
    
    // Error
    error,
    
    // Actions
    handleInvestigate,
    handleResolve,
    handleDismiss,
    handleSelectAlert,
    handleMarkReportViewed,
    handleExportAuditLog,
    handleExportComparisons,
    handleVerifyAuditChain,
    handleFilterByDate,
    handleFilterAnomalies,
    handleFilterAuditLog,
    handleFilterComparisons,
    refreshData,
  };
}

export default useSecurityDashboard;
