import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  Search,
  Filter,
  FileText
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface Entertainer {
  entertainerId: string;
  stageName: string;
  legalName: string;
  shiftCount: number;
  totalEarnings: number;
  totalTipOuts: number;
  expectedTipOut: number;
  discrepancyAmount: number;
  discrepancyPercent: number;
  isFlagged: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  lastShiftDate: string;
}

interface DiscrepancySummary {
  totalEntertainers: number;
  flaggedEntertainers: number;
  totalDiscrepancy: string;
  highSeverityCount: number;
  mediumSeverityCount: number;
}

interface ShiftDetail {
  checkInId: string;
  shiftId: string;
  shiftName: string;
  date: string;
  checkedInAt: string;
  checkedOutAt: string;
  earnings: {
    vip: number;
    tips: number;
    bonuses: number;
    total: number;
  };
  tipOuts: {
    collected: number;
    houseFees: number;
    barFee: number;
    barFeePaid: boolean;
    total: number;
  };
  discrepancy: {
    expected: number;
    actual: number;
    amount: number;
    percent: number;
    isFlagged: boolean;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  vipSessionCount: number;
  transactionCount: number;
}

const DiscrepancyReport: React.FC = () => {
  const [entertainers, setEntertainers] = useState<Entertainer[]>([]);
  const [summary, setSummary] = useState<DiscrepancySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEntertainerId, setSelectedEntertainerId] = useState<string | null>(null);
  const [shiftDetails, setShiftDetails] = useState<ShiftDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [dateRange, setDateRange] = useState('7'); // days

  const fetchDiscrepancies = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const response = await axios.get(
        `${API_BASE_URL}/api/discrepancy/all`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            flaggedOnly: flaggedOnly.toString()
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setEntertainers(response.data.entertainers || []);
      setSummary(response.data.summary || null);
    } catch (err: any) {
      console.error('Failed to fetch discrepancies:', err);
      setError(err.response?.data?.error || 'Failed to load discrepancy report');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntertainerDetails = async (entertainerId: string) => {
    setLoadingDetails(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const response = await axios.get(
        `${API_BASE_URL}/api/discrepancy/entertainer/${entertainerId}`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setShiftDetails(response.data.shifts || []);
      setSelectedEntertainerId(entertainerId);
    } catch (err: any) {
      console.error('Failed to fetch entertainer details:', err);
      alert('Failed to load entertainer shift details');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchDiscrepancies();
  }, [dateRange, flaggedOnly]);

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredEntertainers = filterSeverity === 'all'
    ? entertainers
    : entertainers.filter(e => e.severity === filterSeverity);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading discrepancy report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Tip-Out Discrepancy Report
          </h2>
          <p className="text-gray-600 mt-1">
            Track and flag entertainer tip-out discrepancies
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <button
            onClick={() => setFlaggedOnly(!flaggedOnly)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              flaggedOnly
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="inline-block w-4 h-4 mr-2" />
            {flaggedOnly ? 'Flagged Only' : 'Show All'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entertainers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalEntertainers}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagged Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary.flaggedEntertainers}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Discrepancy</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${summary.totalDiscrepancy}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Severity</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary.highSeverityCount}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Severity Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter by Severity:</span>
          <div className="flex gap-2">
            {['all', 'HIGH', 'MEDIUM', 'LOW'].map(severity => (
              <button
                key={severity}
                onClick={() => setFilterSeverity(severity)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterSeverity === severity
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {severity === 'all' ? 'All' : severity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Entertainer List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Entertainer Discrepancies ({filteredEntertainers.length})
          </h3>
        </div>

        {filteredEntertainers.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No discrepancies found for this filter</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredEntertainers.map(entertainer => (
              <div
                key={entertainer.entertainerId}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => fetchEntertainerDetails(entertainer.entertainerId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900">
                        {entertainer.stageName}
                      </h4>
                      {entertainer.isFlagged && (
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                          getSeverityBadgeClass(entertainer.severity)
                        }`}>
                          {entertainer.severity}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {entertainer.legalName}
                    </p>
                    <div className="flex items-center gap-6 mt-2 text-sm text-gray-500">
                      <span>{entertainer.shiftCount} shifts</span>
                      <span>Earned: ${entertainer.totalEarnings.toFixed(2)}</span>
                      <span>Tip-out: ${entertainer.totalTipOuts.toFixed(2)}</span>
                      <span>Expected: ${entertainer.expectedTipOut.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      entertainer.isFlagged ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ${Math.abs(entertainer.discrepancyAmount).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {entertainer.discrepancyPercent.toFixed(1)}% variance
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shift Details Modal */}
      {selectedEntertainerId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Shift Details</h3>
              <button
                onClick={() => {
                  setSelectedEntertainerId(null);
                  setShiftDetails([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {loadingDetails ? (
              <div className="p-8 text-center text-gray-500">
                Loading shift details...
              </div>
            ) : (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Earnings</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expected Tip-Out</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual Tip-Out</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discrepancy</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {shiftDetails.map(shift => (
                        <tr key={shift.checkInId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(shift.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {shift.shiftName}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            ${shift.earnings.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">
                            ${shift.discrepancy.expected.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">
                            ${shift.discrepancy.actual.toFixed(2)}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-medium ${
                            shift.discrepancy.isFlagged ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ${shift.discrepancy.amount.toFixed(2)}
                            <div className="text-xs text-gray-500">
                              ({shift.discrepancy.percent.toFixed(1)}%)
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {shift.discrepancy.isFlagged ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                getSeverityBadgeClass(shift.discrepancy.severity)
                              }`}>
                                {shift.discrepancy.severity}
                              </span>
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscrepancyReport;
