import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchEntertainerFees,
  collectPayment,
  CollectPaymentRequest,
} from '../../store/slices/feesSlice';
import {
  XMarkIcon,
  CurrencyDollarIcon,
  CheckIcon,
  BanknotesIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

interface CollectPaymentModalProps {
  entertainerId: string;
  onClose: () => void;
}

const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  entertainerId,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentEntertainerFees, loading } = useSelector(
    (state: RootState) => state.fees
  );

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [notes, setNotes] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [collectAll, setCollectAll] = useState(true);

  useEffect(() => {
    // Fetch fees for this entertainer if not already loaded
    if (!currentEntertainerFees || currentEntertainerFees.entertainerId !== entertainerId) {
      dispatch(fetchEntertainerFees(entertainerId));
    }
  }, [dispatch, entertainerId, currentEntertainerFees]);

  useEffect(() => {
    // Auto-fill amount when collectAll is true
    if (collectAll && currentEntertainerFees) {
      setAmount(currentEntertainerFees.pending.total.toFixed(2));
    }
  }, [collectAll, currentEntertainerFees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentEntertainerFees) return;

    const request: CollectPaymentRequest = {
      entertainerId,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    if (collectAll) {
      request.collectAll = true;
    } else if (selectedTransactions.size > 0) {
      request.transactionIds = Array.from(selectedTransactions);
    } else {
      request.amount = parseFloat(amount);
    }

    try {
      await dispatch(collectPayment(request)).unwrap();
      onClose();
    } catch (error) {
      // Error will be displayed in parent component
      console.error('Payment collection failed:', error);
    }
  };

  const toggleTransaction = (txId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(txId)) {
      newSelected.delete(txId);
    } else {
      newSelected.add(txId);
    }
    setSelectedTransactions(newSelected);

    // Calculate total of selected transactions
    if (currentEntertainerFees) {
      const total = currentEntertainerFees.pending.transactions
        .filter(tx => newSelected.has(tx.id))
        .reduce((sum, tx) => sum + tx.amount, 0);
      setAmount(total.toFixed(2));
    }
  };

  const selectAllTransactions = () => {
    if (currentEntertainerFees) {
      const allIds = new Set(currentEntertainerFees.pending.transactions.map(tx => tx.id));
      setSelectedTransactions(allIds);
      setAmount(currentEntertainerFees.pending.total.toFixed(2));
    }
  };

  const clearSelection = () => {
    setSelectedTransactions(new Set());
    setAmount('');
  };

  if (!currentEntertainerFees) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="card-premium p-8 max-w-lg w-full">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary">Loading fees...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPending = currentEntertainerFees.pending.total;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card-premium p-6 max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              <CurrencyDollarIcon className="w-7 h-7 text-gold-400" />
              Collect Payment
            </h2>
            <p className="text-text-secondary mt-1">
              From {currentEntertainerFees.stageName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-midnight-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Collection Mode */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-secondary">
              Collection Mode
            </label>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCollectAll(true);
                  clearSelection();
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  collectAll
                    ? 'border-electric-500 bg-electric-500/10'
                    : 'border-midnight-700 hover:border-midnight-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">
                      Collect All Pending Fees
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      Total: ${totalPending.toFixed(2)}
                    </p>
                  </div>
                  {collectAll && (
                    <CheckIcon className="w-5 h-5 text-electric-400" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCollectAll(false);
                  setAmount('');
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  !collectAll
                    ? 'border-electric-500 bg-electric-500/10'
                    : 'border-midnight-700 hover:border-midnight-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">
                      Select Specific Fees
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      Choose individual transactions
                    </p>
                  </div>
                  {!collectAll && (
                    <CheckIcon className="w-5 h-5 text-electric-400" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Transaction Selection (when not collecting all) */}
          {!collectAll && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-secondary">
                  Select Transactions
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllTransactions}
                    className="text-sm text-electric-400 hover:text-electric-300"
                  >
                    Select All
                  </button>
                  <span className="text-text-muted">|</span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-sm text-text-muted hover:text-text-secondary"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 border border-midnight-700 rounded-lg p-3">
                {currentEntertainerFees.pending.transactions.map((tx) => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => toggleTransaction(tx.id)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      selectedTransactions.has(tx.id)
                        ? 'border-electric-500 bg-electric-500/10'
                        : 'border-midnight-700 hover:border-midnight-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">
                          {tx.description}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {new Date(tx.createdAt).toLocaleDateString()}
                          {tx.isOverdue && (
                            <span className="ml-2 text-error-400">OVERDUE</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-gold-400 font-mono">
                          ${tx.amount.toFixed(2)}
                        </p>
                        {selectedTransactions.has(tx.id) && (
                          <CheckIcon className="w-5 h-5 text-electric-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">
              Amount to Collect
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={collectAll}
                required
                className="input-field pl-8 text-lg font-mono disabled:opacity-50"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-electric-500 bg-electric-500/10'
                    : 'border-midnight-700 hover:border-midnight-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BanknotesIcon className="w-6 h-6 text-success-400" />
                  <span className="font-medium text-text-primary">Cash</span>
                  {paymentMethod === 'cash' && (
                    <CheckIcon className="w-5 h-5 text-electric-400 ml-auto" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-electric-500 bg-electric-500/10'
                    : 'border-midnight-700 hover:border-midnight-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCardIcon className="w-6 h-6 text-royal-400" />
                  <span className="font-medium text-text-primary">Card</span>
                  {paymentMethod === 'card' && (
                    <CheckIcon className="w-5 h-5 text-electric-400 ml-auto" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[80px]"
              placeholder="Add any notes about this payment..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-midnight-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading || !amount || parseFloat(amount) <= 0}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                `Collect $${amount || '0.00'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectPaymentModal;
