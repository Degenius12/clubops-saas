import React, { useState, useEffect } from 'react'
import { CreditCard, DollarSign, Receipt, User, Clock, Check, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface POSTransaction {
  id: string
  type: 'entrance' | 'bar' | 'vip'
  amount: number
  paymentMethod: 'cash' | 'card' | 'digital'
  customerName?: string
  dancerName?: string
  boothNumber?: string
  timestamp: string
  status: 'pending' | 'completed' | 'failed'
}

interface BoothConfig {
  id: string
  name: string
  rate: number
  isActive: boolean
  currentCustomer?: string
}

const POSSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'entrance' | 'bar' | 'vip'>('entrance')
  const [transactions, setTransactions] = useState<POSTransaction[]>([])
  const [booths, setBooths] = useState<BoothConfig[]>([
    { id: '1', name: 'VIP Room 1', rate: 100, isActive: false },
    { id: '2', name: 'VIP Room 2', rate: 100, isActive: false },
    { id: '3', name: 'Champagne Room', rate: 200, isActive: false },
    { id: '4', name: 'Private Suite A', rate: 300, isActive: false },
    { id: '5', name: 'Private Suite B', rate: 300, isActive: false },
  ])
  
  const [currentTransaction, setCurrentTransaction] = useState<Partial<POSTransaction>>({
    type: 'entrance',
    amount: 0,
    paymentMethod: 'cash'
  })
  
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<POSTransaction | null>(null)

  // Fee configurations
  const feeConfig = {
    entrance: 25.00,
    barFee: 50.00,
    vipHourly: 100.00,
    vipPrivate: 200.00,
    champagne: 300.00
  }

  useEffect(() => {
    // Load saved transactions from localStorage
    const savedTransactions = localStorage.getItem('clubops-transactions')
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions))
    }
  }, [])

  const saveTransactions = (newTransactions: POSTransaction[]) => {
    setTransactions(newTransactions)
    localStorage.setItem('clubops-transactions', JSON.stringify(newTransactions))
  }

  const processPayment = async (transactionData: Partial<POSTransaction>) => {
    toast.loading('Processing payment...', { id: 'payment' })
    
    const transaction: POSTransaction = {
      id: `txn-${Date.now()}`,
      type: transactionData.type || 'entrance',
      amount: transactionData.amount || 0,
      paymentMethod: transactionData.paymentMethod || 'cash',
      customerName: transactionData.customerName,
      dancerName: transactionData.dancerName,
      boothNumber: transactionData.boothNumber,
      timestamp: new Date().toISOString(),
      status: 'pending'
    }

    // Simulate payment processing
    setTimeout(() => {
      const success = Math.random() > 0.05 // 95% success rate
      
      if (success) {
        transaction.status = 'completed'
        const updatedTransactions = [transaction, ...transactions]
        saveTransactions(updatedTransactions)
        setLastTransaction(transaction)
        setShowReceipt(true)
        toast.success(`Payment of $${transaction.amount} processed successfully!`, { id: 'payment' })
      } else {
        transaction.status = 'failed'
        toast.error('Payment failed. Please try again.', { id: 'payment' })
      }
    }, 2000)

    return transaction
  }

  const EntranceFeePOS = () => (
    <div className="space-y-6">
      <div className="bg-dark-card rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Entrance Fee Collection</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Standard Entry</span>
            <span className="text-2xl font-bold text-gold">${feeConfig.entrance}</span>
          </div>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Customer Name (Optional)"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2"
              onChange={(e) => setCurrentTransaction({
                ...currentTransaction,
                customerName: e.target.value
              })}
            />
            
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setCurrentTransaction({
                  ...currentTransaction,
                  paymentMethod: 'cash'
                })}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  currentTransaction.paymentMethod === 'cash'
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-gray-600 hover:border-green-500'
                }`}
              >
                Cash
              </button>
              <button
                onClick={() => setCurrentTransaction({
                  ...currentTransaction,
                  paymentMethod: 'card'
                })}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  currentTransaction.paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 hover:border-blue-500'
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setCurrentTransaction({
                  ...currentTransaction,
                  paymentMethod: 'digital'
                })}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  currentTransaction.paymentMethod === 'digital'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-600 hover:border-purple-500'
                }`}
              >
                Digital
              </button>
            </div>
            
            <button
              onClick={() => processPayment({
                ...currentTransaction,
                type: 'entrance',
                amount: feeConfig.entrance
              })}
              className="w-full bg-gold text-dark-bg py-3 px-4 rounded-lg font-semibold hover:bg-gold/90 transition-colors"
            >
              Process Entrance Fee - ${feeConfig.entrance}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const BarFeePOS = () => (
    <div className="space-y-6">
      <div className="bg-dark-card rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Bar Fee Collection</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Standard Bar Fee</span>
            <span className="text-2xl font-bold text-gold">${feeConfig.barFee}</span>
          </div>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Dancer Name"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2"
              onChange={(e) => setCurrentTransaction({
                ...currentTransaction,
                dancerName: e.target.value
              })}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Payment Method</label>
                <select
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2"
                  onChange={(e) => setCurrentTransaction({
                    ...currentTransaction,
                    paymentMethod: e.target.value as 'cash' | 'card' | 'digital'
                  })}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="digital">Digital Wallet</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Custom Amount</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  placeholder={feeConfig.barFee.toString()}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2"
                  onChange={(e) => setCurrentTransaction({
                    ...currentTransaction,
                    amount: parseFloat(e.target.value) || feeConfig.barFee
                  })}
                />
              </div>
            </div>
            
            <button
              onClick={() => processPayment({
                ...currentTransaction,
                type: 'bar',
                amount: currentTransaction.amount || feeConfig.barFee
              })}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Process Bar Fee - ${currentTransaction.amount || feeConfig.barFee}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const VIPRoomPOS = () => (
    <div className="space-y-6">
      <div className="bg-dark-card rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">VIP Room Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {booths.map((booth) => (
            <div
              key={booth.id}
              className={`p-4 rounded-lg border-2 transition-colors ${
                booth.isActive
                  ? 'border-red-500 bg-red-500/20'
                  : 'border-gray-600 hover:border-gold'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{booth.name}</h4>
                <div className={`w-3 h-3 rounded-full ${
                  booth.isActive ? 'bg-red-500' : 'bg-green-500'
                }`} />
              </div>
              
              <p className="text-sm text-gray-400 mb-3">
                Rate: ${booth.rate}/hour
              </p>
              
              {booth.currentCustomer && (
                <p className="text-sm text-blue-400 mb-3">
                  Customer: {booth.currentCustomer}
                </p>
              )}
              
              <button
                onClick={() => {
                  const updatedBooths = booths.map(b => 
                    b.id === booth.id 
                      ? { ...b, isActive: !b.isActive, currentCustomer: b.isActive ? undefined : 'Customer' }
                      : b
                  )
                  setBooths(updatedBooths)
                  
                  if (!booth.isActive) {
                    // Start session - process payment
                    processPayment({
                      type: 'vip',
                      amount: booth.rate,
                      boothNumber: booth.name,
                      paymentMethod: 'card'
                    })
                  }
                }}
                className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                  booth.isActive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gold text-dark-bg hover:bg-gold/90'
                }`}
              >
                {booth.isActive ? 'End Session' : `Start - $${booth.rate}`}
              </button>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Manual VIP Transaction</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Customer Name"
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
              onChange={(e) => setCurrentTransaction({
                ...currentTransaction,
                customerName: e.target.value
              })}
            />
            <input
              type="text"
              placeholder="Dancer Name"
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
              onChange={(e) => setCurrentTransaction({
                ...currentTransaction,
                dancerName: e.target.value
              })}
            />
            <input
              type="number"
              min="0"
              step="10"
              placeholder="Amount"
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
              onChange={(e) => setCurrentTransaction({
                ...currentTransaction,
                amount: parseFloat(e.target.value)
              })}
            />
          </div>
          <button
            onClick={() => processPayment({
              ...currentTransaction,
              type: 'vip'
            })}
            className="w-full mt-3 bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Process VIP Transaction
          </button>
        </div>
      </div>
    </div>
  )

  const RecentTransactions = () => (
    <div className="bg-dark-card rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {transactions.slice(0, 10).map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                transaction.status === 'completed' ? 'bg-green-500' :
                transaction.status === 'failed' ? 'bg-red-500' :
                'bg-yellow-500'
              }`} />
              <div>
                <p className="font-medium">
                  {transaction.type.toUpperCase()} - ${transaction.amount}
                </p>
                <p className="text-sm text-gray-400">
                  {transaction.customerName || transaction.dancerName || 'Anonymous'} • 
                  {transaction.paymentMethod.toUpperCase()} •
                  {new Date(transaction.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              transaction.status === 'completed' ? 'bg-green-600 text-white' :
              transaction.status === 'failed' ? 'bg-red-600 text-white' :
              'bg-yellow-600 text-black'
            }`}>
              {transaction.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gradient-premium">POS System</h1>
            <p className="text-gray-400 mt-2">Payment Processing & Transaction Management</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-dark-card p-3 rounded-lg">
              <p className="text-sm text-gray-400">Today's Revenue</p>
              <p className="text-2xl font-bold text-gold">
                ${transactions
                  .filter(t => t.status === 'completed' && 
                    new Date(t.timestamp).toDateString() === new Date().toDateString())
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('entrance')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'entrance'
                ? 'bg-gold text-dark-bg'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <DollarSign size={20} />
              <span>Entrance Fees</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('bar')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'bar'
                ? 'bg-gold text-dark-bg'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <User size={20} />
              <span>Bar Fees</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('vip')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'vip'
                ? 'bg-gold text-dark-bg'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CreditCard size={20} />
              <span>VIP Rooms</span>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main POS Interface */}
          <div className="lg:col-span-2">
            {activeTab === 'entrance' && <EntranceFeePOS />}
            {activeTab === 'bar' && <BarFeePOS />}
            {activeTab === 'vip' && <VIPRoomPOS />}
          </div>

          {/* Recent Transactions Sidebar */}
          <div className="lg:col-span-1">
            <RecentTransactions />
          </div>
        </div>

        {/* Receipt Modal */}
        {showReceipt && lastTransaction && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
            <div className="bg-white text-black rounded-xl p-8 max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="text-green-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Payment Successful</h3>
                <p className="text-gray-600">Transaction completed successfully</p>
              </div>
              
              <div className="border-t border-b border-gray-200 py-4 space-y-2">
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-sm">{lastTransaction.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-semibold">{lastTransaction.type.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-bold text-lg">${lastTransaction.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="capitalize">{lastTransaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(lastTransaction.timestamp).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Print Receipt
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default POSSystem