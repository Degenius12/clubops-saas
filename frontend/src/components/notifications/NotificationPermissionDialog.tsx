import React, { useState } from 'react';
import { 
  BellIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import pushNotificationService from '../../services/pushNotificationService';

interface NotificationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export function NotificationPermissionDialog({
  open,
  onOpenChange,
  onPermissionGranted,
  onPermissionDenied
}: NotificationPermissionDialogProps): JSX.Element {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const permission = await pushNotificationService.requestPermission();
      
      if (permission === 'granted') {
        onPermissionGranted?.();
        onOpenChange(false);
      } else if (permission === 'denied') {
        onPermissionDenied?.();
        setError('Notification permission was denied. You can enable it later in your browser settings.');
      } else {
        setError('Permission request was dismissed. You can try again later.');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setError('Failed to request permission. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDecline = () => {
    onPermissionDenied?.();
    onOpenChange(false);
  };

  const notificationFeatures = [
    {
      icon: <ClockIcon className="h-4 w-4 text-electric-400" />,
      title: "Shift Reminders",
      description: "Get notified 30 minutes before your shift starts"
    },
    {
      icon: <ExclamationTriangleIcon className="h-4 w-4 text-gold-400" />,
      title: "Emergency Alerts",
      description: "Receive critical club notifications immediately"
    },
    {
      icon: <ShieldCheckIcon className="h-4 w-4 text-success-400" />,
      title: "Swap Approvals",
      description: "Know when your shift swap requests are approved or denied"
    }
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="relative bg-midnight-950 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              Enable Push Notifications
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              Stay up to date with important club updates and never miss a shift
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-text-tertiary" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            {notificationFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-midnight-800">
                  {feature.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{feature.title}</p>
                  <p className="text-xs text-text-muted">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-danger-500/5 border border-danger-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-danger-400 mt-0.5" />
                <div>
                  <h4 className="text-danger-400 font-medium">Error</h4>
                  <p className="text-danger-400/70 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-midnight-900/50 p-3 rounded-lg border border-white/5">
            <p className="text-xs text-text-muted">
              <strong className="text-text-secondary">Privacy Note:</strong> Notifications are sent securely and only contain information 
              relevant to your shifts and club activities. You can disable them at any time.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="flex-1 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 disabled:bg-midnight-700 disabled:text-text-muted text-white font-medium rounded-xl transition-colors"
          >
            {isRequesting ? 'Requesting...' : 'Enable Notifications'}
          </button>
          <button
            onClick={handleDecline}
            disabled={isRequesting}
            className="px-4 py-2.5 bg-midnight-800 hover:bg-midnight-700 text-text-primary font-medium rounded-xl transition-colors border border-white/10"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}