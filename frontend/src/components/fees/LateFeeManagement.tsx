import React, { useState, useEffect } from 'react';
import { AlertTriangle, DollarSign, Calendar, Settings, CheckCircle } from 'lucide-react';

interface LateFeeConfig {
  lateFeeEnabled: boolean;
  lateFeeAmount: number;
  lateFeeGraceDays: number;
  lateFeeFrequency: string;
}

interface EntertainerPreview {
  id: string;
  stageName: string;
  totalOverdue: number;
  daysOverdue: number;
  lastPayment: string | null;
}

interface LateFeePreview {
  config: LateFeeConfig;
  preview: EntertainerPreview[];
  totalToCharge: number;
  affectedCount: number;
}

interface LateFeeReport {
  lateFees: Array<{
    id: string;
    entertainerId: string;
    entertainerName: string;
    amount: number;
    status: string;
    createdAt: string;
    paidAt: string | null;
  }>;
  totals: {
    total: number;
    paid: number;
    pending: number;
  };
  count: number;
}

export function LateFeeManagement(): JSX.Element {
  const [preview, setPreview] = useState<LateFeePreview | null>(null);
  const [report, setReport] = useState<LateFeeReport | null>(null);
  const [config, setConfig] = useState<LateFeeConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'report' | 'config'>('preview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      if (activeTab === 'preview') {
        const res = await fetch('http://localhost:3001/api/late-fees/preview', { headers });
        if (!res.ok) throw new Error('Failed to load preview');
        const data = await res.json();
        setPreview(data);
      } else if (activeTab === 'report') {
        const res = await fetch('http://localhost:3001/api/late-fees/report', { headers });
        if (!res.ok) throw new Error('Failed to load report');
        const data = await res.json();
        setReport(data);
      } else if (activeTab === 'config') {
        const res = await fetch('http://localhost:3001/api/late-fees/config', { headers });
        if (!res.ok) throw new Error('Failed to load config');
        const data = await res.json();
        setConfig(data.config);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Late Fee Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track and manage late payment fees for entertainers
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <AlertTriangle className="inline-block w-4 h-4 mr-2" />
            Preview Charges
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'report'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <DollarSign className="inline-block w-4 h-4 mr-2" />
            Fee Report
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <Settings className="inline-block w-4 h-4 mr-2" />
            Configuration
          </button>
        </nav>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Preview Tab */}
          {activeTab === 'preview' && preview && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Entertainers Affected
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {preview.affectedCount}
                      </p>
                    </div>
                    <AlertTriangle className="w-12 h-12 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total to Charge
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {formatCurrency(preview.totalToCharge)}
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-500" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Fee Amount
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {formatCurrency(preview.config.lateFeeAmount)}
                      </p>
                    </div>
                    <Settings className="w-12 h-12 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Entertainers List */}
              {preview.preview.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Entertainers with Overdue Payments
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Entertainer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Amount Overdue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Days Overdue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Last Payment
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {preview.preview.map((entertainer) => (
                          <tr key={entertainer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {entertainer.stageName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-red-600 dark:text-red-400 font-semibold">
                                {formatCurrency(entertainer.totalOverdue)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                entertainer.daysOverdue > 7
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                                {entertainer.daysOverdue} days
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(entertainer.lastPayment)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Late Fees Due
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    All entertainers are current with their payments
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Report Tab */}
          {activeTab === 'report' && report && (
            <div className="space-y-6">
              {/* Totals Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Fees</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(report.totals.total)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {formatCurrency(report.totals.paid)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                    {formatCurrency(report.totals.pending)}
                  </p>
                </div>
              </div>

              {/* Fee History */}
              {report.lateFees.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Late Fee History ({report.count} total)
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Entertainer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date Charged
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date Paid
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {report.lateFees.map((fee) => (
                          <tr key={fee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {fee.entertainerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatCurrency(fee.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(fee.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                fee.status === 'PAID'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                                {fee.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(fee.paidAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Fee History
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No late fees have been charged yet
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Config Tab */}
          {activeTab === 'config' && config && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Late Fee Configuration
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Late Fees Enabled</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically charge late fees for overdue payments
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    config.lateFeeEnabled
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {config.lateFeeEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Fee Amount</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(config.lateFeeAmount)}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Grace Period</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {config.lateFeeGraceDays} days
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Frequency</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {config.lateFeeFrequency.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Note:</strong> Late fees are configured at the club level in Settings.
                    Contact your system administrator to modify these settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
