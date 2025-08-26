import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import { fetchBilling, updatePaymentMethod, downloadInvoice } from '../../store/slices/subscriptionSlice'
import {
  CreditCardIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

const BillingPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { 
    billing, 
    invoices, 
    paymentMethods,
    currentPlan,
    loading 
  } = useSelector((state: RootState) => state.subscription)
  
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [newCardData, setNewCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })

  useEffect(() => {
    // dispatch(fetchBilling())
  }, [dispatch])

  const handleAddPaymentMethod = () => {
    dispatch(updatePaymentMethod(newCardData))
    setShowAddPaymentModal(false)
    setNewCardData({ number: '', expiry: '', cvv: '', name: '' })
  }

  const formatCardNumber = (number: string) => {
    return `****-****-****-${number.slice(-4)}`
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-400 bg-green-900/30'
      case 'pending': return 'text-yellow-400 bg-yellow-900/30'
      case 'failed': return 'text-red-400 bg-red-900/30'
      case 'overdue': return 'text-red-400 bg-red-900/30'
      default: return 'text-gray-400 bg-gray-900/30'
    }
  }

  // Mock data for demonstration
  const mockInvoices = [
    { id: 'inv-001', date: '2024-01-01', amount: 149, status: 'paid', plan: 'Pro Plan', period: 'Jan 2024' },
    { id: 'inv-002', date: '2023-12-01', amount: 149, status: 'paid', plan: 'Pro Plan', period: 'Dec 2023' },
    { id: 'inv-003', date: '2023-11-01', amount: 149, status: 'paid', plan: 'Pro Plan', period: 'Nov 2023' },
    { id: 'inv-004', date: '2023-10-01', amount: 49, status: 'paid', plan: 'Basic Plan', period: 'Oct 2023' },
  ]

  const mockPaymentMethods = [
    { id: '1', type: 'visa', last4: '1234', expiry: '12/26', isDefault: true },
    { id: '2', type: 'mastercard', last4: '5678', expiry: '08/25', isDefault: false },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Billing & Payments</h1>
          <p className="text-gray-400 mt-1">
            Manage your subscription billing and payment methods
          </p>
        </div>
        
        <button
          onClick={() => setShowAddPaymentModal(true)}
          className="bg-gradient-to-r from-accent-blue to-accent-gold hover:from-accent-gold hover:to-accent-blue text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Payment Method</span>
        </button>
      </div>

      {/* Current Subscription */}
      <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Current Subscription</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-dark-bg/50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <BanknotesIcon className="h-5 w-5 text-accent-gold" />
              <span className="text-gray-400 text-sm">Current Plan</span>
            </div>
            <p className="text-xl font-bold text-white">Pro Plan</p>
            <p className="text-accent-gold text-sm">$149/month</p>
          </div>
          
          <div className="bg-dark-bg/50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <CalendarDaysIcon className="h-5 w-5 text-accent-blue" />
              <span className="text-gray-400 text-sm">Next Billing</span>
            </div>
            <p className="text-xl font-bold text-white">
              {billing?.nextBillingDate ? new Date(billing.nextBillingDate).toLocaleDateString() : 'Feb 1, 2024'}
            </p>
            <p className="text-gray-400 text-sm">Auto-renewal enabled</p>
          </div>
          
          <div className="bg-dark-bg/50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <span className="text-gray-400 text-sm">Payment Status</span>
            </div>
            <p className="text-xl font-bold text-green-400">Current</p>
            <p className="text-gray-400 text-sm">All payments up to date</p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Payment Methods</h2>
          <button 
            onClick={() => setShowAddPaymentModal(true)}
            className="text-accent-blue hover:text-accent-gold transition-colors text-sm font-medium"
          >
            + Add New
          </button>
        </div>
        
        <div className="space-y-4">
          {mockPaymentMethods.map((method) => (
            <div 
              key={method.id}
              className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                  <CreditCardIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {method.type.toUpperCase()} {formatCardNumber(method.last4)}
                  </p>
                  <p className="text-gray-400 text-sm">Expires {method.expiry}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {method.isDefault && (
                  <span className="bg-accent-blue/20 text-accent-blue text-xs font-medium px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
                <button className="text-gray-400 hover:text-white transition-colors text-sm">
                  Edit
                </button>
                {!method.isDefault && (
                  <button className="text-red-400 hover:text-red-300 transition-colors text-sm">
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Billing History</h2>
          <button className="text-accent-blue hover:text-accent-gold transition-colors text-sm font-medium">
            Download All
          </button>
        </div>
        
        <div className="space-y-4">
          {mockInvoices.map((invoice) => (
            <div 
              key={invoice.id}
              className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-accent-blue/20 rounded-lg flex items-center justify-center">
                  <DocumentArrowDownIcon className="h-5 w-5 text-accent-blue" />
                </div>
                <div>
                  <p className="text-white font-medium">{invoice.plan}</p>
                  <p className="text-gray-400 text-sm">
                    {invoice.period} • {new Date(invoice.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-white font-medium">${invoice.amount}</p>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${getPaymentStatusColor(invoice.status)}`}>
                    {invoice.status.toUpperCase()}
                  </div>
                </div>
                
                <button
                  onClick={() => dispatch(downloadInvoice(invoice.id))}
                  className="text-accent-blue hover:text-accent-gold transition-colors"
                  title="Download Invoice"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage & Billing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* This Month */}
        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">This Month's Usage</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Pro Plan</span>
              <span className="text-white font-medium">$149.00</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Additional Storage</span>
              <span className="text-white font-medium">$0.00</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Premium Support</span>
              <span className="text-white font-medium">$0.00</span>
            </div>
            
            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Total</span>
                <span className="text-accent-gold font-bold text-xl">$149.00</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Next billing: Feb 1, 2024
              </p>
            </div>
          </div>
        </div>

        {/* Payment Alerts */}
        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Alerts</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-green-300 font-medium">Payment Successful</p>
                <p className="text-green-400/70 text-sm">
                  Your January payment was processed successfully
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <CalendarDaysIcon className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-blue-300 font-medium">Upcoming Billing</p>
                <p className="text-blue-400/70 text-sm">
                  Next payment of $149 on February 1st
                </p>
              </div>
            </div>
            
            <div className="text-center pt-4">
              <p className="text-gray-400 text-sm">
                All payments are secure and encrypted
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-white/20 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-6">Add Payment Method</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={newCardData.name}
                  onChange={(e) => setNewCardData({...newCardData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={newCardData.number}
                  onChange={(e) => setNewCardData({...newCardData, number: e.target.value})}
                  className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  placeholder="1234 5678 9012 3456"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={newCardData.expiry}
                    onChange={(e) => setNewCardData({...newCardData, expiry: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                    placeholder="MM/YY"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={newCardData.cvv}
                    onChange={(e) => setNewCardData({...newCardData, cvv: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPaymentMethod}
                disabled={!newCardData.name || !newCardData.number || !newCardData.expiry || !newCardData.cvv}
                className="flex-1 bg-gradient-to-r from-accent-blue to-accent-gold hover:from-accent-gold hover:to-accent-blue text-white font-medium py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingPanel