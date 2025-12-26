// Shift Scheduling Types (Features #21-23)

export type ScheduledShiftStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type ShiftSwapStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'CANCELLED';

export interface ScheduledShift {
  id: string;
  clubId: string;
  entertainerId: string;
  createdBy: string;
  shiftDate: string; // ISO date string
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  position?: string;
  status: ScheduledShiftStatus;
  confirmedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  notificationSent: boolean;
  notificationSentAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  entertainer?: {
    id: string;
    stageName: string;
    photoUrl?: string;
    phone?: string;
    email?: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  swaps?: ShiftSwap[];
  notifications?: ShiftNotification[];
}

export interface ShiftSwap {
  id: string;
  clubId: string;
  scheduledShiftId: string;
  requestedBy: string;
  swapWithEntertainerId?: string;
  reason: string;
  requestedDate: string;
  status: ShiftSwapStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  scheduledShift?: ScheduledShift;
  requester?: {
    id: string;
    stageName: string;
    photoUrl?: string;
  };
  reviewer?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface ShiftNotification {
  id: string;
  clubId: string;
  entertainerId: string;
  userId?: string;
  scheduledShiftId?: string;
  notificationType: string;
  // SHIFT_SCHEDULED, SHIFT_REMINDER, SHIFT_CANCELLED, SHIFT_SWAP_REQUEST, SHIFT_SWAP_APPROVED
  title: string;
  message: string;
  deliveryMethod: string; // SMS, EMAIL, PUSH, IN_APP
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  metadata: Record<string, any>;
  createdAt: string;

  // Relations
  scheduledShift?: {
    id: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    position?: string;
  };
  entertainer?: {
    id: string;
    stageName: string;
  };
}

// API Request/Response Types

export interface CreateScheduledShiftRequest {
  entertainerId: string;
  shiftDate: string; // ISO date string
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  position?: string;
  notes?: string;
}

export interface UpdateScheduledShiftRequest {
  shiftDate?: string;
  startTime?: string;
  endTime?: string;
  position?: string;
  status?: ScheduledShiftStatus;
  notes?: string;
}

export interface CreateShiftSwapRequest {
  scheduledShiftId: string;
  requestedBy: string;
  reason: string;
  swapWithEntertainerId?: string;
}

export interface ReviewShiftSwapRequest {
  action: 'approve' | 'decline';
  reviewNotes?: string;
}

export interface GetScheduledShiftsParams {
  startDate?: string;
  endDate?: string;
  entertainerId?: string;
  status?: ScheduledShiftStatus;
  limit?: number;
}

export interface GetShiftSwapsParams {
  status?: ShiftSwapStatus;
}

export interface GetShiftNotificationsParams {
  entertainerId?: string;
  unreadOnly?: boolean;
}

export interface GetCalendarParams {
  startDate: string;
  endDate: string;
}

// Calendar Event Type (for calendar UI)
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduledShift;
  backgroundColor?: string;
  borderColor?: string;
}
