// Door Staff API Service
import apiClient from '../config/api';

// Types
export interface CheckedInDancer {
  id: string;
  dancerId: string;
  shiftId: string;
  checkInTime: string;
  checkOutTime?: string;
  barFeeAmount: number;
  barFeeStatus: 'PAID' | 'DEFERRED' | 'WAIVED' | 'COLLECTED';
  barFeePaymentMethod?: 'CASH' | 'CARD';
  notes?: string;
  verifiedBy?: string;
  dancer: {
    id: string;
    stageName: string;
    firstName?: string;
    lastName?: string;
    licenseNumber?: string;
    licenseExpiry?: string;
    licenseStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
    photoUrl?: string;
    qrBadgeCode?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DancerSearchResult {
  id: string;
  stageName: string;
  firstName?: string;
  lastName?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  photoUrl?: string;
  qrBadgeCode?: string;
  isCheckedIn: boolean;
  lastCheckIn?: string;
}

export interface VerificationAlert {
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
  updatedAt: string;
}

export interface DoorStaffSummary {
  checkedInCount: number;
  checkedOutCount: number;
  presentCount: number;
  barFeesCollected: number;
  barFeesDeferred: number;
  barFeesWaived: number;
  cashCollected: number;
  cardCollected: number;
  pendingAlerts: number;
}

export interface CheckInParams {
  dancerId: string;
  barFeeAmount: number;
  barFeeStatus: 'PAID' | 'DEFERRED' | 'WAIVED';
  paymentMethod?: 'CASH' | 'CARD';
  notes?: string;
}

// API Functions
export const doorStaffService = {
  // Get all dancers checked in today
  getCheckedInDancers: async (): Promise<{
    present: CheckedInDancer[];
    departed: CheckedInDancer[];
  }> => {
    const response = await apiClient.get('/api/door-staff/checked-in');
    return response.data;
  },

  // Search dancers by name or badge
  searchDancers: async (query: string): Promise<DancerSearchResult[]> => {
    const response = await apiClient.get('/api/door-staff/dancer/search', {
      params: { q: query },  // Backend expects 'q' not 'query'
    });
    // Backend returns array directly, not wrapped in { dancers: [] }
    return response.data;
  },

  // Lookup dancer by QR code
  lookupByQR: async (code: string): Promise<DancerSearchResult> => {
    const response = await apiClient.get(`/api/door-staff/dancer/qr/${code}`);
    // Backend returns dancer object directly, not wrapped in { dancer: {} }
    return response.data;
  },

  // Check in a dancer
  checkInDancer: async (data: CheckInParams): Promise<CheckedInDancer> => {
    const response = await apiClient.post('/api/door-staff/checkin', data);
    return response.data.checkIn;
  },

  // Check out a dancer
  checkOutDancer: async (checkInId: string): Promise<CheckedInDancer> => {
    const response = await apiClient.post(`/api/door-staff/checkout/${checkInId}`);
    return response.data.checkIn;
  },

  // Collect deferred bar fee
  collectBarFee: async (
    checkInId: string,
    paymentMethod: 'CASH' | 'CARD'
  ): Promise<CheckedInDancer> => {
    const response = await apiClient.post(`/api/door-staff/barfee/collect/${checkInId}`, {
      paymentMethod,
    });
    return response.data.checkIn;
  },

  // Get verification alerts
  getAlerts: async (params?: {
    status?: string;
    severity?: string;
  }): Promise<VerificationAlert[]> => {
    const response = await apiClient.get('/api/door-staff/alerts', { params });
    return response.data.alerts;
  },

  // Acknowledge an alert
  acknowledgeAlert: async (alertId: string): Promise<VerificationAlert> => {
    const response = await apiClient.post(`/api/door-staff/alerts/${alertId}/acknowledge`);
    return response.data.alert;
  },

  // Dismiss an alert (Manager+)
  dismissAlert: async (alertId: string, reason?: string): Promise<VerificationAlert> => {
    const response = await apiClient.post(`/api/door-staff/alerts/${alertId}/dismiss`, {
      reason,
    });
    return response.data.alert;
  },

  // Get shift summary
  getSummary: async (): Promise<DoorStaffSummary> => {
    const response = await apiClient.get('/api/door-staff/summary');
    return response.data.summary;
  },
};

export default doorStaffService;
