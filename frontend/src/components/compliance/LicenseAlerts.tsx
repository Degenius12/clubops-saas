import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Clock, FileText, Upload, X, Check,
  Loader2, Bell, BellOff
} from 'lucide-react';

interface ExpiringDocument {
  id: string;
  documentType: string;
  expiresAt: string;
  daysUntilExpiry: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  entertainer: {
    id: string;
    stageName: string;
  };
  alertId?: string;
}

export function LicenseAlerts(): JSX.Element {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expiringDocs, setExpiringDocs] = useState<ExpiringDocument[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadExpiringDocuments();

    // Refresh every 5 minutes
    const interval = setInterval(loadExpiringDocuments, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadExpiringDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/compliance/documents/expiring', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load expiring documents');
      }

      const data = await response.json();

      // Calculate days until expiry and severity for each document
      const today = new Date();
      const documentsWithSeverity = (data.documents || []).map((doc: any) => {
        const expiryDate = new Date(doc.expiresAt);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'MEDIUM';
        if (daysUntilExpiry <= 3) {
          severity = 'CRITICAL';
        } else if (daysUntilExpiry <= 7) {
          severity = 'HIGH';
        }

        return {
          ...doc,
          daysUntilExpiry,
          severity
        };
      });

      setExpiringDocs(documentsWithSeverity);

    } catch (err) {
      console.error('Failed to load expiring documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load expiring documents');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/security/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'ACKNOWLEDGED'
        })
      });

      if (response.ok) {
        setDismissedAlerts(prev => new Set(prev).add(alertId));
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL':
        return 'border-red-500 bg-red-50';
      case 'HIGH':
        return 'border-orange-500 bg-orange-50';
      case 'MEDIUM':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'MEDIUM':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityText = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL':
        return 'Expires in 3 days or less - URGENT';
      case 'HIGH':
        return 'Expires in 7 days or less';
      case 'MEDIUM':
        return 'Expires in 30 days or less';
      default:
        return 'Expiring soon';
    }
  };

  const formatDaysRemaining = (days: number): string => {
    if (days === 0) return 'Expires today!';
    if (days === 1) return 'Expires tomorrow';
    if (days < 0) return 'EXPIRED';
    return `${days} days remaining`;
  };

  const handleUploadNew = (documentId: string, entertainerId: string) => {
    navigate(`/compliance/upload?documentId=${documentId}&entertainerId=${entertainerId}`);
  };

  const visibleAlerts = expiringDocs.filter(doc =>
    doc.alertId ? !dismissedAlerts.has(doc.alertId) : true
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error Loading Alerts</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <div className="p-8 text-center bg-green-50 border border-green-200 rounded-lg">
        <Check className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-green-900">All Clear!</h3>
        <p className="text-sm text-green-700 mt-1">
          No expiring licenses or documents require attention
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">
            License Expiry Alerts
          </h2>
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            {visibleAlerts.length}
          </span>
        </div>

        <button
          onClick={loadExpiringDocuments}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3">
        {visibleAlerts
          .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
          .map((doc) => (
            <div
              key={doc.id}
              className={`
                border-l-4 rounded-lg p-4 shadow-sm
                ${getSeverityColor(doc.severity)}
                transition-all hover:shadow-md
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getSeverityIcon(doc.severity)}

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {doc.documentType.replace(/_/g, ' ')}
                      </h3>
                      <span className={`
                        px-2 py-0.5 text-xs font-medium rounded-full
                        ${doc.severity === 'CRITICAL' ? 'bg-red-200 text-red-900' : ''}
                        ${doc.severity === 'HIGH' ? 'bg-orange-200 text-orange-900' : ''}
                        ${doc.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-900' : ''}
                      `}>
                        {doc.severity}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">{doc.entertainer.stageName}</span>
                      {' '}- {getSeverityText(doc.severity)}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span className={`font-medium ${doc.daysUntilExpiry <= 0 ? 'text-red-600' : ''}`}>
                          {formatDaysRemaining(doc.daysUntilExpiry)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        <span>
                          Expires: {new Date(doc.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Countdown Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`
                            h-2 rounded-full transition-all
                            ${doc.daysUntilExpiry <= 3 ? 'bg-red-600' : ''}
                            ${doc.daysUntilExpiry > 3 && doc.daysUntilExpiry <= 7 ? 'bg-orange-500' : ''}
                            ${doc.daysUntilExpiry > 7 ? 'bg-yellow-500' : ''}
                          `}
                          style={{
                            width: `${Math.max(0, Math.min(100, (doc.daysUntilExpiry / 30) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleUploadNew(doc.id, doc.entertainer.id)}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload New
                  </button>

                  {doc.alertId && (
                    <button
                      onClick={() => acknowledgeAlert(doc.alertId!)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Acknowledge alert"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Dismissed Count */}
      {dismissedAlerts.size > 0 && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <BellOff className="w-4 h-4 mr-2" />
            <span>{dismissedAlerts.size} alert{dismissedAlerts.size !== 1 ? 's' : ''} acknowledged</span>
          </div>
          <button
            onClick={() => setDismissedAlerts(new Set())}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Show All
          </button>
        </div>
      )}
    </div>
  );
}
