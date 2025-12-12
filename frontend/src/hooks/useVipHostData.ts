// VIP Host Data Hook - Connects UI to Redux/API
import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './index';
import { useWebSocket } from './useWebSocket';
import {
  fetchBooths,
  fetchAvailableDancers,
  fetchActiveSessions,
  startVipSession,
  updateSongCount,
  endVipSession,
  fetchConfirmationDisplay,
  confirmSession,
  disputeSession,
  fetchVipHostSummary,
  selectSession,
  clearConfirmationData,
  addSessionFromSocket,
  removeSessionFromSocket,
  updateSongCountFromSocket,
} from '../store/slices/vipHostSlice';
import {
  fetchActiveShift,
  startShift,
  endShift,
} from '../store/slices/shiftSlice';
import type { StartSessionParams, EndSessionParams } from '../services/vipHostService';
import type { StartShiftParams, EndShiftParams } from '../services/shiftService';

export function useVipHostData(clubId: string) {
  const dispatch = useAppDispatch();
  
  // Redux state
  const {
    booths,
    activeSessions,
    availableDancers,
    summary,
    selectedSession,
    confirmationData,
    isLoading,
    isStartingSession,
    isEndingSession,
    error,
  } = useAppSelector((state) => state.vipHost);
  
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
    onVipSessionStart: (event) => {
      dispatch(addSessionFromSocket({
        id: event.sessionId,
        clubId,
        boothId: event.boothId,
        dancerId: event.dancerId,
        vipHostId: '',
        startTime: event.startTime,
        status: 'ACTIVE',
        songCountManual: 0,
        verificationStatus: 'PENDING',
        customerConfirmed: false,
        customerDisputed: false,
        createdAt: event.startTime,
        updatedAt: event.startTime,
        booth: {
          id: event.boothId,
          clubId,
          name: event.boothName,
          boothNumber: 0,
          status: 'OCCUPIED',
          capacity: 1,
          songRate: 0,
          createdAt: '',
          updatedAt: '',
        },
        dancer: {
          id: event.dancerId,
          stageName: event.dancerName,
        },
      }));
    },
    onVipSessionEnd: (event) => {
      dispatch(removeSessionFromSocket(event.sessionId));
    },
    onVipSongCount: (event) => {
      dispatch(updateSongCountFromSocket({
        sessionId: event.sessionId,
        songCount: event.songCount,
      }));
    },
  });

  // Initial data fetch
  useEffect(() => {
    if (clubId) {
      dispatch(fetchActiveShift());
      dispatch(fetchBooths());
      dispatch(fetchAvailableDancers());
      dispatch(fetchActiveSessions());
      dispatch(fetchVipHostSummary());
    }
  }, [dispatch, clubId]);

  // Actions
  const handleStartSession = useCallback(async (params: StartSessionParams) => {
    const result = await dispatch(startVipSession(params));
    if (startVipSession.fulfilled.match(result)) {
      dispatch(fetchVipHostSummary()); // Refresh summary
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Failed to start session');
  }, [dispatch]);

  const handleUpdateSongCount = useCallback(async (sessionId: string, count: number) => {
    const result = await dispatch(updateSongCount({ sessionId, songCount: count }));
    if (updateSongCount.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Failed to update song count');
  }, [dispatch]);

  const handleEndSession = useCallback(async (sessionId: string, data?: EndSessionParams) => {
    const result = await dispatch(endVipSession({ sessionId, data }));
    if (endVipSession.fulfilled.match(result)) {
      dispatch(fetchVipHostSummary()); // Refresh summary
      dispatch(fetchAvailableDancers()); // Dancer becomes available again
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Failed to end session');
  }, [dispatch]);

  const handleGetConfirmation = useCallback(async (sessionId: string) => {
    const result = await dispatch(fetchConfirmationDisplay(sessionId));
    if (fetchConfirmationDisplay.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Failed to get confirmation data');
  }, [dispatch]);

  const handleConfirmSession = useCallback(async (
    sessionId: string,
    confirmed: boolean,
    signature?: string
  ) => {
    const result = await dispatch(confirmSession({ sessionId, confirmed, signature }));
    if (confirmSession.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Failed to confirm session');
  }, [dispatch]);

  const handleDisputeSession = useCallback(async (sessionId: string, reason: string) => {
    const result = await dispatch(disputeSession({ sessionId, reason }));
    if (disputeSession.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error((result.payload as string) || 'Failed to record dispute');
  }, [dispatch]);

  const handleSelectSession = useCallback((sessionId: string | null) => {
    dispatch(selectSession(sessionId));
    if (sessionId) {
      dispatch(fetchConfirmationDisplay(sessionId));
    }
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
    dispatch(fetchBooths());
    dispatch(fetchAvailableDancers());
    dispatch(fetchActiveSessions());
    dispatch(fetchVipHostSummary());
  }, [dispatch]);

  const clearConfirmation = useCallback(() => {
    dispatch(clearConfirmationData());
  }, [dispatch]);

  // Calculate runtime for active sessions (defensive check for undefined)
  const sessionsWithRuntime = (activeSessions || []).map((session) => {
    const startMs = session.startTime ? new Date(session.startTime).getTime() : NaN
    const runtime = !isNaN(startMs) ? Math.floor((Date.now() - startMs) / 1000) : 0
    return {
      ...session,
      runtime,
    }
  });

  return {
    // State
    booths,
    activeSessions: sessionsWithRuntime,
    availableDancers,
    summary,
    selectedSession,
    confirmationData,
    activeShift,
    isConnected,
    
    // Loading states
    isLoading,
    isStartingSession,
    isEndingSession,
    isStartingShift,
    isEndingShift,
    
    // Errors
    error: error || shiftError,
    
    // Actions
    handleStartSession,
    handleUpdateSongCount,
    handleEndSession,
    handleGetConfirmation,
    handleConfirmSession,
    handleDisputeSession,
    handleSelectSession,
    handleStartShift,
    handleEndShift,
    refreshData,
    clearConfirmation,
  };
}

export default useVipHostData;
