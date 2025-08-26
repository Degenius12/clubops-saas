import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import { fetchRevenue } from '../../store/slices/revenueSlice'
import {
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline'

const Revenue: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { 
    todayRevenue, 
    weeklyRevenue, 
    monthlyRevenue, 
    yearlyRevenue,
    revenueHistory,
    loading 
  } = useSelector((state: RootState) => state.revenue)
  
  const [selectedPeriod, setSelectedPeriod] = useState('today')

  useEffect(() => {
    dispatch(fetchRevenue({ period: selectedPeriod }))
  }, [dispatch, selectedPeriod])

  const revenueData = [
    {
      title: 'Today',
      amount: todayRevenue || 0,
      change: '+12.5%',
      changeType: 'increase',
      period: 'vs yesterday',
      icon: CurrencyDollarIcon,
      color: 'accent-blue'
    },
    {
      title: 'This Week',
      amount: weeklyRevenue || 0,
      change: '+8.2%',
      changeType: 'increase',
      period: 'vs last week',
      icon: CalendarDaysIcon,
      color: 'accent-gold'
    },
    {
      title: 'This Month',
      amount: monthlyRevenue || 0,
      change: '+15.7%',
      changeType: 'increase',
      period: 'vs last month',
      icon: ChartBarIcon,
      color: 'accent-red'
    },
    {
      title: 'This Year',
      amount: yearlyRevenue || 0,
      change: '+22.1%',
      changeType: 'increase',
      period: 'vs last year',
      icon: TrendingUpIcon,
      color: 'accent-green'
    }
  ]

  const revenueBreakdown = [
    { category: 'VIP Rooms', amount: (todayRevenue || 0) * 0.6, percentage: 60, color: 'accent-red' },
    { category: 'Bar Sales', amount: (todayRevenue || 0) * 0.25, percentage: 25, color: 'accent-gold' },
    { category: 'Cover Charges', amount: (todayRevenue || 0) * 0.10, percentage: 10, color: 'accent-blue' },
    { category: 'Other', amount: (todayRevenue || 0) * 0.05, percentage: 5, color: 'accent-green' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Revenue Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Track financial performance and revenue analytics
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-dark-card border border-white/20 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueData.map((item) => {
          const Icon = item.icon
          return (
            <div 
              key={item.title}
              className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-accent-blue/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${item.color}/20 rounded-lg`}>
                  <Icon className={`h-6 w-6 text-${item.color}`} />
                </div>
                <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                  item.changeType === 'increase' 
                    ? 'bg-green-900/30 text-green-400' 
                    : 'bg-red-900/30 text-red-400'
                }`}>
                  {item.changeType === 'increase' ? (
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDownIcon className="h-3 w-3 mr-1" />
                  )}
                  {item.change}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">{item.title}</h3>
                <p className="text-2xl font-bold text-white">
                  ${item.amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{item.period}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown Chart */}
        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Revenue Breakdown</h2>
          
          <div className="space-y-4">
            {revenueBreakdown.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-medium">{item.category}</span>
                  <div className="text-right">
                    <span className="text-white font-medium">${item.amount.toFixed(0)}</span>
                    <span className="text-gray-400 text-sm ml-2">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-dark-bg/50 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full bg-${item.color} transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Metrics */}
        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Live Metrics</h2>
          
          <div className="space-y-6">
            <div className="bg-dark-bg/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Revenue Per Hour</h3>
              <div className="text-2xl font-bold text-accent-blue">
                ${((todayRevenue || 0) / new Date().getHours() || 0).toFixed(0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Average since opening</div>
            </div>

            <div className="bg-dark-bg/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Peak Hour Revenue</h3>
              <div className="text-2xl font-bold text-accent-gold">
                ${Math.max(150, (todayRevenue || 0) * 0.3).toFixed(0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Between 10-11 PM</div>
            </div>

            <div className="bg-dark-bg/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Average Transaction</h3>
              <div className="text-2xl font-bold text-accent-red">
                ${((todayRevenue || 0) / 12 || 45).toFixed(0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Per customer visit</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
          <button className="text-accent-blue hover:text-accent-gold transition-colors text-sm">
            View All →
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Mock transaction data */}
          {[
            { id: 1, type: 'VIP Room 3', amount: 180, time: '2:45 PM', customer: 'Anonymous' },
            { id: 2, type: 'Bar Sale', amount: 85, time: '2:30 PM', customer: 'John D.' },
            { id: 3, type: 'Cover Charge', amount: 25, time: '2:15 PM', customer: 'Guest' },
            { id: 4, type: 'VIP Room 1', amount: 240, time: '1:45 PM', customer: 'Michael R.' },
            { id: 5, type: 'Bar Sale', amount: 120, time: '1:30 PM', customer: 'Sarah M.' }
          ].map((transaction) => (
            <div 
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg border border-white/5 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-accent-blue to-accent-gold rounded-full flex items-center justify-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">{transaction.type}</p>
                  <p className="text-gray-400 text-sm">{transaction.customer} • {transaction.time}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-green-400 font-bold">+${transaction.amount}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Goals */}
      <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Monthly Goals</h2>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Monthly Target</span>
              <span className="text-white font-medium">$25,000</span>
            </div>
            <div className="w-full bg-dark-bg/50 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-accent-blue to-accent-gold transition-all duration-500"
                style={{ width: `${Math.min(((monthlyRevenue || 0) / 25000) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className="text-gray-400">
                ${(monthlyRevenue || 0).toLocaleString()} achieved
              </span>
              <span className="text-accent-gold">
                {(((monthlyRevenue || 0) / 25000) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-dark-bg/50 rounded-lg p-3">
              <div className="text-lg font-bold text-white">{new Date().getDate()}</div>
              <div className="text-xs text-gray-400">Days Elapsed</div>
            </div>
            <div className="bg-dark-bg/50 rounded-lg p-3">
              <div className="text-lg font-bold text-accent-gold">
                ${Math.round((25000 - (monthlyRevenue || 0))).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Remaining</div>
            </div>
            <div className="bg-dark-bg/50 rounded-lg p-3">
              <div className="text-lg font-bold text-accent-blue">
                ${Math.round((25000 - (monthlyRevenue || 0)) / (30 - new Date().getDate()) || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Daily Target</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Revenue