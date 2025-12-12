// VIP Host API Service
import apiClient from '../config/api';

// Types
export interface VipBooth {
  id: string;
  clubId: string;
  name: string;
  boothNumber: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  capacity: number;
  songRate: number;
  hourlyRate?: number;
  currentSession?: VipSession;
  createdAt: string;
  updatedAt: string;
}

export interface VipSession {
  id: string;
  clubId: string;
  boothId: string;
  dancerId: string;
  vipHostId: string;
  customerId?: string;
  startTime: string;
  endTime?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  songCountManual: number;
  songCountDjSync?: number;
  songCountByTime?: number;
  songCountFinal?: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'MISMATCH' | 'PENDING_REVIEW';
  customerConfirmed: boolean;
  customerDisputed: boolean;
  disputeReason?: string;
  houseFeeAmount?: number;
  dancerPayoutAmount?: number;
  notes?: string;
  runtime?: number; // in seconds, calculated field
  booth?: VipBooth;
  dancer?: {
    id: string;
    stageName: string;
    photoUrl?: string;
  };
  vipHost?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AvailableDancer {
  id: string;
  stageName: string;
  photoUrl?: string;
  checkInId: string;
  checkInTime: string;
  currentlyInVip: boolean;
}

export interface VipHostSummary {
  activeSessionsCount: number;
  completedSessionsCount: number;
  totalSongs: number;
  totalRevenue: number;
  verifiedCount: number;
  pendingReviewCount: number;
  mismatchCount: number;
  customerDisputeCount: number;
}

export interface StartSessionParams {
  boothId: string;
  dancerId: string;
  customerId?: string;
  notes?: string;
}

export interface EndSessionParams {
  songCountFinal?: number;
  notes?: string;
}

export interface CustomerConfirmData {
  confirmed: boolean;
  signature?: string;
}

// API Functions
export const vipHostService = {
  // Get all VIP booths with status
  getBooths: async (): Promise<VipBooth[]> => {
    const response = await apiClient.get('/api/vip-host/booths');
    return response.data.booths || response.data || [];
  },

  // Get available dancers (checked in, not in active VIP)
  getAvailableDancers: async (): Promise<AvailableDancer[]> => {
    const response = await apiClient.get('/api/vip-host/available-dancers');
    return response.data.dancers || response.data || [];
  },

  // Get all active VIP sessions
  getActiveSessions: async (): Promise<VipSession[]> => {
    const response = await apiClient.get('/api/vip-host/sessions/active');
    return response.data.sessions || response.data || [];
  },

  // Start a new VIP session
  startSession: async (data: StartSessionParams): Promise<VipSession> => {
    const response = await apiClient.post('/api/vip-host/sessions/start', data);
    return response.data.session;
  },

  // Update manual song count
  updateSongCount: async (sessionId: string, songCount: number): Promise<VipSession> => {
    const response = await apiClient.put(`/api/vip-host/sessions/${sessionId}/songs`, {
      songCountManual: songCount,
    });
    return response.data.session;
  },

  // End VIP session
  endSession: async (sessionId: string, data?: EndSessionParams): Promise<VipSession> => {
    const response = await apiClient.post(`/api/vip-host/sessions/${sessionId}/end`, data);
    return response.data.session;
  },

  // Get customer confirmation display data
  getConfirmationDisplay: async (
    sessionId: string
  ): Promise<{
    session: VipSession;
    songBreakdown: {
      manualCount: number;
      timeBasedEstimate: number;
      djSyncCount?: number;
      finalCount: number;
    };
    charges: {
      songRate: number;
      totalSongs: number;
      subtotal: number;
      houseFee: number;
      total: number;
    };
  }> => {
    const response = await apiClient.get(`/api/vip-host/sessions/${sessionId}/confirm-display`);
    return response.data;
  },

  // Record customer confirmation
  confirmSession: async (sessionId: string, data: CustomerConfirmData): Promise<VipSession> => {
    const response = await apiClient.post(
      `/api/vip-host/sessions/${sessionId}/customer-confirm`,
      data
    );
    return response.data.session;
  },

  // Record customer dispute
  disputeSession: async (sessionId: string, reason: string): Promise<VipSession> => {
    const response = await apiClient.post(`/api/vip-host/sessions/${sessionId}/customer-dispute`, {
      reason,
    });
    return response.data.session;
  },

  // Get VIP host shift summary
  getSummary: async (): Promise<VipHostSummary> => {
    const response = await apiClient.get('/api/vip-host/summary');
    return response.data.summary;
  },

  // Get session history
  getSessionHistory: async (params?: {
    status?: string;
    verificationStatus?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ sessions: VipSession[]; total: number; page: number; limit: number }> => {
    const response = await apiClient.get('/api/vip-host/sessions/history', { params });
    return response.data;
  },
};

export default vipHostService;
