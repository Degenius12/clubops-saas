// Door Staff Data Hook - Connects UI to Redux/API
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './index';
import { useWebSocket } from './useWebSocket';
import {
  fetchCheckedInDancers,
  searchDancers,
  lookupDancerByQR,
  checkInDancer,
  checkOutDancer,
  collectBarFee,
  fetchAlerts,
  acknowledgeAlert,
  fetchDoorStaffSummary,
  clearSearchResults,
  addDancerFromSocket,
  removeDancerFromSocket,
  addAlertFromSocket,
} from '../store/slices/doorStaffSlice';
import {
  fetchActiveShift,
  startShift,
  endShift,
} from '../store/slices/shiftSlice';
import type { CheckInParams } from '../services/doorStaffService';
import type { StartShiftParams, EndShiftParams } from '../services/shiftService';

export function useDoorStaffData(clubId: string) {
  const dispatch = useAppDispatch();
  
  // Redux state
  const {
    presentDancers,
    departedDancers,
    searchResults,
    alerts,
    summary,
    isLoading,
    isSearching,
    isCheckingIn,
    error,
    searchError,
  } = useAppSelector((state) => state.doorStaff);
  
  const {
    activeShift,
    isStartingShift,
    isEndingShift,
    error: shiftError,
  } = useAppSelector((state) => state.shift);

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket({
    clubId,
    enabled: !!clubId,
    onDancerCheckIn: (event) => {
      // Convert socket event to CheckedInDancer format
      dispatch(addDancerFromSocket({
        id: event.checkInId,
        dancerId: event.dancerId,
        shiftId: activeShift?.id || '',
        checkInTime: event.checkInTime,
        barFeeAmount: 0,
        barFeeStatus: event.barFeeStatus as any,
        dancer: {
          id: event.dancerId,
          stageName: event.stageName,
          licenseStatus: 'VALID',
        },
        createdAt: event.checkInTime,
        updatedAt: event.checkInTime,
      }));
    },
    onDancerCheckOut: (event) => {
      dispatch(removeDancerFromSocket(event.checkInId));
    },
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
        updatedAt: new Date().toISOString(),
      }));
    },
  });

  // Initial data fetch
  useEffect(() => {
    if (clubId) {
      dispatch(fetchActiveShift());
      dispatch(fetchCheckedInDancers());
      dispatch(fetchAlerts());
      dispatch(fetchDoorStaffSummary());
    }
  }, [dispatch, clubId]);

  // Actions
  const handleSearch = useCallback((query: string) => {
    if (query.length >= 2) {
      dispatch(searchDancers(query));
    } else {
      dispatch(clearSearchResults());
    }
  }, [dispatch]);

  const handleQRScan = useCallback((code: string) => {
    dispatch(lookupDancerByQR(code));
  }, [dispatch]);

  const handleCheckIn = useCallback(async (params: CheckInParams) => {
    const result = await dispatch(checkInDancer(params));
    if (checkInDancer.fulfilled.match(result)) {
      dispatch(fetchDoorStaffSummary()); // Refresh summary
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Check-in failed');
  }, [dispatch]);

  const handleCheckOut = useCallback(async (checkInId: string) => {
    const result = await dispatch(checkOutDancer(checkInId));
    if (checkOutDancer.fulfilled.match(result)) {
      dispatch(fetchDoorStaffSummary()); // Refresh summary
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Check-out failed');
  }, [dispatch]);

  const handleCollectBarFee = useCallback(async (
    checkInId: string,
    paymentMethod: 'CASH' | 'CARD'
  ) => {
    const result = await dispatch(collectBarFee({ checkInId, paymentMethod }));
    if (collectBarFee.fulfilled.match(result)) {
      dispatch(fetchDoorStaffSummary()); // Refresh summary
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Collection failed');
  }, [dispatch]);

  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    const result = await dispatch(acknowledgeAlert(alertId));
    if (acknowledgeAlert.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Acknowledge failed');
  }, [dispatch]);

  const handleStartShift = useCallback(async (params: StartShiftParams) => {
    const result = await dispatch(startShift(params));
    if (startShift.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Failed to start shift');
  }, [dispatch]);

  const handleEndShift = useCallback(async (params: EndShiftParams) => {
    const result = await dispatch(endShift(params));
    if (endShift.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Failed to end shift');
  }, [dispatch]);

  const refreshData = useCallback(() => {
    dispatch(fetchCheckedInDancers());
    dispatch(fetchAlerts());
    dispatch(fetchDoorStaffSummary());
  }, [dispatch]);

  const clearSearch = useCallback(() => {
    dispatch(clearSearchResults());
  }, [dispatch]);

  return {
    // State
    presentDancers,
    departedDancers,
    searchResults,
    alerts,
    summary,
    activeShift,
    isConnected,
    
    // Loading states
    isLoading,
    isSearching,
    isCheckingIn,
    isStartingShift,
    isEndingShift,
    
    // Errors
    error: error || shiftError,
    searchError,
    
    // Actions
    handleSearch,
    handleQRScan,
    handleCheckIn,
    handleCheckOut,
    handleCollectBarFee,
    handleAcknowledgeAlert,
    handleStartShift,
    handleEndShift,
    refreshData,
    clearSearch,
  };
}

export default useDoorStaffData;
