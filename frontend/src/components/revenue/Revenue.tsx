import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import { fetchRevenue } from '../../store/slices/revenueSlice'
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  TicketIcon,
  SparklesIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

// Animated counter hook
const useAnimatedCounter = (end: number, duration: number = 800) => {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    countRef.current = 0
    startTimeRef.current = null
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(easeOut * end)
      
      setCount(current)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }
    
    requestAnimationFrame(animate)
  }, [end, duration])

  return count
}

const Revenue: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { 
    todayRevenue, 
    weeklyRevenue, 
    monthlyRevenue, 
    yearlyRevenue,
    loading 
  } = useSelector((state: RootState) => state.revenue)
  
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [showExportModal, setShowExportModal] = useState(false)

  // Animated values
  const animatedToday = useAnimatedCounter(todayRevenue || 2847)
  const animatedWeekly = useAnimatedCounter(weeklyRevenue || 18420)
  const animatedMonthly = useAnimatedCounter(monthlyRevenue || 48500)
  const animatedYearly = useAnimatedCounter(yearlyRevenue || 385000)

  useEffect(() => {
    dispatch(fetchRevenue({ period: selectedPeriod }))
  }, [dispatch, selectedPeriod])

  const revenueCards = [
    {
      title: 'Today',
      amount: animatedToday,
      rawAmount: todayRevenue || 2847,
      change: '+12.5%',
      positive: true,
      period: 'vs yesterday',
      icon: CurrencyDollarIcon,
      gradient: 'from-electric-500 to-electric-600',
      glow: 'shadow-glow-cyan'
    },
    {
      title: 'This Week',
      amount: animatedWeekly,
      rawAmount: weeklyRevenue || 18420,
      change: '+8.2%',
      positive: true,
      period: 'vs last week',
      icon: CalendarDaysIcon,
      gradient: 'from-gold-500 to-gold-600',
      glow: 'shadow-glow-gold'
    },
    {
      title: 'This Month',
      amount: animatedMonthly,
      rawAmount: monthlyRevenue || 48500,
      change: '+15.7%',
      positive: true,
      period: 'vs last month',
      icon: ChartBarIcon,
      gradient: 'from-royal-500 to-royal-600',
      glow: 'shadow-glow-purple'
    },
    {
      title: 'This Year',
      amount: animatedYearly,
      rawAmount: yearlyRevenue || 385000,
      change: '+22.1%',
      positive: true,
      period: 'vs last year',
      icon: ArrowTrendingUpIcon,
      gradient: 'from-success-500 to-success-600',
      glow: 'shadow-glow-success'
    }
  ]

  const revenueBreakdown = [
    { 
      category: 'VIP Booth', 
      amount: (todayRevenue || 2847) * 0.55, 
      percentage: 55, 
      color: 'bg-gold-500',
      textColor: 'text-gold-400',
      icon: BuildingStorefrontIcon
    },
    { 
      category: 'Bar Fees', 
      amount: (todayRevenue || 2847) * 0.28, 
      percentage: 28, 
      color: 'bg-royal-500',
      textColor: 'text-royal-400',
      icon: BanknotesIcon
    },
    { 
      category: 'Cover Charges', 
      amount: (todayRevenue || 2847) * 0.12, 
      percentage: 12, 
      color: 'bg-electric-500',
      textColor: 'text-electric-400',
      icon: TicketIcon
    },
    { 
      category: 'Tips & Other', 
      amount: (todayRevenue || 2847) * 0.05, 
      percentage: 5, 
      color: 'bg-success-500',
      textColor: 'text-success-400',
      icon: SparklesIcon
    }
  ]

  const recentTransactions = [
    { id: 1, type: 'VIP Booth 3', category: 'vip', amount: 180, time: '2:45 PM', dancer: 'Luna' },
    { id: 2, type: 'Bar Fee', category: 'bar', amount: 85, time: '2:30 PM', dancer: 'Crystal' },
    { id: 3, type: 'Cover Charge', category: 'cover', amount: 25, time: '2:15 PM', dancer: null },
    { id: 4, type: 'VIP Booth 1', category: 'vip', amount: 240, time: '1:45 PM', dancer: 'Diamond' },
    { id: 5, type: 'Bar Fee', category: 'bar', amount: 120, time: '1:30 PM', dancer: 'Luna' },
    { id: 6, type: 'VIP Booth 2', category: 'vip', amount: 360, time: '1:00 PM', dancer: 'Crystal' }
  ]

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'vip': return { bg: 'bg-gold-500/10', text: 'text-gold-400', border: 'border-gold-500/20' }
      case 'bar': return { bg: 'bg-royal-500/10', text: 'text-royal-400', border: 'border-royal-500/20' }
      case 'cover': return { bg: 'bg-electric-500/10', text: 'text-electric-400', border: 'border-electric-500/20' }
      default: return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' }
    }
  }

  const monthlyGoal = 50000
  const goalProgress = ((monthlyRevenue || 48500) / monthlyGoal) * 100
  const daysRemaining = 30 - new Date().getDate()
  const dailyTarget = daysRemaining > 0 ? (monthlyGoal - (monthlyRevenue || 48500)) / daysRemaining : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
            Revenue Dashboard
          </h1>
          <p className="text-text-secondary mt-1">
            Track financial performance and revenue analytics
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input-premium pr-10 appearance-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <FunnelIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          </div>

          {/* Export Button */}
          <button 
            onClick={() => setShowExportModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div 
              key={card.title}
              className={`card-premium p-5 hover:${card.glow} transition-all duration-300`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  card.positive 
                    ? 'bg-success-500/10 text-success-400' 
                    : 'bg-danger-500/10 text-danger-400'
                }`}>
                  {card.positive ? (
                    <ArrowUpIcon className="w-3 h-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-3 h-3" />
                  )}
                  {card.change}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-text-secondary mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-text-primary font-mono tabular-nums">
                  ${card.amount.toLocaleString()}
                </p>
                <p className="text-xs text-text-muted mt-1">{card.period}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue Breakdown & Live Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue Breakdown - 3 cols */}
        <div className="lg:col-span-3 card-premium p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-6">Revenue Breakdown</h2>
          
          {/* Visual Bar Chart */}
          <div className="mb-6">
            <div className="flex h-8 rounded-xl overflow-hidden bg-midnight-900">
              {revenueBreakdown.map((item, index) => (
                <div 
                  key={item.category}
                  className={`${item.color} transition-all duration-700 ease-out relative group`}
                  style={{ 
                    width: `${item.percentage}%`,
                    animationDelay: `${index * 150}ms`
                  }}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Breakdown List */}
          <div className="space-y-4">
            {revenueBreakdown.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.color}/10`}>
                      <Icon className={`w-4 h-4 ${item.textColor}`} />
                    </div>
                    <div>
                      <p className="text-text-primary font-medium">{item.category}</p>
                      <p className="text-xs text-text-muted">{item.percentage}% of total</p>
                    </div>
                  </div>
                  <p className="text-text-primary font-semibold font-mono">
                    ${item.amount.toFixed(0)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Live Metrics - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {/* Revenue Per Hour */}
          <div className="card-premium p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-electric-500/10">
                <ClockIcon className="w-5 h-5 text-electric-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Revenue Per Hour</p>
                <p className="text-xl font-bold text-electric-400 font-mono">
                  ${Math.round((todayRevenue || 2847) / Math.max(new Date().getHours(), 1))}
                </p>
              </div>
            </div>
            <p className="text-xs text-text-muted">Average since opening</p>
          </div>

          {/* Peak Hour */}
          <div className="card-premium p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gold-500/10">
                <SparklesIcon className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Peak Hour Revenue</p>
                <p className="text-xl font-bold text-gold-400 font-mono">
                  ${Math.round((todayRevenue || 2847) * 0.35)}
                </p>
              </div>
            </div>
            <p className="text-xs text-text-muted">10:00 PM - 11:00 PM</p>
          </div>

          {/* Avg Transaction */}
          <div className="card-premium p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-royal-500/10">
                <BanknotesIcon className="w-5 h-5 text-royal-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Avg Transaction</p>
                <p className="text-xl font-bold text-royal-400 font-mono">
                  ${Math.round((todayRevenue || 2847) / 24)}
                </p>
              </div>
            </div>
            <p className="text-xs text-text-muted">Per customer today</p>
          </div>
        </div>
      </div>

      {/* Monthly Goal */}
      <div className="card-premium p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Monthly Goal Progress</h2>
            <p className="text-sm text-text-secondary">December 2025</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gold-400 font-mono">
              ${(monthlyRevenue || 48500).toLocaleString()}
            </p>
            <p className="text-sm text-text-muted">of ${monthlyGoal.toLocaleString()} goal</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative mb-6">
          <div className="h-4 bg-midnight-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${Math.min(goalProgress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          <div 
            className="absolute -top-1 w-1 h-6 bg-white/50 rounded-full"
            style={{ left: `${Math.min(goalProgress, 100)}%`, transform: 'translateX(-50%)' }}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-midnight-900/50 rounded-xl">
            <p className="text-2xl font-bold text-text-primary font-mono">{goalProgress.toFixed(1)}%</p>
            <p className="text-xs text-text-muted">Achieved</p>
          </div>
          <div className="text-center p-3 bg-midnight-900/50 rounded-xl">
            <p className="text-2xl font-bold text-warning-400 font-mono">{daysRemaining}</p>
            <p className="text-xs text-text-muted">Days Left</p>
          </div>
          <div className="text-center p-3 bg-midnight-900/50 rounded-xl">
            <p className="text-2xl font-bold text-electric-400 font-mono">
              ${dailyTarget > 0 ? Math.round(dailyTarget).toLocaleString() : '0'}
            </p>
            <p className="text-xs text-text-muted">Daily Target</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">Recent Transactions</h2>
          <button className="text-sm text-gold-400 hover:text-gold-300 transition-colors">
            View All →
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider pb-3">Type</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider pb-3">Dancer</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider pb-3">Time</th>
                <th className="text-right text-xs font-medium text-text-muted uppercase tracking-wider pb-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentTransactions.map((tx) => {
                const style = getCategoryStyle(tx.category)
                return (
                  <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 text-text-secondary">
                      {tx.dancer || '—'}
                    </td>
                    <td className="py-3 text-text-muted text-sm">
                      {tx.time}
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-success-400 font-semibold font-mono">
                        +${tx.amount}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowExportModal(false)}
          />
          <div className="relative bg-midnight-900 border border-white/10 rounded-2xl p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Export Revenue Data</h3>
            
            <div className="space-y-3 mb-6">
              <button className="w-full p-4 text-left bg-midnight-950 hover:bg-white/5 border border-white/10 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success-500/10 rounded-lg group-hover:bg-success-500/20 transition-colors">
                    <ArrowDownTrayIcon className="w-5 h-5 text-success-400" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Export as CSV</p>
                    <p className="text-sm text-text-muted">Spreadsheet format</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full p-4 text-left bg-midnight-950 hover:bg-white/5 border border-white/10 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-danger-500/10 rounded-lg group-hover:bg-danger-500/20 transition-colors">
                    <ArrowDownTrayIcon className="w-5 h-5 text-danger-400" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Export as PDF</p>
                    <p className="text-sm text-text-muted">Printable report</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full p-4 text-left bg-midnight-950 hover:bg-white/5 border border-white/10 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-royal-500/10 rounded-lg group-hover:bg-royal-500/20 transition-colors">
                    <ArrowDownTrayIcon className="w-5 h-5 text-royal-400" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Export as JSON</p>
                    <p className="text-sm text-text-muted">Raw data format</p>
                  </div>
                </div>
              </button>
            </div>
            
            <button 
              onClick={() => setShowExportModal(false)}
              className="w-full btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Revenue
