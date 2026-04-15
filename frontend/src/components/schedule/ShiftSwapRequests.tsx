import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import {
  RefreshCw,
  Check,
  X,
  Clock,
  User,
  Calendar,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface Entertainer {
  id: string;
  stageName: string;
  legalName?: string;
}

interface ScheduledShift {
  id: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  position?: string;
  entertainer: Entertainer;
}

interface ShiftSwap {
  id: string;
  scheduledShift: ScheduledShift;
  requester: Entertainer;
  swapWithEntertainerId?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED';
  requestedDate: string;
  reviewer?: {
    firstName: string;
    lastName: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
}

export function ShiftSwapRequests() {
  const [swapRequests, setSwapRequests] = useState<ShiftSwap[]>([]);
  const [entertainers, setEntertainers] = useState<Entertainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [selectedSwap, setSelectedSwap] = useState<ShiftSwap | null>(null);
  const [approvalForm, setApprovalForm] = useState({
    newEntertainerId: '',
    notes: ''
  });
  const [denialReason, setDenialReason] = useState('');

  useEffect(() => {
    fetchSwapRequests();
    fetchEntertainers();
  }, [filter]);

  const fetchSwapRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = filter === 'PENDING' 
        ? '/api/scheduled-shifts/swaps?status=PENDING'
        : '/api/scheduled-shifts/swaps';
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch swap requests');
      
      const data = await response.json();
      setSwapRequests(data);
    } catch (error) {
      console.error('Error fetching swap requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntertainers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dancers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch entertainers');
      
      const data = await response.json();
      setEntertainers(data);
    } catch (error) {
      console.error('Error fetching entertainers:', error);
    }
  };

  const handleApprove = async (swapId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/scheduled-shifts/swaps/${swapId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newEntertainerId: approvalForm.newEntertainerId,
          notes: approvalForm.notes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve swap request');
      }

      await fetchSwapRequests();
      setSelectedSwap(null);
      setApprovalForm({ newEntertainerId: '', notes: '' });
      alert('Swap request approved successfully');
    } catch (error) {
      console.error('Error approving swap:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve swap request');
    }
  };

  const handleDeny = async (swapId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/scheduled-shifts/swaps/${swapId}/deny`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: denialReason
        })
      });

      if (!response.ok) throw new Error('Failed to deny swap request');

      await fetchSwapRequests();
      setSelectedSwap(null);
      setDenialReason('');
      alert('Swap request denied');
    } catch (error) {
      console.error('Error denying swap:', error);
      alert('Failed to deny swap request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'DENIED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Check className="w-4 h-4" />;
      case 'DENIED': return <X className="w-4 h-4" />;
      case 'CANCELLED': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <RefreshCw className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shift Swap Requests</h1>
            <p className="text-sm text-gray-500">Review and manage shift swap requests</p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filter === 'PENDING' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Only
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-md transition-colors ${
              filter === 'ALL' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Requests
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {swapRequests.filter(s => s.status === 'PENDING').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-200" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {swapRequests.filter(s => s.status === 'APPROVED').length}
              </p>
            </div>
            <Check className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Denied</p>
              <p className="text-2xl font-bold text-red-600">
                {swapRequests.filter(s => s.status === 'DENIED').length}
              </p>
            </div>
            <X className="w-8 h-8 text-red-200" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {swapRequests.length}
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-gray-200" />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
        ) : swapRequests.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No swap requests to display</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shift Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {swapRequests.map((swap) => (
                  <tr key={swap.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(swap.status)}`}>
                        {getStatusIcon(swap.status)}
                        {swap.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">
                          {format(parseISO(swap.scheduledShift.shiftDate), 'MMM d, yyyy')}
                        </div>
                        <div className="text-gray-500">
                          {swap.scheduledShift.startTime} - {swap.scheduledShift.endTime}
                          {swap.scheduledShift.position && ` • ${swap.scheduledShift.position}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {swap.requester.stageName}
                        </div>
                        {swap.requester.legalName && (
                          <div className="text-gray-500">
                            {swap.requester.legalName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {swap.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {format(parseISO(swap.requestedDate), 'MMM d, h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {swap.status === 'PENDING' ? (
                        <button
                          onClick={() => setSelectedSwap(swap)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Review
                        </button>
                      ) : swap.reviewer ? (
                        <div className="text-gray-500">
                          <div>{swap.reviewer.firstName} {swap.reviewer.lastName}</div>
                          {swap.reviewedAt && (
                            <div className="text-xs">
                              {format(parseISO(swap.reviewedAt), 'MMM d, h:mm a')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedSwap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Review Swap Request</h3>

            {/* Request Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Original Shift</label>
                  <p className="mt-1">
                    <span className="font-medium">{selectedSwap.scheduledShift.entertainer.stageName}</span>
                    <br />
                    {format(parseISO(selectedSwap.scheduledShift.shiftDate), 'EEEE, MMMM d, yyyy')}
                    <br />
                    {selectedSwap.scheduledShift.startTime} - {selectedSwap.scheduledShift.endTime}
                    {selectedSwap.scheduledShift.position && (
                      <span className="text-indigo-600"> • {selectedSwap.scheduledShift.position}</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Requested By</label>
                  <p className="mt-1">
                    <span className="font-medium">{selectedSwap.requester.stageName}</span>
                    {selectedSwap.requester.legalName && (
                      <>
                        <br />
                        {selectedSwap.requester.legalName}
                      </>
                    )}
                    <br />
                    <span className="text-sm text-gray-500">
                      {format(parseISO(selectedSwap.requestedDate), 'MMM d, h:mm a')}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Reason</label>
                <p className="mt-1 text-gray-900">{selectedSwap.reason}</p>
              </div>
            </div>

            {/* Approval Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Different Entertainer (Optional)
                </label>
                <select
                  value={approvalForm.newEntertainerId}
                  onChange={(e) => setApprovalForm(prev => ({ ...prev, newEntertainerId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Keep original assignment or select replacement</option>
                  {entertainers
                    .filter(e => e.id !== selectedSwap.scheduledShift.entertainer.id)
                    .map(entertainer => (
                      <option key={entertainer.id} value={entertainer.id}>
                        {entertainer.stageName}{entertainer.legalName ? ` (${entertainer.legalName})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={approvalForm.notes}
                  onChange={(e) => setApprovalForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Add any notes about this decision..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Review Options:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Approve the swap and remove the shift from the requester</li>
                      <li>Approve and assign to a replacement entertainer</li>
                      <li>Deny the request with a reason</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(selectedSwap.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve Swap
                </button>
                
                <button
                  onClick={() => {
                    const reason = prompt('Reason for denial:');
                    if (reason) {
                      setDenialReason(reason);
                      handleDeny(selectedSwap.id);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Deny Request
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedSwap(null);
                  setApprovalForm({ newEntertainerId: '', notes: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}