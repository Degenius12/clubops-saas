// Shift Scheduling API Service (Features #21-23)
import apiClient from '../config/api';
import type {
  ScheduledShift,
  ShiftSwap,
  ShiftNotification,
  CreateScheduledShiftRequest,
  UpdateScheduledShiftRequest,
  CreateShiftSwapRequest,
  ReviewShiftSwapRequest,
  GetScheduledShiftsParams,
  GetShiftSwapsParams,
  GetShiftNotificationsParams,
  GetCalendarParams,
} from '../types/schedule';

export const scheduleService = {
  // ============================================
  // SCHEDULED SHIFTS
  // ============================================

  /**
   * Get scheduled shifts with optional filters
   */
  getScheduledShifts: async (
    params?: GetScheduledShiftsParams
  ): Promise<{ success: boolean; count: number; scheduledShifts: ScheduledShift[] }> => {
    const response = await apiClient.get('/api/schedule/shifts', { params });
    return response.data;
  },

  /**
   * Create a new scheduled shift (Feature #21)
   */
  createScheduledShift: async (
    data: CreateScheduledShiftRequest
  ): Promise<{ success: boolean; message: string; scheduledShift: ScheduledShift }> => {
    const response = await apiClient.post('/api/schedule/shifts', data);
    return response.data;
  },

  /**
   * Update a scheduled shift
   */
  updateScheduledShift: async (
    id: string,
    data: UpdateScheduledShiftRequest
  ): Promise<{ success: boolean; message: string; scheduledShift: ScheduledShift }> => {
    const response = await apiClient.put(`/api/schedule/shifts/${id}`, data);
    return response.data;
  },

  /**
   * Delete a scheduled shift
   */
  deleteScheduledShift: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/api/schedule/shifts/${id}`);
    return response.data;
  },

  // ============================================
  // SHIFT SWAPS (Feature #23)
  // ============================================

  /**
   * Get shift swap requests
   */
  getShiftSwaps: async (
    params?: GetShiftSwapsParams
  ): Promise<{ success: boolean; count: number; swaps: ShiftSwap[] }> => {
    const response = await apiClient.get('/api/schedule/swaps', { params });
    return response.data;
  },

  /**
   * Create a shift swap request
   */
  createShiftSwap: async (
    data: CreateShiftSwapRequest
  ): Promise<{ success: boolean; message: string; swap: ShiftSwap }> => {
    const response = await apiClient.post('/api/schedule/swaps', data);
    return response.data;
  },

  /**
   * Review (approve/decline) a shift swap request (Feature #23)
   */
  reviewShiftSwap: async (
    id: string,
    data: ReviewShiftSwapRequest
  ): Promise<{ success: boolean; message: string; swap: ShiftSwap }> => {
    const response = await apiClient.put(`/api/schedule/swaps/${id}/review`, data);
    return response.data;
  },

  // ============================================
  // NOTIFICATIONS (Feature #22)
  // ============================================

  /**
   * Get shift notifications
   */
  getShiftNotifications: async (
    params?: GetShiftNotificationsParams
  ): Promise<{ success: boolean; count: number; notifications: ShiftNotification[] }> => {
    const response = await apiClient.get('/api/schedule/notifications', { params });
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markNotificationRead: async (
    id: string
  ): Promise<{ success: boolean; notification: ShiftNotification }> => {
    const response = await apiClient.put(`/api/schedule/notifications/${id}/read`);
    return response.data;
  },

  // ============================================
  // CALENDAR VIEW
  // ============================================

  /**
   * Get calendar view of scheduled shifts
   */
  getCalendar: async (
    params: GetCalendarParams
  ): Promise<{ success: boolean; count: number; shifts: ScheduledShift[] }> => {
    const response = await apiClient.get('/api/schedule/calendar', { params });
    return response.data;
  },
};

export default scheduleService;
