import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface WeekBreakdown {
  weekNumber: number;
  startDate: string;
  endDate: string;
  total: number;
  categories: {
    HOUSE_FEE: number;
    TIP_OUT: number;
    VIP_SESSION: number;
    TIP: number;
    BONUS: number;
    OTHER: number;
  };
}

interface MonthlyData {
  month: string;
  total: number;
  previous_month_total: number;
  change_percent: number;
  trend: 'up' | 'down';
  weekly_breakdown: WeekBreakdown[];
  categories: {
    HOUSE_FEE: number;
    TIP_OUT: number;
    VIP_SESSION: number;
    TIP: number;
    BONUS: number;
    OTHER: number;
  };
}

const MonthlyReport: React.FC = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [exportingPDF, setExportingPDF] = useState(false);

  const fetchMonthlyReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/revenue/monthly`, {
        params: {
          year: selectedYear,
          month: selectedMonth,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMonthlyData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch monthly report:', err);
      setError(err.response?.data?.error || 'Failed to load monthly report');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    setExportingPDF(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/revenue/monthly-pdf`, {
        params: {
          year: selectedYear,
          month: selectedMonth,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `revenue-report-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF report. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedYear, selectedMonth]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchMonthlyReport}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!monthlyData) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const maxWeeklyRevenue = Math.max(...monthlyData.weekly_breakdown.map((w) => w.total));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monthly Revenue Report</h1>
          <p className="text-gray-500 mt-1">Comprehensive financial overview</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date(2000, i, 1);
              return (
                <option key={i + 1} value={i + 1}>
                  {date.toLocaleDateString('en-US', { month: 'long' })}
                </option>
              );
            })}
          </select>

          {/* Export PDF Button */}
          <button
            onClick={exportToPDF}
            disabled={exportingPDF}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            {exportingPDF ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
            <CurrencyDollarIcon className="h-6 w-6 opacity-75" />
          </div>
          <div className="text-3xl font-bold">{formatCurrency(monthlyData.total)}</div>
          <div className="flex items-center gap-2 mt-2 text-sm opacity-90">
            {monthlyData.trend === 'up' ? (
              <ArrowTrendingUpIcon className="h-4 w-4" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4" />
            )}
            <span>
              {Math.abs(monthlyData.change_percent)}% vs previous month
            </span>
          </div>
        </div>

        {/* Previous Month */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Previous Month</h3>
            <CalendarIcon className="h-6 w-6 opacity-75" />
          </div>
          <div className="text-3xl font-bold">
            {formatCurrency(monthlyData.previous_month_total)}
          </div>
        </div>

        {/* Average Weekly */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Average Weekly</h3>
            <ChartBarIcon className="h-6 w-6 opacity-75" />
          </div>
          <div className="text-3xl font-bold">
            {formatCurrency(monthlyData.total / monthlyData.weekly_breakdown.length)}
          </div>
        </div>
      </div>

      {/* Weekly Breakdown Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Weekly Breakdown</h2>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-4 h-64 mb-6">
          {monthlyData.weekly_breakdown.map((week) => {
            const heightPercent = maxWeeklyRevenue > 0 ? (week.total / maxWeeklyRevenue) * 100 : 0;

            return (
              <div key={week.weekNumber} className="flex-1 flex flex-col items-center">
                <div className="relative w-full flex items-end justify-center h-full">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500"
                    style={{ height: `${heightPercent}%`, minHeight: '20px' }}
                  >
                    <div className="absolute -top-8 left-0 right-0 text-center text-sm font-semibold text-gray-900">
                      {formatCurrency(week.total)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 text-center">
                  Week {week.weekNumber}
                </div>
                <div className="text-xs text-gray-400 text-center">
                  {new Date(week.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  House Fees
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tip Outs
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VIP Sessions
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.weekly_breakdown.map((week) => (
                <tr key={week.weekNumber} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    Week {week.weekNumber}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {week.startDate} to {week.endDate}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(week.categories.HOUSE_FEE)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(week.categories.TIP_OUT)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(week.categories.VIP_SESSION)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                    {formatCurrency(week.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Revenue by Category</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(monthlyData.categories).map(([category, amount]) => {
                const percent = monthlyData.total > 0 ? (amount / monthlyData.total) * 100 : 0;

                return (
                  <tr key={category} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getCategoryLabel(category)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {percent.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;
