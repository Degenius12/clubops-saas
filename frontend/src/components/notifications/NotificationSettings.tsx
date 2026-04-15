import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import pushNotificationService, { NotificationPreferences } from '../../services/pushNotificationService';

interface NotificationSettingsProps {
  userId?: string;
  onSettingsChange?: (enabled: boolean) => void;
}

export function NotificationSettings({ userId, onSettingsChange }: NotificationSettingsProps): JSX.Element {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    shiftUpdates: true,
    swapRequests: true,
    emergencyAlerts: true,
    generalUpdates: false
  });
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Toggle Switch Component (matches Settings.tsx)
  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:ring-offset-2 focus:ring-offset-midnight-950 ${
        enabled ? 'bg-gold-500' : 'bg-midnight-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  useEffect(() => {
    checkNotificationSupport();
    loadSubscriptions();
  }, []);

  const checkNotificationSupport = () => {
    const supported = pushNotificationService.isNotificationSupported();
    setIsSupported(supported);
    setPermission(pushNotificationService.getPermissionStatus());
  };

  const loadSubscriptions = async () => {
    try {
      const userSubscriptions = await pushNotificationService.getSubscriptions();
      setSubscriptions(userSubscriptions);
      setIsSubscribed(userSubscriptions.length > 0);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await pushNotificationService.subscribe(preferences);
      if (success) {
        setIsSubscribed(true);
        setPermission('granted');
        await loadSubscriptions();
        onSettingsChange?.(true);
      } else {
        setError('Failed to enable notifications. Please try again.');
      }
    } catch (error) {
      setError('Failed to enable notifications. Please check your browser settings.');
      console.error('Notification subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await pushNotificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
        await loadSubscriptions();
        onSettingsChange?.(false);
      } else {
        setError('Failed to disable notifications. Please try again.');
      }
    } catch (error) {
      setError('Failed to disable notifications.');
      console.error('Notification unsubscribe error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    if (isSubscribed) {
      try {
        await pushNotificationService.updatePreferences(newPreferences);
      } catch (error) {
        console.error('Failed to update preferences:', error);
        setError('Failed to update notification preferences.');
      }
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.sendTestNotification();
      if (!success) {
        setError('Failed to send test notification.');
      }
    } catch (error) {
      setError('Failed to send test notification.');
      console.error('Test notification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-success-500/10 text-success-400 border border-success-500/20 rounded-full">
            <CheckCircleIcon className="w-3 h-3" />
            Enabled
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-danger-500/10 text-danger-400 border border-danger-500/20 rounded-full">
            <XCircleIcon className="w-3 h-3" />
            Blocked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gold-500/10 text-gold-400 border border-gold-500/20 rounded-full">
            <ExclamationTriangleIcon className="w-3 h-3" />
            Not Set
          </span>
        );
    }
  };

  if (!isSupported) {
    return (
      <div className="card-premium p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              Push Notifications
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              Receive important updates about shifts, swaps, and emergencies
            </p>
          </div>
        </div>
        
        <div className="p-4 bg-danger-500/5 border border-danger-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-danger-400 mt-0.5" />
            <div>
              <h4 className="text-danger-400 font-medium">Not Supported</h4>
              <p className="text-danger-400/70 text-sm mt-1">
                Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-premium p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <BellIcon className="h-5 w-5" />
            Push Notifications
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Receive important updates about shifts, swaps, and emergencies directly to your device
          </p>
        </div>
        {getPermissionBadge()}
      </div>
      
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-danger-500/5 border border-danger-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <XCircleIcon className="h-5 w-5 text-danger-400 mt-0.5" />
              <div>
                <h4 className="text-danger-400 font-medium">Error</h4>
                <p className="text-danger-400/70 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {permission === 'denied' && (
          <div className="p-4 bg-gold-500/5 border border-gold-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-gold-400 mt-0.5" />
              <div>
                <h4 className="text-gold-400 font-medium">Notifications Blocked</h4>
                <p className="text-gold-400/70 text-sm mt-1">
                  Notifications are blocked. Please enable them in your browser settings to receive updates.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-midnight-900/50 rounded-xl border border-white/5">
          <div>
            <h4 className="text-text-primary font-medium">Enable Notifications</h4>
            <p className="text-text-muted text-sm">
              {isSubscribed ? 'Notifications are enabled' : 'Turn on push notifications'}
            </p>
          </div>
          <div className="flex gap-2">
            {!isSubscribed ? (
              <button 
                onClick={handleEnableNotifications} 
                disabled={isLoading || permission === 'denied'}
                className="px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-midnight-700 disabled:text-text-muted text-white text-sm font-medium rounded-xl transition-colors"
              >
                {isLoading ? 'Enabling...' : 'Enable'}
              </button>
            ) : (
              <>
                <button 
                  onClick={handleTestNotification}
                  disabled={isLoading}
                  className="px-4 py-2 bg-midnight-800 hover:bg-midnight-700 text-text-primary text-sm font-medium rounded-xl transition-colors border border-white/10"
                >
                  Test
                </button>
                <button 
                  onClick={handleDisableNotifications}
                  disabled={isLoading}
                  className="px-4 py-2 bg-midnight-800 hover:bg-midnight-700 text-text-primary text-sm font-medium rounded-xl transition-colors border border-white/10"
                >
                  {isLoading ? 'Disabling...' : 'Disable'}
                </button>
              </>
            )}
          </div>
        </div>

        {isSubscribed && (
          <div className="space-y-4">
            <div className="border-t border-white/5 pt-4">
              <h4 className="text-text-primary font-medium mb-4">Notification Types</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div>
                    <label className="text-text-primary font-medium text-sm">Shift Updates</label>
                    <p className="text-text-muted text-xs">
                      Notifications about scheduled shifts and changes
                    </p>
                  </div>
                  <Toggle
                    enabled={preferences.shiftUpdates}
                    onChange={() => handlePreferenceChange('shiftUpdates', !preferences.shiftUpdates)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div>
                    <label className="text-text-primary font-medium text-sm">Swap Requests</label>
                    <p className="text-text-muted text-xs">
                      Notifications about shift swap requests and approvals
                    </p>
                  </div>
                  <Toggle
                    enabled={preferences.swapRequests}
                    onChange={() => handlePreferenceChange('swapRequests', !preferences.swapRequests)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gold-500/5 border border-gold-500/10 transition-colors">
                  <div className="flex items-start gap-2">
                    <div>
                      <label className="text-text-primary font-medium text-sm">Emergency Alerts</label>
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-gold-500/20 text-gold-400 rounded-full uppercase ml-2">
                        Important
                      </span>
                      <p className="text-text-muted text-xs">
                        Critical notifications that require immediate attention
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={preferences.emergencyAlerts}
                    onChange={() => handlePreferenceChange('emergencyAlerts', !preferences.emergencyAlerts)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div>
                    <label className="text-text-primary font-medium text-sm">General Updates</label>
                    <p className="text-text-muted text-xs">
                      Club announcements and general information
                    </p>
                  </div>
                  <Toggle
                    enabled={preferences.generalUpdates}
                    onChange={() => handlePreferenceChange('generalUpdates', !preferences.generalUpdates)}
                  />
                </div>
              </div>
            </div>

            {subscriptions.length > 0 && (
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-text-primary font-medium mb-3">Active Devices</h4>
                <div className="space-y-2">
                  {subscriptions.map((subscription) => (
                    <div key={subscription.id} className="flex items-center justify-between p-3 bg-midnight-900/50 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        {subscription.deviceType === 'mobile' ? (
                          <DevicePhoneMobileIcon className="w-4 h-4 text-text-tertiary" />
                        ) : (
                          <ComputerDesktopIcon className="w-4 h-4 text-text-tertiary" />
                        )}
                        <span className="text-text-primary text-sm">
                          {subscription.deviceType} - {subscription.browserName}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        subscription.enabled 
                          ? 'bg-success-500/10 text-success-400 border border-success-500/20' 
                          : 'bg-midnight-700 text-text-muted border border-white/10'
                      }`}>
                        {subscription.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}