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
  BanknotesIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  ReceiptPercentIcon,
  BuildingLibraryIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface Invoice {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'overdue'
  plan: string
  period: string
}

interface PaymentMethod {
  id: string
  type: 'visa' | 'mastercard' | 'amex'
  last4: string
  expiry: string
  isDefault: boolean
}

const BillingPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { billing, currentPlan, loading } = useSelector((state: RootState) => state.subscription)
  
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

  // Mock data
  const mockInvoices: Invoice[] = [
    { id: 'inv-001', date: '2025-12-01', amount: 149, status: 'paid', plan: 'Business Plan', period: 'Dec 2025' },
    { id: 'inv-002', date: '2025-11-01', amount: 149, status: 'paid', plan: 'Business Plan', period: 'Nov 2025' },
    { id: 'inv-003', date: '2025-10-01', amount: 149, status: 'paid', plan: 'Business Plan', period: 'Oct 2025' },
    { id: 'inv-004', date: '2025-09-01', amount: 49, status: 'paid', plan: 'Professional Plan', period: 'Sep 2025' },
    { id: 'inv-005', date: '2025-08-01', amount: 49, status: 'paid', plan: 'Professional Plan', period: 'Aug 2025' },
  ]

  const mockPaymentMethods: PaymentMethod[] = [
    { id: '1', type: 'visa', last4: '4242', expiry: '12/27', isDefault: true },
    { id: '2', type: 'mastercard', last4: '8888', expiry: '06/26', isDefault: false },
  ]

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'paid': return { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30' }
      case 'pending': return { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30' }
      case 'failed': case 'overdue': return { bg: 'bg-status-danger/10', text: 'text-status-danger', border: 'border-status-danger/30' }
      default: return { bg: 'bg-midnight-700', text: 'text-text-tertiary', border: 'border-white/10' }
    }
  }

  const getCardIcon = (type: string) => {
    // In real app, use actual card brand icons
    return CreditCardIcon
  }

  const handleAddPaymentMethod = () => {
    dispatch(updatePaymentMethod(newCardData))
    setShowAddPaymentModal(false)
    setNewCardData({ number: '', expiry: '', cvv: '', name: '' })
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Billing & Payments</h1>
          <p className="text-text-tertiary mt-1">Manage payment methods and view invoices</p>
        </div>
        
        <button
          onClick={() => setShowAddPaymentModal(true)}
          className="btn-primary px-5 py-2.5 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Payment Method
        </button>
      </div>

      {/* Billing Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Plan */}
        <div className="card-premium p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gold-500/10">
              <SparklesIcon className="h-5 w-5 text-gold-500" />
            </div>
            <span className="text-text-tertiary text-sm">Current Plan</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">Business</p>
          <p className="text-gold-500 font-medium">$149/month</p>
        </div>

        {/* Next Billing */}
        <div className="card-premium p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-electric-500/10">
              <CalendarDaysIcon className="h-5 w-5 text-electric-400" />
            </div>
            <span className="text-text-tertiary text-sm">Next Billing Date</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">Jan 1, 2026</p>
          <p className="text-text-tertiary text-sm flex items-center gap-1">
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Auto-renewal enabled
          </p>
        </div>

        {/* Payment Status */}
        <div className="card-premium p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-status-success/10">
              <CheckCircleIcon className="h-5 w-5 text-status-success" />
            </div>
            <span className="text-text-tertiary text-sm">Payment Status</span>
          </div>
          <p className="text-2xl font-bold text-status-success">Current</p>
          <p className="text-text-tertiary text-sm">All payments up to date</p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5 text-electric-400" />
            Payment Methods
          </h2>
          <button 
            onClick={() => setShowAddPaymentModal(true)}
            className="text-sm text-electric-400 hover:text-electric-300 transition-colors"
          >
            + Add New
          </button>
        </div>
        
        <div className="space-y-3">
          {mockPaymentMethods.map((method) => {
            const CardIcon = getCardIcon(method.type)
            return (
              <div 
                key={method.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all
                  ${method.isDefault 
                    ? 'bg-electric-500/5 border-electric-500/30' 
                    : 'bg-midnight-800/50 border-white/10 hover:border-white/20'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-10 rounded-lg flex items-center justify-center ${
                    method.type === 'visa' ? 'bg-blue-600' : 
                    method.type === 'mastercard' ? 'bg-orange-600' : 'bg-slate-600'
                  }`}>
                    <CardIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary">
                        {method.type.charAt(0).toUpperCase() + method.type.slice(1)} •••• {method.last4}
                      </p>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-electric-500/10 text-electric-400 border border-electric-500/30">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-tertiary">Expires {method.expiry}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-text-tertiary hover:text-text-secondary">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  {!method.isDefault && (
                    <button className="p-2 rounded-lg hover:bg-status-danger/10 transition-colors text-text-tertiary hover:text-status-danger">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <ReceiptPercentIcon className="h-5 w-5 text-gold-500" />
            Billing History
          </h2>
          <button className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
            <DocumentArrowDownIcon className="h-4 w-4" />
            Download All
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-text-tertiary border-b border-white/10">
                <th className="pb-3 font-medium">Invoice</th>
                <th className="pb-3 font-medium">Plan</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-right">Amount</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map((invoice) => {
                const statusStyles = getStatusStyles(invoice.status)
                return (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-midnight-700">
                          <DocumentArrowDownIcon className="h-4 w-4 text-text-tertiary" />
                        </div>
                        <span className="font-medium text-text-primary">{invoice.id.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="py-4 text-text-secondary">{invoice.plan}</td>
                    <td className="py-4 text-text-tertiary">
                      {new Date(invoice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 text-right font-mono font-medium text-text-primary tabular-nums">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyles.bg} ${statusStyles.text} border ${statusStyles.border}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => dispatch(downloadInvoice(invoice.id))}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-electric-400 hover:text-electric-300"
                        title="Download Invoice"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Layout - Summary & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Month Summary */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BanknotesIcon className="h-5 w-5 text-gold-500" />
            Current Billing Period
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-text-tertiary">Business Plan</span>
              <span className="text-text-primary font-medium">$149.00</span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-text-tertiary">Additional Storage</span>
              <span className="text-text-primary font-medium">$0.00</span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-text-tertiary">Premium Support Add-on</span>
              <span className="text-text-primary font-medium">$0.00</span>
            </div>
            
            <div className="border-t border-white/10 pt-4 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-text-primary font-semibold">Total Due</span>
                <span className="text-2xl font-bold text-gold-500">$149.00</span>
              </div>
              <p className="text-sm text-text-tertiary mt-2 flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                Due on January 1, 2026
              </p>
            </div>
          </div>
        </div>

        {/* Payment Alerts */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-status-success" />
            Payment Status
          </h3>
          
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-status-success/5 border border-status-success/20">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-5 w-5 text-status-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-status-success">Payment Successful</p>
                  <p className="text-sm text-text-tertiary mt-1">
                    December payment of $149 processed on Dec 1, 2025
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-electric-500/5 border border-electric-500/20">
              <div className="flex items-start gap-3">
                <CalendarDaysIcon className="h-5 w-5 text-electric-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-electric-400">Upcoming Payment</p>
                  <p className="text-sm text-text-tertiary mt-1">
                    Next charge of $149 on January 1, 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <ShieldCheckIcon className="h-4 w-4" />
              <span>All transactions are secure and encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAddPaymentModal(false)}
          />
          
          <div className="relative w-full max-w-md card-premium p-6 animate-scale-in">
            <button
              onClick={() => setShowAddPaymentModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-text-tertiary" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-electric-500/10">
                <CreditCardIcon className="h-6 w-6 text-electric-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">Add Payment Method</h3>
                <p className="text-sm text-text-tertiary">Enter your card details</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={newCardData.name}
                  onChange={(e) => setNewCardData({...newCardData, name: e.target.value})}
                  className="input-premium w-full"
                  placeholder="John Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={newCardData.number}
                  onChange={(e) => setNewCardData({...newCardData, number: formatCardNumber(e.target.value)})}
                  className="input-premium w-full font-mono"
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={newCardData.expiry}
                    onChange={(e) => setNewCardData({...newCardData, expiry: e.target.value})}
                    className="input-premium w-full"
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={newCardData.cvv}
                    onChange={(e) => setNewCardData({...newCardData, cvv: e.target.value})}
                    className="input-premium w-full font-mono"
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="flex-1 btn-secondary py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPaymentMethod}
                disabled={!newCardData.name || !newCardData.number || !newCardData.expiry || !newCardData.cvv}
                className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Card
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-text-tertiary">
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Secured with 256-bit encryption</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingPanel
