import React from 'react'
import {
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface EOSReportProps {
  shift: any
  summary?: any
  onClose?: () => void
  showCloseButton?: boolean
}

const EOSReport: React.FC<EOSReportProps> = ({ shift, summary, onClose, showCloseButton = true }) => {
  const handlePrint = () => {
    window.print()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const duration = summary?.duration || 0
  const totalRevenue = summary?.totalRevenue || shift?.totalRevenue || 0
  const totalCheckIns = summary?.totalCheckIns || shift?.totalCheckIns || 0
  const totalVipSessions = summary?.totalVipSessions || shift?.totalVipSessions || 0

  return (
    <div className="bg-midnight-900 min-h-screen p-4 sm:p-6 print:bg-white print:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8 mb-6 print:border-gray-300">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2 print:text-black">
                End of Shift Report
              </h1>
              <p className="text-text-tertiary print:text-gray-600">
                Generated {formatDateTime(new Date().toISOString())}
              </p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export PDF
              </button>
              {showCloseButton && onClose && (
                <button onClick={onClose} className="btn-primary">
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Shift Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gold-500/[0.08] border border-gold-500/20 print:bg-yellow-50 print:border-yellow-300">
              <p className="text-xs text-text-tertiary mb-1 print:text-gray-600">Shift Level</p>
              <p className="text-2xl font-bold text-gold-500 font-mono print:text-yellow-700">
                Level {shift?.shiftLevel}
              </p>
              <p className="text-xs text-text-secondary mt-1 print:text-gray-600">
                {shift?.shiftName}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-electric-500/[0.08] border border-electric-500/20 print:bg-blue-50 print:border-blue-300">
              <p className="text-xs text-text-tertiary mb-1 print:text-gray-600">Duration</p>
              <p className="text-2xl font-bold text-electric-400 font-mono print:text-blue-700">
                {formatDuration(duration)}
              </p>
              <p className="text-xs text-text-secondary mt-1 print:text-gray-600">
                {formatDateTime(shift?.startedAt)} - {formatDateTime(shift?.endedAt || new Date().toISOString())}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-status-success/[0.08] border border-status-success/20 print:bg-green-50 print:border-green-300">
              <p className="text-xs text-text-tertiary mb-1 print:text-gray-600">Status</p>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-6 w-6 text-status-success print:text-green-600" />
                <p className="text-xl font-bold text-status-success print:text-green-700">
                  Closed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Total Revenue */}
          <div className="card-premium p-6 print:bg-white print:border print:border-gray-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-status-success/10 print:bg-green-100">
                <CurrencyDollarIcon className="h-6 w-6 text-status-success print:text-green-600" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary print:text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold font-mono text-text-primary print:text-black">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          {/* Dancer Check-Ins */}
          <div className="card-premium p-6 print:bg-white print:border print:border-gray-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-electric-500/10 print:bg-blue-100">
                <UsersIcon className="h-6 w-6 text-electric-400 print:text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary print:text-gray-600">Dancer Check-Ins</p>
                <p className="text-2xl font-bold font-mono text-text-primary print:text-black">
                  {totalCheckIns}
                </p>
              </div>
            </div>
          </div>

          {/* VIP Sessions */}
          <div className="card-premium p-6 print:bg-white print:border print:border-gray-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gold-500/10 print:bg-yellow-100">
                <BuildingStorefrontIcon className="h-6 w-6 text-gold-500 print:text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary print:text-gray-600">VIP Sessions</p>
                <p className="text-2xl font-bold font-mono text-text-primary print:text-black">
                  {totalVipSessions}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="card-premium p-6 mb-6 print:bg-white print:border print:border-gray-300">
          <h2 className="text-xl font-semibold text-text-primary mb-4 print:text-black">
            Shift Summary
          </h2>

          <div className="space-y-4">
            {/* Sales Summary */}
            <div className="p-4 rounded-xl bg-midnight-800/50 border border-white/[0.06] print:bg-gray-50 print:border-gray-300">
              <h3 className="text-sm font-semibold text-text-primary mb-3 print:text-black">
                Sales Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary print:text-gray-700">Gross Sales</span>
                  <span className="font-mono font-semibold text-text-primary print:text-black">
                    {formatCurrency(totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary print:text-gray-700">Number of Transactions</span>
                  <span className="font-mono font-semibold text-text-primary print:text-black">
                    {totalCheckIns + totalVipSessions}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary print:text-gray-700">Average Transaction</span>
                  <span className="font-mono font-semibold text-text-primary print:text-black">
                    {formatCurrency(totalRevenue / Math.max(1, totalCheckIns + totalVipSessions))}
                  </span>
                </div>
              </div>
            </div>

            {/* Staffing */}
            <div className="p-4 rounded-xl bg-midnight-800/50 border border-white/[0.06] print:bg-gray-50 print:border-gray-300">
              <h3 className="text-sm font-semibold text-text-primary mb-3 print:text-black">
                Staffing
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary print:text-gray-700">Manager on Duty</span>
                  <span className="font-semibold text-text-primary print:text-black">
                    {shift?.user?.firstName} {shift?.user?.lastName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary print:text-gray-700">Dancers Worked</span>
                  <span className="font-mono font-semibold text-text-primary print:text-black">
                    {totalCheckIns}
                  </span>
                </div>
              </div>
            </div>

            {/* Manager Notes */}
            {shift?.notes && (
              <div className="p-4 rounded-xl bg-midnight-800/50 border border-white/[0.06] print:bg-gray-50 print:border-gray-300">
                <h3 className="text-sm font-semibold text-text-primary mb-3 print:text-black">
                  Manager Notes
                </h3>
                <p className="text-sm text-text-secondary whitespace-pre-wrap print:text-gray-700">
                  {shift.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-text-muted print:text-gray-500">
          <p>This report was automatically generated by ClubFlow</p>
          <p className="mt-1">Report ID: {shift?.id?.slice(0, 8)}</p>
        </div>
      </div>
    </div>
  )
}

export default EOSReport
