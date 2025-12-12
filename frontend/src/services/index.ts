// Services Index - Export all API services
export { shiftService } from './shiftService';
export type { Shift, CashDrawer, ShiftSummary, StartShiftParams, EndShiftParams } from './shiftService';

export { doorStaffService } from './doorStaffService';
export type {
  CheckedInDancer,
  DancerSearchResult,
  VerificationAlert,
  DoorStaffSummary,
  CheckInParams,
} from './doorStaffService';

export { vipHostService } from './vipHostService';
export type {
  VipBooth,
  VipSession,
  AvailableDancer,
  VipHostSummary,
  StartSessionParams,
  EndSessionParams,
  CustomerConfirmData,
} from './vipHostService';

export { securityService } from './securityService';
export type {
  IntegrityMetrics,
  AuditLogEntry,
  SongCountComparison,
  AnomalyAlert,
  EmployeePerformance,
  AnomalyReport,
} from './securityService';
