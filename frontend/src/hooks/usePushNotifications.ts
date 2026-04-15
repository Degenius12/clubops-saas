import { useState, useEffect, useCallback } from 'react';
import pushNotificationService, { NotificationPreferences } from '../services/pushNotificationService';

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  preferences: NotificationPreferences;
  subscriptions: any[];
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: false,
    preferences: {
      shiftUpdates: true,
      swapRequests: true,
      emergencyAlerts: true,
      generalUpdates: false
    },
    subscriptions: [],
    error: null
  });

  const updateState = useCallback((updates: Partial<PushNotificationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const checkSupport = useCallback(async () => {
    const isSupported = pushNotificationService.isNotificationSupported();
    const permission = pushNotificationService.getPermissionStatus();
    
    updateState({ 
      isSupported, 
      permission 
    });

    if (isSupported) {
      const isSubscribed = await pushNotificationService.isSubscribed();
      updateState({ isSubscribed });
    }
  }, [updateState]);

  const loadSubscriptions = useCallback(async () => {
    try {
      const subscriptions = await pushNotificationService.getSubscriptions();
      updateState({ 
        subscriptions, 
        isSubscribed: subscriptions.length > 0 
      });
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  }, [updateState]);

  const requestPermission = useCallback(async () => {
    updateState({ isLoading: true, error: null });

    try {
      const permission = await pushNotificationService.requestPermission();
      updateState({ permission });
      return permission;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to request permission';
      updateState({ error: message });
      return 'denied' as NotificationPermission;
    } finally {
      updateState({ isLoading: false });
    }
  }, [updateState]);

  const subscribe = useCallback(async (preferences?: Partial<NotificationPreferences>) => {
    updateState({ isLoading: true, error: null });

    try {
      const success = await pushNotificationService.subscribe(preferences);
      if (success) {
        updateState({ 
          isSubscribed: true,
          permission: 'granted',
          preferences: { ...state.preferences, ...preferences }
        });
        await loadSubscriptions();
      } else {
        updateState({ error: 'Failed to enable notifications' });
      }
      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to subscribe';
      updateState({ error: message });
      return false;
    } finally {
      updateState({ isLoading: false });
    }
  }, [updateState, loadSubscriptions, state.preferences]);

  const unsubscribe = useCallback(async () => {
    updateState({ isLoading: true, error: null });

    try {
      const success = await pushNotificationService.unsubscribe();
      if (success) {
        updateState({ isSubscribed: false });
        await loadSubscriptions();
      } else {
        updateState({ error: 'Failed to disable notifications' });
      }
      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unsubscribe';
      updateState({ error: message });
      return false;
    } finally {
      updateState({ isLoading: false });
    }
  }, [updateState, loadSubscriptions]);

  const updatePreferences = useCallback(async (newPreferences: NotificationPreferences) => {
    try {
      const success = await pushNotificationService.updatePreferences(newPreferences);
      if (success) {
        updateState({ preferences: newPreferences });
      } else {
        updateState({ error: 'Failed to update preferences' });
      }
      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update preferences';
      updateState({ error: message });
      return false;
    }
  }, [updateState]);

  const sendTestNotification = useCallback(async () => {
    updateState({ isLoading: true, error: null });

    try {
      const success = await pushNotificationService.sendTestNotification();
      if (!success) {
        updateState({ error: 'Failed to send test notification' });
      }
      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send test notification';
      updateState({ error: message });
      return false;
    } finally {
      updateState({ isLoading: false });
    }
  }, [updateState]);

  // Initialize on mount
  useEffect(() => {
    checkSupport();
    loadSubscriptions();
  }, [checkSupport, loadSubscriptions]);

  // Listen for permission changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentPermission = pushNotificationService.getPermissionStatus();
      if (currentPermission !== state.permission) {
        updateState({ permission: currentPermission });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.permission, updateState]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
    clearError,
    refresh: loadSubscriptions
  };
}