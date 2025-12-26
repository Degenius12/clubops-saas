import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Clock, FileText, Users,
  Upload, Eye, XCircle, Loader2, Filter, Search
} from 'lucide-react';

interface ComplianceStats {
  totalEntertainers: number;
  compliantCount: number;
  expiringLicenses: number;
  missingDocuments: number;
}

interface Alert {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  alertType: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  involvedEntertainerId?: string;
  entertainerName?: string;
}

interface EntertainerCompliance {
  id: string;
  stageName: string;
  onboardingStatus: string;
  hasSignedContract: boolean;
  documentsCount: number;
  approvedDocumentsCount: number;
  expiringDocumentsCount: number;
}

export function ComplianceDashboard(): JSX.Element {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<ComplianceStats>({
    totalEntertainers: 0,
    compliantCount: 0,
    expiringLicenses: 0,
    missingDocuments: 0
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [entertainers, setEntertainers] = useState<EntertainerCompliance[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // In a real implementation, these would be separate API endpoints
      // For now, we'll fetch alerts and derive stats
      const alertsResponse = await fetch('/api/security/alerts?type=compliance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!alertsResponse.ok) {
        throw new Error('Failed to load compliance data');
      }

      const alertsData = await alertsResponse.json();
      setAlerts(alertsData.alerts || []);

      // Calculate stats from alerts
      const expiringCount = (alertsData.alerts || []).filter(
        (a: Alert) => a.alertType === 'LICENSE_EXPIRING' && a.status === 'OPEN'
      ).length;

      setStats({
        totalEntertainers: 0, // Would come from separate endpoint
        compliantCount: 0,
        expiringLicenses: expiringCount,
        missingDocuments: 0
      });

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5" />;
      case 'MEDIUM':
        return <Clock className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchTerm === '' ||
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || alert.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor license compliance, document verification, and onboarding status
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entertainers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalEntertainers}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fully Compliant</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.compliantCount}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Licenses</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.expiringLicenses}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Missing Documents</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.missingDocuments}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Compliance Alerts</h2>
            <p className="text-sm text-gray-600 mt-1">
              Active alerts requiring attention
            </p>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search alerts..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="ACKNOWLEDGED">Acknowledged</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="divide-y divide-gray-200">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No compliance alerts</p>
                <p className="text-sm text-gray-500 mt-1">All entertainers are compliant</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                        {getSeverityIcon(alert.severity)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {alert.title}
                          </h3>
                          <span className={`
                            px-2 py-0.5 text-xs font-medium rounded-full border
                            ${getSeverityColor(alert.severity)}
                          `}>
                            {alert.severity}
                          </span>
                          <span className={`
                            px-2 py-0.5 text-xs font-medium rounded-full
                            ${alert.status === 'OPEN' ? 'bg-red-100 text-red-800' : ''}
                            ${alert.status === 'ACKNOWLEDGED' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${alert.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : ''}
                          `}>
                            {alert.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {alert.description}
                        </p>

                        {alert.entertainerName && (
                          <p className="text-xs text-gray-500">
                            Entertainer: <span className="font-medium">{alert.entertainerName}</span>
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-1">
                          Created: {new Date(alert.createdAt).toLocaleDateString()} at {new Date(alert.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/security/alerts/${alert.id}`)}
                      className="ml-4 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/onboarding/new')}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Users className="w-5 h-5 mr-2" />
              Start New Onboarding
            </button>

            <button
              onClick={() => navigate('/compliance/documents')}
              className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <FileText className="w-5 h-5 mr-2" />
              View All Documents
            </button>

            <button
              onClick={() => navigate('/compliance/upload')}
              className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
