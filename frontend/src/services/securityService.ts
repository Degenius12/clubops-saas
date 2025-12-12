// Security Dashboard API Service (Owner Only)
import apiClient from '../config/api';

// Types
export interface IntegrityMetrics {
  songCountMatchRate: number;
  checkInComplianceRate: number;
  revenueAccuracyRate: number;
  overallIntegrityScore: number;
  statusBadge: 'excellent' | 'good' | 'warning' | 'critical';
  trendDirection: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

export interface AuditLogEntry {
  id: string;
  clubId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  hash: string;
  previousHash?: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface SongCountComparison {
  sessionId: string;
  boothName: string;
  dancerName: string;
  vipHostName: string;
  startTime: string;
  endTime: string;
  duration: number;
  songCountManual: number;
  songCountDjSync?: number;
  songCountByTime: number;
  songCountFinal: number;
  variance: number;
  verificationStatus: string;
  customerConfirmed: boolean;
  flagged: boolean;
}

export interface AnomalyAlert {
  id: string;
  clubId: string;
  alertType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  entityType: string;
  entityId: string;
  title: string;
  message: string;
  details?: Record<string, any>;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
}

export interface EmployeePerformance {
  userId: string;
  userName: string;
  role: string;
  shiftsWorked: number;
  avgVariance: number;
  varianceTrend: 'improving' | 'stable' | 'worsening';
  collectionRate: number;
  flaggedIncidents: number;
  lastShift: string;
}

export interface AnomalyReport {
  id: string;
  clubId: string;
  reportDate: string;
  reportType: 'NIGHTLY' | 'WEEKLY' | 'MONTHLY';
  summary: {
    totalSessions: number;
    flaggedSessions: number;
    avgVariance: number;
    cashDiscrepancies: number;
    checkInViolations: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  viewedByOwner: boolean;
  viewedAt?: string;
  createdAt: string;
}

// API Functions
export const securityService = {
  // Get overall integrity metrics
  getIntegrityMetrics: async (): Promise<IntegrityMetrics> => {
    const response = await apiClient.get('/api/security/integrity');
    return response.data.metrics;
  },

  // Get audit log entries
  getAuditLog: async (params?: {
    action?: string;
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ entries: AuditLogEntry[]; total: number; page: number; limit: number }> => {
    const response = await apiClient.get('/api/security/audit-log', { params });
    return response.data;
  },

  // Get song count comparisons
  getSongComparisons: async (params?: {
    startDate?: string;
    endDate?: string;
    flaggedOnly?: boolean;
    minVariance?: number;
    page?: number;
    limit?: number;
  }): Promise<{
    comparisons: SongCountComparison[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await apiClient.get('/api/security/comparisons', { params });
    return response.data;
  },

  // Get anomaly alerts
  getAnomalies: async (params?: {
    status?: string;
    severity?: string;
    alertType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    alerts: AnomalyAlert[];
    statusSummary: {
      pending: number;
      acknowledged: number;
      resolved: number;
      dismissed: number;
    };
  }> => {
    const response = await apiClient.get('/api/security/anomalies', { params });
    return response.data;
  },

  // Investigate an anomaly (mark as acknowledged)
  investigateAnomaly: async (alertId: string): Promise<AnomalyAlert> => {
    const response = await apiClient.post(`/api/security/anomalies/${alertId}/investigate`);
    return response.data.alert;
  },

  // Resolve an anomaly
  resolveAnomaly: async (alertId: string, resolution: string): Promise<AnomalyAlert> => {
    const response = await apiClient.post(`/api/security/anomalies/${alertId}/resolve`, {
      resolution,
    });
    return response.data.alert;
  },

  // Dismiss an anomaly
  dismissAnomaly: async (alertId: string, reason?: string): Promise<AnomalyAlert> => {
    const response = await apiClient.post(`/api/security/anomalies/${alertId}/dismiss`, {
      reason,
    });
    return response.data.alert;
  },

  // Get employee performance metrics
  getEmployeePerformance: async (params?: {
    role?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<EmployeePerformance[]> => {
    const response = await apiClient.get('/api/security/employee-performance', { params });
    return response.data.employees;
  },

  // Get anomaly reports
  getReports: async (params?: {
    reportType?: string;
    startDate?: string;
    endDate?: string;
    unviewedOnly?: boolean;
  }): Promise<AnomalyReport[]> => {
    const response = await apiClient.get('/api/security/reports', { params });
    return response.data.reports;
  },

  // Mark report as viewed
  markReportViewed: async (reportId: string): Promise<AnomalyReport> => {
    const response = await apiClient.post(`/api/security/reports/${reportId}/viewed`);
    return response.data.report;
  },

  // Export audit log
  exportAuditLog: async (
    format: 'json' | 'csv',
    params?: {
      startDate?: string;
      endDate?: string;
      action?: string;
      entityType?: string;
    }
  ): Promise<Blob> => {
    const response = await apiClient.get('/api/security/export/audit', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Export song comparisons
  exportComparisons: async (
    format: 'json' | 'csv',
    params?: {
      startDate?: string;
      endDate?: string;
      flaggedOnly?: boolean;
    }
  ): Promise<Blob> => {
    const response = await apiClient.get('/api/security/export/comparisons', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Verify audit chain integrity
  verifyAuditChain: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    isValid: boolean;
    entriesChecked: number;
    issues: Array<{ entryId: string; issue: string }>;
  }> => {
    const response = await apiClient.get('/api/security/audit-log/verify', { params });
    return response.data;
  },
};

export default securityService;
