import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, parseISO, isSameDay } from 'date-fns';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Clock,
  User,
  AlertCircle,
  Check,
  X,
  RefreshCw
} from 'lucide-react';

interface Entertainer {
  id: string;
  stageName: string;
  legalName?: string;
  photoUrl?: string;
}

interface ScheduledShift {
  id: string;
  entertainer: Entertainer;
  shiftDate: string;
  startTime: string;
  endTime: string;
  position?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';
  confirmedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  notes?: string;
  swaps?: Array<{
    id: string;
    requestedBy: string;
    reason: string;
    requestedDate: string;
  }>;
}

interface ShiftFormData {
  entertainerId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  position?: string;
  notes?: string;
  sendNotification: boolean;
}

export function ShiftScheduling() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [shifts, setShifts] = useState<Record<string, ScheduledShift[]>>({});
  const [entertainers, setEntertainers] = useState<Entertainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddShift, setShowAddShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShift, setSelectedShift] = useState<ScheduledShift | null>(null);
  const [formData, setFormData] = useState<ShiftFormData>({
    entertainerId: '',
    shiftDate: '',
    startTime: '',
    endTime: '',
    position: '',
    notes: '',
    sendNotification: true
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Sunday
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    fetchWeekSchedule();
    fetchEntertainers();
  }, [currentWeek]);

  const fetchWeekSchedule = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/scheduled-shifts/week?weekStart=${weekStart.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch schedule');
      
      const data = await response.json();
      setShifts(data.shifts || {});
    } catch (error) {
      console.error('Error fetching schedule:', error);
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

  const handleAddShift = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/scheduled-shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create shift');
      }

      const data = await response.json();
      
      // Refresh the schedule
      await fetchWeekSchedule();
      
      // Reset form
      setShowAddShift(false);
      setSelectedDate(null);
      setFormData({
        entertainerId: '',
        shiftDate: '',
        startTime: '',
        endTime: '',
        position: '',
        notes: '',
        sendNotification: true
      });

      alert(`Shift created successfully${data.notificationSent ? ' and notification sent' : ''}`);
    } catch (error) {
      console.error('Error creating shift:', error);
      alert(error instanceof Error ? error.message : 'Failed to create shift');
    }
  };

  const handleUpdateShift = async (shiftId: string, updates: Partial<ScheduledShift>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/scheduled-shifts/${shiftId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update shift');
      
      await fetchWeekSchedule();
      setSelectedShift(null);
    } catch (error) {
      console.error('Error updating shift:', error);
      alert('Failed to update shift');
    }
  };

  const handleCancelShift = async (shiftId: string) => {
    if (!window.confirm('Are you sure you want to cancel this shift?')) return;

    try {
      const token = localStorage.getItem('token');
      const reason = prompt('Reason for cancellation (optional):');
      
      const response = await fetch(`/api/scheduled-shifts/${shiftId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) throw new Error('Failed to cancel shift');
      
      await fetchWeekSchedule();
      alert('Shift cancelled successfully');
    } catch (error) {
      console.error('Error cancelling shift:', error);
      alert('Failed to cancel shift');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'DECLINED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <Check className="w-3 h-3" />;
      case 'DECLINED': return <X className="w-3 h-3" />;
      case 'CANCELLED': return <X className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shift Scheduling</h1>
            <p className="text-sm text-gray-500">Manage entertainer schedules and shifts</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            setShowAddShift(true);
            setSelectedDate(new Date());
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Shift
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
        <button
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="text-sm text-indigo-600 hover:text-indigo-700 mt-1"
          >
            Today
          </button>
        </div>

        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 h-[600px]">
            {weekDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayShifts = shifts[dateKey] || [];
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={dateKey}
                  className={`border-r last:border-r-0 ${isToday ? 'bg-indigo-50' : ''}`}
                >
                  {/* Day Header */}
                  <div className="p-3 border-b bg-gray-50">
                    <div className="text-sm font-medium text-gray-900">
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-lg font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </div>
                  </div>

                  {/* Shifts */}
                  <div className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight: '500px' }}>
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        onClick={() => setSelectedShift(shift)}
                        className="p-2 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(shift.status)}
                            <span className={`text-xs px-1 py-0.5 rounded ${getStatusColor(shift.status)}`}>
                              {shift.status}
                            </span>
                          </div>
                          {shift.swaps && shift.swaps.length > 0 && (
                            <span title="Swap requested">
                              <RefreshCw className="w-3 h-3 text-orange-500" />
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {shift.entertainer.stageName}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {shift.startTime} - {shift.endTime}
                        </div>
                        
                        {shift.position && (
                          <div className="text-xs text-indigo-600 mt-1">
                            {shift.position}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add shift button for this day */}
                    <button
                      onClick={() => {
                        setShowAddShift(true);
                        setSelectedDate(day);
                        setFormData(prev => ({
                          ...prev,
                          shiftDate: format(day, 'yyyy-MM-dd')
                        }));
                      }}
                      className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      <Plus className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Shift Modal */}
      {(showAddShift || selectedShift) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {selectedShift ? 'Shift Details' : 'Add New Shift'}
            </h3>

            {selectedShift ? (
              // Shift Details View
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Entertainer</label>
                  <p className="mt-1 text-gray-900">
                    {selectedShift.entertainer.stageName}{selectedShift.entertainer.legalName ? ` (${selectedShift.entertainer.legalName})` : ''}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Date & Time</label>
                  <p className="mt-1 text-gray-900">
                    {format(parseISO(selectedShift.shiftDate), 'EEEE, MMMM d, yyyy')}
                    <br />
                    {selectedShift.startTime} - {selectedShift.endTime}
                  </p>
                </div>

                {selectedShift.position && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Position</label>
                    <p className="mt-1 text-gray-900">{selectedShift.position}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${getStatusColor(selectedShift.status)}`}>
                      {getStatusIcon(selectedShift.status)}
                      {selectedShift.status}
                    </span>
                  </div>
                </div>

                {selectedShift.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-gray-900">{selectedShift.notes}</p>
                  </div>
                )}

                {selectedShift.declineReason && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Decline Reason</label>
                    <p className="mt-1 text-red-600">{selectedShift.declineReason}</p>
                  </div>
                )}

                {selectedShift.swaps && selectedShift.swaps.length > 0 && (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-700 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Swap Request Pending</span>
                    </div>
                    {selectedShift.swaps.map(swap => (
                      <div key={swap.id} className="text-sm text-gray-700">
                        <p>Reason: {swap.reason}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Requested: {format(parseISO(swap.requestedDate), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => handleCancelShift(selectedShift.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Cancel Shift
                  </button>
                  <button
                    onClick={() => setSelectedShift(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              // Add Shift Form
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddShift();
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entertainer
                  </label>
                  <select
                    value={formData.entertainerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, entertainerId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select entertainer</option>
                    {entertainers.map(entertainer => (
                      <option key={entertainer.id} value={entertainer.id}>
                        {entertainer.stageName}{entertainer.legalName ? ` (${entertainer.legalName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.shiftDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, shiftDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="e.g., Stage, Floor, VIP"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendNotification"
                    checked={formData.sendNotification}
                    onChange={(e) => setFormData(prev => ({ ...prev, sendNotification: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendNotification" className="ml-2 text-sm text-gray-700">
                    Send notification to entertainer
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddShift(false);
                      setSelectedDate(null);
                      setFormData({
                        entertainerId: '',
                        shiftDate: '',
                        startTime: '',
                        endTime: '',
                        position: '',
                        notes: '',
                        sendNotification: true
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create Shift
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}