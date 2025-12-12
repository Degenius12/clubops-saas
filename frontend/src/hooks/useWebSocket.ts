// WebSocket Hook for Real-Time Updates
import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

// Event Types
export interface DancerCheckInEvent {
  checkInId: string;
  dancerId: string;
  stageName: string;
  checkInTime: string;
  barFeeStatus: string;
}

export interface DancerCheckOutEvent {
  checkInId: string;
  dancerId: string;
  stageName: string;
  checkOutTime: string;
}

export interface VipSessionStartEvent {
  sessionId: string;
  boothId: string;
  boothName: string;
  dancerId: string;
  dancerName: string;
  startTime: string;
}

export interface VipSessionEndEvent {
  sessionId: string;
  boothId: string;
  boothName: string;
  dancerId: string;
  dancerName: string;
  endTime: string;
  songCount: number;
  verificationStatus: string;
}

export interface VipSongCountEvent {
  sessionId: string;
  songCount: number;
  source: 'manual' | 'dj_sync';
}

export interface AlertEvent {
  alertId: string;
  alertType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  entityType: string;
  entityId: string;
}

export interface ShiftEvent {
  shiftId: string;
  userId: string;
  userName: string;
  role: string;
  action: 'start' | 'end';
  timestamp: string;
}

// Hook Options
interface UseWebSocketOptions {
  clubId: string;
  enabled?: boolean;
  onDancerCheckIn?: (event: DancerCheckInEvent) => void;
  onDancerCheckOut?: (event: DancerCheckOutEvent) => void;
  onVipSessionStart?: (event: VipSessionStartEvent) => void;
  onVipSessionEnd?: (event: VipSessionEndEvent) => void;
  onVipSongCount?: (event: VipSongCountEvent) => void;
  onNewAlert?: (event: AlertEvent) => void;
  onShiftStart?: (event: ShiftEvent) => void;
  onShiftEnd?: (event: ShiftEvent) => void;
}

// Hook Return Type
interface UseWebSocketReturn {
  isConnected: boolean;
  connectionError: string | null;
  reconnect: () => void;
  disconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    clubId,
    enabled = true,
    onDancerCheckIn,
    onDancerCheckOut,
    onVipSessionStart,
    onVipSessionEnd,
    onVipSongCount,
    onNewAlert,
    onShiftStart,
    onShiftEnd,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Store callbacks in refs to avoid dependency issues
  const callbacksRef = useRef({
    onDancerCheckIn,
    onDancerCheckOut,
    onVipSessionStart,
    onVipSessionEnd,
    onVipSongCount,
    onNewAlert,
    onShiftStart,
    onShiftEnd,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onDancerCheckIn,
      onDancerCheckOut,
      onVipSessionStart,
      onVipSessionEnd,
      onVipSongCount,
      onNewAlert,
      onShiftStart,
      onShiftEnd,
    };
  });

  // Initialize socket connection
  const connect = useCallback(() => {
    if (!enabled || !clubId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionError('No authentication token');
      return;
    }

    // Create socket connection
    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
      setConnectionError(null);

      // Join club room
      socket.emit('join-club', clubId);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Business events - use refs to get latest callbacks
    socket.on('dancer-checked-in', (event: DancerCheckInEvent) => {
      console.log('📥 Dancer checked in:', event);
      callbacksRef.current.onDancerCheckIn?.(event);
    });

    socket.on('dancer-checked-out', (event: DancerCheckOutEvent) => {
      console.log('📤 Dancer checked out:', event);
      callbacksRef.current.onDancerCheckOut?.(event);
    });

    socket.on('vip-session-started', (event: VipSessionStartEvent) => {
      console.log('🎪 VIP session started:', event);
      callbacksRef.current.onVipSessionStart?.(event);
    });

    socket.on('vip-session-ended', (event: VipSessionEndEvent) => {
      console.log('🎪 VIP session ended:', event);
      callbacksRef.current.onVipSessionEnd?.(event);
    });

    socket.on('vip-song-count-updated', (event: VipSongCountEvent) => {
      console.log('🎵 Song count updated:', event);
      callbacksRef.current.onVipSongCount?.(event);
    });

    socket.on('new-alert', (event: AlertEvent) => {
      console.log('🚨 New alert:', event);
      callbacksRef.current.onNewAlert?.(event);
    });

    socket.on('shift-started', (event: ShiftEvent) => {
      console.log('⏰ Shift started:', event);
      callbacksRef.current.onShiftStart?.(event);
    });

    socket.on('shift-ended', (event: ShiftEvent) => {
      console.log('⏰ Shift ended:', event);
      callbacksRef.current.onShiftEnd?.(event);
    });

    return socket;
  }, [clubId, enabled]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Reconnect socket
  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Setup and cleanup
  useEffect(() => {
    const socket = connect();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [connect]);

  return {
    isConnected,
    connectionError,
    reconnect,
    disconnect,
  };
}

// Simplified hook for just connection status
export function useWebSocketStatus(clubId: string): {
  isConnected: boolean;
  error: string | null;
} {
  const { isConnected, connectionError } = useWebSocket({
    clubId,
    enabled: !!clubId,
  });

  return { isConnected, error: connectionError };
}

export default useWebSocket;
