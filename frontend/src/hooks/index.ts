// Hooks Index - Export all custom hooks

// WebSocket hook
export { useWebSocket, useWebSocketStatus } from './useWebSocket';
export type {
  DancerCheckInEvent,
  DancerCheckOutEvent,
  VipSessionStartEvent,
  VipSessionEndEvent,
  VipSongCountEvent,
  AlertEvent,
  ShiftEvent,
} from './useWebSocket';

// Data hooks for fraud prevention interfaces
export { useDoorStaffData } from './useDoorStaffData';
export { useVipHostData } from './useVipHostData';
export { useSecurityDashboard } from './useSecurityDashboard';

// Patron count hook (Feature #49)
export { usePatronCount } from './usePatronCount';

// Push notifications hook (Feature #34)
export { usePushNotifications } from './usePushNotifications';
export type { PushNotificationState } from './usePushNotifications';

// Re-export typed Redux hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
