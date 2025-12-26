import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchEntertainerFees,
  waiveFee,
  WaiveFeeRequest,
} from '../../store/slices/feesSlice';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import CollectPaymentModal from './CollectPaymentModal';

interface EntertainerFeeDetailProps {
  entertainerId: string;
  onBack: () => void;
}

const EntertainerFeeDetail: React.FC<EntertainerFeeDetailProps> = ({
  entertainerId,
  onBack,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentEntertainerFees, loading } = useSelector(
    (state: RootState) => state.fees
  );

  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showWaiveModal, setShowWaiveModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [waiveReason, setWaiveReason] = useState('');

  useEffect(() => {
    dispatch(fetchEntertainerFees(entertainerId));
  }, [dispatch, entertainerId]);

  const handleWaiveFee = async () => {
    if (!selectedTransactionId || !waiveReason.trim()) return;

    const request: WaiveFeeRequest = {
      transactionId: selectedTransactionId,
      reason: waiveReason.trim(),
    };

    try {
      await dispatch(waiveFee(request)).unwrap();
      setShowWaiveModal(false);
      setSelectedTransactionId(null);
      setWaiveReason('');
      // Refresh fees
      dispatch(fetchEntertainerFees(entertainerId));
    } catch (error) {
      console.error('Failed to waive fee:', error);
    }
  };

  if (!currentEntertainerFees && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary">Loading fees...</p>
        </div>
      </div>
    );
  }

  if (!currentEntertainerFees) {
    return (
      <div className="card-premium p-8 text-center">
        <p className="text-text-secondary">Entertainer fees not found</p>
        <button onClick={onBack} className="btn-secondary mt-4">
          Go Back
        </button>
      </div>
    );
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return <BanknotesIcon className="w-4 h-4" />;
      case 'card':
        return <CreditCardIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-midnight-700 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">
            {currentEntertainerFees.stageName}
          </h1>
          {currentEntertainerFees.legalName && (
            <p className="text-text-secondary">
              {currentEntertainerFees.legalName}
            </p>
          )}
        </div>
        {currentEntertainerFees.pending.total > 0 && (
          <button
            onClick={() => setShowCollectModal(true)}
            className="btn-primary"
          >
            Collect Payment
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-premium p-5 bg-gradient-to-br from-error-500/10 to-error-600/5 border-error-500/20">
          <p className="text-sm text-text-secondary mb-1">Total Owed</p>
          <p className="text-3xl font-bold text-error-400 font-mono">
            ${currentEntertainerFees.summary.totalOwed.toFixed(2)}
          </p>
          <p className="text-xs text-text-muted mt-2">
            {currentEntertainerFees.pending.transactions.length} pending
          </p>
        </div>

        <div className="card-premium p-5">
          <p className="text-sm text-text-secondary mb-1">Total Paid</p>
          <p className="text-3xl font-bold text-success-400 font-mono">
            ${currentEntertainerFees.summary.totalPaid.toFixed(2)}
          </p>
          <p className="text-xs text-text-muted mt-2">
            {currentEntertainerFees.paid.transactions.length} transactions
          </p>
        </div>

        <div className="card-premium p-5">
          <p className="text-sm text-text-secondary mb-1">Lifetime Total</p>
          <p className="text-3xl font-bold text-electric-400 font-mono">
            ${currentEntertainerFees.summary.lifetimeTotal.toFixed(2)}
          </p>
          <p className="text-xs text-text-muted mt-2">all time</p>
        </div>
      </div>

      {/* Pending Fees */}
      <div className="card-premium">
        <div className="p-5 border-b border-midnight-700">
          <h2 className="text-lg font-semibold text-text-primary">
            Pending Fees
          </h2>
        </div>

        {currentEntertainerFees.pending.transactions.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircleIcon className="w-12 h-12 text-success-400 mx-auto mb-3" />
            <p className="text-text-secondary">No pending fees</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-midnight-700">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">
                    Date
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">
                    Description
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">
                    Type
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-text-secondary">
                    Amount
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-text-secondary">
                    Status
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-midnight-700">
                {currentEntertainerFees.pending.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-midnight-800/50 transition-colors">
                    <td className="p-4">
                      <p className="text-sm text-text-secondary">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-text-primary">{tx.description}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-electric-500/10 text-electric-400 border border-electric-500/20">
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-lg font-bold text-gold-400 font-mono">
                        ${tx.amount.toFixed(2)}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      {tx.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-error-500/10 text-error-400 border border-error-500/20">
                          <ClockIcon className="w-3 h-3" />
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-royal-500/10 text-royal-400 border border-royal-500/20">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTransactionId(tx.id);
                          setShowWaiveModal(true);
                        }}
                        className="text-sm text-text-muted hover:text-error-400 transition-colors"
                      >
                        Waive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="card-premium">
        <div className="p-5 border-b border-midnight-700">
          <h2 className="text-lg font-semibold text-text-primary">
            Payment History
          </h2>
        </div>

        {currentEntertainerFees.paid.transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-text-secondary">No payment history</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-midnight-700">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">
                    Date Paid
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">
                    Description
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">
                    Method
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-text-secondary">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-midnight-700">
                {currentEntertainerFees.paid.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-midnight-800/50 transition-colors">
                    <td className="p-4">
                      <p className="text-sm text-text-secondary">
                        {tx.paidAt ? new Date(tx.paidAt).toLocaleDateString() : '—'}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-text-primary">{tx.description}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-midnight-700 text-text-secondary">
                        {getPaymentMethodIcon(tx.paymentMethod || 'cash')}
                        {tx.paymentMethod?.toUpperCase() || 'CASH'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-sm font-medium text-success-400 font-mono">
                        ${tx.amount.toFixed(2)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      {showCollectModal && (
        <CollectPaymentModal
          entertainerId={entertainerId}
          onClose={() => setShowCollectModal(false)}
        />
      )}

      {/* Waive Fee Modal */}
      {showWaiveModal && selectedTransactionId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-premium p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary">Waive Fee</h3>
              <button
                onClick={() => {
                  setShowWaiveModal(false);
                  setSelectedTransactionId(null);
                  setWaiveReason('');
                }}
                className="p-2 hover:bg-midnight-700 rounded-lg transition-colors"
              >
                <XCircleIcon className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <p className="text-sm text-text-secondary mb-4">
              Waiving a fee will permanently remove it from the entertainer's pending
              fees. This action cannot be undone.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Reason for Waiving Fee *
                </label>
                <textarea
                  value={waiveReason}
                  onChange={(e) => setWaiveReason(e.target.value)}
                  className="input-field min-h-[100px]"
                  placeholder="Enter reason (required for audit trail)..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWaiveModal(false);
                    setSelectedTransactionId(null);
                    setWaiveReason('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWaiveFee}
                  disabled={!waiveReason.trim() || loading}
                  className="btn-primary flex-1 bg-error-500 hover:bg-error-600"
                >
                  {loading ? 'Waiving...' : 'Waive Fee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntertainerFeeDetail;
