import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchAllPendingFees,
  fetchFeeSummary,
  collectPayment,
  clearLastPayment,
} from '../../store/slices/feesSlice';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import CollectPaymentModal from './CollectPaymentModal';
import EntertainerFeeDetail from './EntertainerFeeDetail';

const FeeManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { allPending, summary, loading, error, lastPaymentCollected } = useSelector(
    (state: RootState) => state.fees
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntertainerId, setSelectedEntertainerId] = useState<string | null>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [filterOverdue, setFilterOverdue] = useState(false);

  useEffect(() => {
    // Fetch data on mount
    dispatch(fetchAllPendingFees());
    dispatch(fetchFeeSummary());
  }, [dispatch]);

  useEffect(() => {
    // Show success notification when payment collected
    if (lastPaymentCollected) {
      // Refresh data after successful payment
      dispatch(fetchAllPendingFees());
      dispatch(fetchFeeSummary());

      // Clear the payment after showing notification
      setTimeout(() => {
        dispatch(clearLastPayment());
      }, 5000);
    }
  }, [lastPaymentCollected, dispatch]);

  const handleRefresh = () => {
    dispatch(fetchAllPendingFees());
    dispatch(fetchFeeSummary());
  };

  const handleCollectPayment = (entertainerId: string) => {
    setSelectedEntertainerId(entertainerId);
    setShowCollectModal(true);
  };

  const handleViewDetail = (entertainerId: string) => {
    setSelectedEntertainerId(entertainerId);
  };

  // Filter entertainers based on search and filters
  const filteredEntertainers = allPending?.entertainers.filter((e) => {
    const matchesSearch =
      searchTerm === '' ||
      e.stageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.legalName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOverdue =
      !filterOverdue ||
      e.transactions.some((tx) => tx.isOverdue);

    return matchesSearch && matchesOverdue;
  }) || [];

  // If viewing detail for a specific entertainer
  if (selectedEntertainerId && !showCollectModal) {
    return (
      <EntertainerFeeDetail
        entertainerId={selectedEntertainerId}
        onBack={() => setSelectedEntertainerId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
            Fee Management
          </h1>
          <p className="text-text-secondary mt-1">
            Track and collect entertainer fees and tip-outs
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pending */}
        <div className="card-premium p-6 bg-gradient-to-br from-gold-500/10 to-gold-600/5 border-gold-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Total Pending</p>
              <p className="text-3xl font-bold text-gold-400 font-mono">
                ${allPending?.totalPending.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gold-500/10">
              <CurrencyDollarIcon className="w-6 h-6 text-gold-400" />
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">
            {allPending?.transactionCount || 0} transactions
          </p>
        </div>

        {/* Active Entertainers */}
        <div className="card-premium p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Entertainers</p>
              <p className="text-3xl font-bold text-electric-400 font-mono">
                {allPending?.entertainerCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-electric-500/10">
              <UserGroupIcon className="w-6 h-6 text-electric-400" />
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">
            with pending fees
          </p>
        </div>

        {/* Today's Collected */}
        <div className="card-premium p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Today Collected</p>
              <p className="text-3xl font-bold text-success-400 font-mono">
                ${summary?.collected.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-success-500/10">
              <CheckCircleIcon className="w-6 h-6 text-success-400" />
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">
            {summary?.collectedCount || 0} payments
          </p>
        </div>

        {/* Overdue Count */}
        <div className="card-premium p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Overdue</p>
              <p className="text-3xl font-bold text-error-400 font-mono">
                {allPending?.entertainers.filter(e =>
                  e.transactions.some(tx => tx.isOverdue)
                ).length || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-error-500/10">
              <ClockIcon className="w-6 h-6 text-error-400" />
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3">
            need attention
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {lastPaymentCollected && (
        <div className="card-premium p-4 bg-success-500/10 border-success-500/20">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 text-success-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-success-400">
                Payment Collected Successfully
              </p>
              <p className="text-xs text-text-muted mt-1">
                ${lastPaymentCollected.payment.amount.toFixed(2)} from{' '}
                {lastPaymentCollected.payment.stageName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="card-premium p-4 bg-error-500/10 border-error-500/20">
          <div className="flex items-center gap-3">
            <XCircleIcon className="w-6 h-6 text-error-400 flex-shrink-0" />
            <p className="text-sm text-error-400">{error}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card-premium p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search entertainers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          <button
            onClick={() => setFilterOverdue(!filterOverdue)}
            className={`btn-secondary flex items-center gap-2 ${
              filterOverdue ? 'bg-error-500/20 border-error-500/30' : ''
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            {filterOverdue ? 'Show All' : 'Overdue Only'}
          </button>
        </div>
      </div>

      {/* Entertainers List */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-midnight-700">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-text-secondary">
                  Entertainer
                </th>
                <th className="text-left p-4 text-sm font-medium text-text-secondary">
                  Contact
                </th>
                <th className="text-right p-4 text-sm font-medium text-text-secondary">
                  Transactions
                </th>
                <th className="text-right p-4 text-sm font-medium text-text-secondary">
                  Total Owed
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
              {loading && !allPending ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <ArrowPathIcon className="w-5 h-5 animate-spin text-electric-400" />
                      <span className="text-text-secondary">Loading fees...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEntertainers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <p className="text-text-secondary">
                      {searchTerm || filterOverdue
                        ? 'No entertainers match your filters'
                        : 'No pending fees'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntertainers.map((entertainer) => {
                  const hasOverdue = entertainer.transactions.some(tx => tx.isOverdue);

                  return (
                    <tr
                      key={entertainer.entertainerId}
                      className="hover:bg-midnight-800/50 transition-colors cursor-pointer"
                      onClick={() => handleViewDetail(entertainer.entertainerId)}
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-text-primary">
                            {entertainer.stageName}
                          </p>
                          {entertainer.legalName && (
                            <p className="text-sm text-text-muted">
                              {entertainer.legalName}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-text-secondary">
                          {entertainer.phone || '—'}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-sm text-text-secondary">
                          {entertainer.transactions.length}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-lg font-bold text-gold-400 font-mono">
                          ${entertainer.totalOwed.toFixed(2)}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        {hasOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-error-500/10 text-error-400 border border-error-500/20">
                            <ClockIcon className="w-3 h-3" />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-electric-500/10 text-electric-400 border border-electric-500/20">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCollectPayment(entertainer.entertainerId);
                          }}
                          className="btn-primary-sm"
                        >
                          Collect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {showCollectModal && selectedEntertainerId && (
        <CollectPaymentModal
          entertainerId={selectedEntertainerId}
          onClose={() => {
            setShowCollectModal(false);
            setSelectedEntertainerId(null);
          }}
        />
      )}
    </div>
  );
};

export default FeeManagement;
