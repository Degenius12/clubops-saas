// Shift Management API Service
import apiClient from '../config/api';

// Types
export interface CashDrawer {
  id: string;
  shiftId: string;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  variance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftSummary {
  totalCheckIns: number;
  totalCheckOuts: number;
  totalBarFeesCollected: number;
  totalBarFeesDeferred: number;
  totalVipSessions: number;
  totalVipRevenue: number;
  cashDrawerVariance?: number;
}

export interface Shift {
  id: string;
  clubId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  role: string;
  notes?: string;
  summary?: ShiftSummary;
  cashDrawer?: CashDrawer;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StartShiftParams {
  role?: string;
  notes?: string;
  openingCashBalance?: number;
}

export interface EndShiftParams {
  notes?: string;
  closingCashBalance?: number;
}

// API Functions
export const shiftService = {
  // Get active shift for current user
  getActiveShift: async (): Promise<Shift | null> => {
    try {
      const response = await apiClient.get('/api/shifts/active');
      return response.data.shift;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get all shifts (Manager+)
  getShifts: async (params?: {
    status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ shifts: Shift[]; total: number; page: number; limit: number }> => {
    const response = await apiClient.get('/api/shifts', { params });
    return response.data;
  },

  // Start a new shift
  startShift: async (data: StartShiftParams): Promise<Shift> => {
    const response = await apiClient.post('/api/shifts/start', data);
    return response.data.shift;
  },

  // End current shift
  endShift: async (data: EndShiftParams): Promise<Shift> => {
    const response = await apiClient.post('/api/shifts/end', data);
    return response.data.shift;
  },

  // Get shift by ID
  getShiftById: async (shiftId: string): Promise<Shift> => {
    const response = await apiClient.get(`/api/shifts/${shiftId}`);
    return response.data.shift;
  },
};

export default shiftService;
