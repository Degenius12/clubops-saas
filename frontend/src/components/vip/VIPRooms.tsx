import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import { 
  fetchVIPRooms, 
  updateRoomStatus, 
  startRoomTimer, 
  stopRoomTimer 
} from '../../store/slices/vipSlice'
import {
  BuildingStorefrontIcon,
  ClockIcon,
  UserIcon,
  PlayIcon,
  StopIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const VIPRooms: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { rooms, loading, error } = useSelector((state: RootState) => state.vip)
  
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    dispatch(fetchVIPRooms())
  }, [dispatch])

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-900/30 text-green-400 border-green-500/50'
      case 'occupied': return 'bg-red-900/30 text-red-400 border-red-500/50'
      case 'cleaning': return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50'
      case 'maintenance': return 'bg-blue-900/30 text-blue-400 border-blue-500/50'
      default: return 'bg-gray-900/30 text-gray-400 border-gray-500/50'
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const calculateRevenue = (room: any) => {
    if (!room.currentSession) return 0
    const elapsed = Math.floor((Date.now() - new Date(room.currentSession.startTime).getTime()) / 1000)
    const minutes = Math.ceil(elapsed / 60)
    return minutes * (room.hourlyRate / 60)
  }

  const handleRoomAction = (roomId: string, action: string) => {
    switch (action) {
      case 'start':
        dispatch(startRoomTimer(roomId))
        break
      case 'stop':
        dispatch(stopRoomTimer(roomId))
        break
      case 'available':
      case 'cleaning':
      case 'maintenance':
        dispatch(updateRoomStatus({ roomId, status: action }))
        break
    }
  }

  const viewRoomDetails = (room: any) => {
    setSelectedRoom(room)
    setShowDetailsModal(true)
  }

  const totalRevenue = rooms.reduce((sum, room) => sum + calculateRevenue(room), 0)
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length
  const availableCount = rooms.filter(r => r.status === 'available').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">VIP Rooms</h1>
          <p className="text-gray-400 mt-1">
            Monitor room status, timers, and revenue tracking
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-lg px-4 py-2">
            <div className="text-sm text-gray-400">Live Revenue</div>
            <div className="text-xl font-bold text-accent-gold">
              ${totalRevenue.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-900/30 rounded-lg">
              <BuildingStorefrontIcon className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Available Rooms</h3>
              <p className="text-2xl font-bold text-green-400">{availableCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-900/30 rounded-lg">
              <UserIcon className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Occupied Rooms</h3>
              <p className="text-2xl font-bold text-red-400">{occupiedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-accent-gold/30 rounded-lg">
              <ClockIcon className="h-6 w-6 text-accent-gold" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Avg. Session</h3>
              <p className="text-2xl font-bold text-accent-gold">45m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div 
              key={room.id}
              className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-accent-blue/30 transition-all duration-300"
            >
              {/* Room Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                  <p className="text-gray-400 text-sm">${room.hourlyRate}/hour</p>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoomStatusColor(room.status)}`}>
                  {room.status.toUpperCase()}
                </div>
              </div>

              {/* Room Status */}
              {room.status === 'occupied' && room.currentSession ? (
                <div className="space-y-4">
                  {/* Timer Display */}
                  <div className="bg-dark-bg/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-accent-red mb-1">
                      {formatTime(Math.floor((Date.now() - new Date(room.currentSession.startTime).getTime()) / 1000))}
                    </div>
                    <div className="text-sm text-gray-400">Session Time</div>
                  </div>

                  {/* Session Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Customer:</span>
                      <span className="text-white">{room.currentSession.dancerName || 'Anonymous'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Started:</span>
                      <span className="text-white">
                        {new Date(room.currentSession.startTime).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Charge:</span>
                      <span className="text-accent-gold font-medium">
                        ${calculateRevenue(room).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BuildingStorefrontIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">
                    {room.status === 'available' && 'Ready for next customer'}
                    {room.status === 'cleaning' && 'Being cleaned and sanitized'}
                    {room.status === 'maintenance' && 'Under maintenance'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                {room.status === 'available' && (
                  <button
                    onClick={() => handleRoomAction(room.id, 'start')}
                    className="flex-1 bg-green-900/20 hover:bg-green-900/30 border border-green-500/30 text-green-300 font-medium py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center space-x-1"
                  >
                    <PlayIcon className="h-4 w-4" />
                    <span>Start Session</span>
                  </button>
                )}
                
                {room.status === 'occupied' && (
                  <button
                    onClick={() => handleRoomAction(room.id, 'stop')}
                    className="flex-1 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 text-red-300 font-medium py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center space-x-1"
                  >
                    <StopIcon className="h-4 w-4" />
                    <span>End Session</span>
                  </button>
                )}
                
                <button
                  onClick={() => viewRoomDetails(room)}
                  className="px-3 py-2 bg-accent-blue/20 hover:bg-accent-blue/30 border border-accent-blue/30 text-accent-blue rounded-lg transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Actions */}
              {room.status !== 'occupied' && (
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => handleRoomAction(room.id, 'cleaning')}
                    className={`flex-1 text-xs py-1 px-2 rounded transition-colors ${
                      room.status === 'cleaning' 
                        ? 'bg-yellow-900/30 text-yellow-400' 
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    Cleaning
                  </button>
                  <button
                    onClick={() => handleRoomAction(room.id, 'maintenance')}
                    className={`flex-1 text-xs py-1 px-2 rounded transition-colors ${
                      room.status === 'maintenance' 
                        ? 'bg-blue-900/30 text-blue-400' 
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    Maintenance
                  </button>
                  <button
                    onClick={() => handleRoomAction(room.id, 'available')}
                    className={`flex-1 text-xs py-1 px-2 rounded transition-colors ${
                      room.status === 'available' 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    Available
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Room Details Modal */}
      {showDetailsModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-white/20 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{selectedRoom.name} Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Room Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Status:</span>
                  <div className={`mt-1 px-2 py-1 rounded text-xs font-medium border inline-block ${getRoomStatusColor(selectedRoom.status)}`}>
                    {selectedRoom.status.toUpperCase()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Hourly Rate:</span>
                  <p className="text-white font-medium">${selectedRoom.hourlyRate}</p>
                </div>
                <div>
                  <span className="text-gray-400">Capacity:</span>
                  <p className="text-white font-medium">{selectedRoom.capacity} people</p>
                </div>
                <div>
                  <span className="text-gray-400">Size:</span>
                  <p className="text-white font-medium">{selectedRoom.size} sq ft</p>
                </div>
              </div>

              {/* Current Session */}
              {selectedRoom.currentSession && (
                <div className="bg-dark-bg/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Current Session</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white font-mono">
                        {formatTime(Math.floor((Date.now() - new Date(selectedRoom.currentSession.startTime).getTime()) / 1000))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Charge:</span>
                      <span className="text-accent-gold font-medium">
                        ${calculateRevenue(selectedRoom).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Today's Stats */}
              <div className="bg-dark-bg/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Today's Performance</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Sessions:</span>
                    <p className="text-white font-medium">{selectedRoom.todaySessions || 0}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Revenue:</span>
                    <p className="text-accent-gold font-medium">${selectedRoom.todayRevenue || 0}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Utilization:</span>
                    <p className="text-white font-medium">{selectedRoom.utilization || 0}%</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Avg. Session:</span>
                    <p className="text-white font-medium">{selectedRoom.avgSession || 0}min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VIPRooms