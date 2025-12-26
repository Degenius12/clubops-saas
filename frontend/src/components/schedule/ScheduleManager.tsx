// Schedule Manager Component (Features #21-23)
// Allows managers to create schedules, view notifications, and manage shift swaps

import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, parse } from 'date-fns';
import scheduleService from '../../services/scheduleService';
import type { ScheduledShift, ShiftSwap } from '../../types/schedule';

interface Entertainer {
  id: string;
  stageName: string;
  photoUrl?: string;
}

const ScheduleManager: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [shifts, setShifts] = useState<ScheduledShift[]>([]);
  const [entertainers, setEntertainers] = useState<Entertainer[]>([]);
  const [swaps, setSwaps] = useState<ShiftSwap[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'swaps'>('schedule');

  // Form state for creating new shift
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    entertainerId: '',
    shiftDate: '',
    startTime: '14:00',
    endTime: '22:00',
    position: '',
    notes: ''
  });

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 0 })
  });

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

      // Fetch shifts for the week
      const shiftsData = await scheduleService.getScheduledShifts({
        startDate: currentWeekStart.toISOString(),
        endDate: weekEnd.toISOString()
      });
      setShifts(shiftsData.scheduledShifts);

      // Fetch pending swap requests
      const swapsData = await scheduleService.getShiftSwaps({ status: 'PENDING' });
      setSwaps(swapsData.swaps);

      // Fetch entertainers (would be from entertainer service in real implementation)
      // For now, extract unique entertainers from shifts
      const uniqueEntertainers = shiftsData.scheduledShifts.reduce((acc, shift) => {
        if (shift.entertainer && !acc.find(e => e.id === shift.entertainer!.id)) {
          acc.push(shift.entertainer);
        }
        return acc;
      }, [] as Entertainer[]);
      setEntertainers(uniqueEntertainers);
    } catch (error) {
      console.error('Failed to fetch schedule data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleService.createScheduledShift(formData);
      setShowCreateForm(false);
      setFormData({
        entertainerId: '',
        shiftDate: '',
        startTime: '14:00',
        endTime: '22:00',
        position: '',
        notes: ''
      });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create shift');
    }
  };

  const handleReviewSwap = async (swapId: string, action: 'approve' | 'decline') => {
    try {
      await scheduleService.reviewShiftSwap(swapId, { action });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to review swap request');
    }
  };

  const handleCancelShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to cancel this shift?')) return;
    try {
      await scheduleService.updateScheduledShift(shiftId, { status: 'CANCELLED' });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel shift');
    }
  };

  const getShiftsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(shift => shift.shiftDate.startsWith(dateStr));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-gray-100 text-gray-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'DECLINED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Schedule Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          + Create Shift
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'schedule'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Schedule (Feature #21)
        </button>
        <button
          onClick={() => setActiveTab('swaps')}
          className={`px-4 py-2 font-medium relative ${
            activeTab === 'swaps'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Swap Requests (Feature #23)
          {swaps.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {swaps.length}
            </span>
          )}
        </button>
      </div>

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Week Navigator */}
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
            <button
              onClick={handlePreviousWeek}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              ← Previous Week
            </button>
            <h2 className="text-xl font-semibold">
              Week of {format(currentWeekStart, 'MMM d, yyyy')}
            </h2>
            <button
              onClick={handleNextWeek}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Next Week →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayShifts = getShiftsForDate(day);
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <div
                  key={day.toISOString()}
                  className={`bg-white rounded-lg shadow p-4 min-h-[200px] ${
                    isToday ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  <div className="font-semibold text-lg mb-2">
                    {format(day, 'EEE')}
                    <div className="text-sm text-gray-600">{format(day, 'MMM d')}</div>
                  </div>

                  <div className="space-y-2">
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className={`p-2 rounded text-xs ${getStatusColor(shift.status)}`}
                      >
                        <div className="font-medium">{shift.entertainer?.stageName}</div>
                        <div>{shift.startTime} - {shift.endTime}</div>
                        {shift.position && <div className="text-xs opacity-75">{shift.position}</div>}
                        <button
                          onClick={() => handleCancelShift(shift.id)}
                          className="mt-1 text-red-600 hover:text-red-800 text-xs underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Swaps Tab */}
      {activeTab === 'swaps' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Pending Swap Requests</h2>

          {swaps.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending swap requests</p>
          ) : (
            <div className="space-y-4">
              {swaps.map((swap) => (
                <div key={swap.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{swap.requester?.stageName}</div>
                      <div className="text-sm text-gray-600">
                        Shift: {swap.scheduledShift && format(new Date(swap.scheduledShift.shiftDate), 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-gray-600">
                        Time: {swap.scheduledShift?.startTime} - {swap.scheduledShift?.endTime}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(swap.requestedDate), 'MMM d, h:mm a')}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700 mb-3">
                    <span className="font-medium">Reason:</span> {swap.reason}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReviewSwap(swap.id, 'approve')}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReviewSwap(swap.id, 'decline')}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Shift Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Create Scheduled Shift</h2>

            <form onSubmit={handleCreateShift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Entertainer</label>
                <select
                  value={formData.entertainerId}
                  onChange={(e) => setFormData({ ...formData, entertainerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select entertainer...</option>
                  {entertainers.map((entertainer) => (
                    <option key={entertainer.id} value={entertainer.id}>
                      {entertainer.stageName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={formData.shiftDate}
                  onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Position (Optional)</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Stage, Floor, VIP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  Create Shift
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;
