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
  EyeIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const VIPBooths: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { rooms, loading, error } = useSelector((state: RootState) => state.vip)
  
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    dispatch(fetchVIPRooms())
  }, [dispatch])

  const getRoomStatusStyles = (status: string) => {
    switch (status) {
      case 'available': 
        return {
          badge: 'bg-status-success/10 text-status-success border-status-success/20',
          icon: 'bg-status-success/15 text-status-success',
          glow: 'shadow-glow-success'
        }
      case 'occupied': 
        return {
          badge: 'bg-status-danger/10 text-status-danger border-status-danger/20',
          icon: 'bg-status-danger/15 text-status-danger',
          glow: 'shadow-glow-danger'
        }
      case 'cleaning': 
        return {
          badge: 'bg-status-warning/10 text-status-warning border-status-warning/20',
          icon: 'bg-status-warning/15 text-status-warning',
          glow: ''
        }
      case 'maintenance': 
        return {
          badge: 'bg-status-info/10 text-status-info border-status-info/20',
          icon: 'bg-status-info/15 text-status-info',
          glow: ''
        }
      default: 
        return {
          badge: 'bg-midnight-700 text-text-tertiary border-white/10',
          icon: 'bg-midnight-700 text-text-tertiary',
          glow: ''
        }
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

  const getTimerStatus = (room: any) => {
    if (!room.currentSession) return 'ok'
    const elapsed = Math.floor((Date.now() - new Date(room.currentSession.startTime).getTime()) / 1000)
    const minutes = elapsed / 60
    if (minutes > 60) return 'danger'
    if (minutes > 45) return 'warning'
    return 'ok'
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">VIP Booths</h1>
          <p className="text-sm text-text-tertiary mt-1">
            Monitor booth status, timers, and revenue
          </p>
        </div>
        
        {/* Live Revenue Card */}
        <div className="card-premium px-4 py-3 flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gold-500/30 blur-lg rounded-full"></div>
            <div className="relative p-2 rounded-lg bg-gold-500/15">
              <CurrencyDollarIcon className="h-5 w-5 text-gold-500" />
            </div>
          </div>
          <div>
            <p className="text-xs text-text-tertiary">Live Revenue</p>
            <p className="text-xl font-bold font-mono text-gold-500 tabular-nums">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="card-premium p-4 sm:p-5 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-status-success/10">
              <BuildingStorefrontIcon className="h-5 w-5 text-status-success" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-text-tertiary">Available</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-status-success tabular-nums">
                {availableCount}
              </p>
            </div>
          </div>
        </div>

        <div className="card-premium p-4 sm:p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-status-danger/10">
              <UserIcon className="h-5 w-5 text-status-danger" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-text-tertiary">Occupied</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-status-danger tabular-nums">
                {occupiedCount}
              </p>
            </div>
          </div>
        </div>

        <div className="card-premium p-4 sm:p-5 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-gold-500/10">
              <ClockIcon className="h-5 w-5 text-gold-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-text-tertiary">Avg. Session</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-gold-500 tabular-nums">
                45m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : rooms.length === 0 ? (
        /* Empty State */
        <div className="card-premium p-12 text-center animate-fade-in">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-2xl"></div>
            <div className="relative p-6 rounded-full bg-midnight-800 border border-white/5">
              <BuildingStorefrontIcon className="h-12 w-12 text-text-tertiary" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No VIP Booths</h3>
          <p className="text-text-tertiary mb-6 max-w-sm mx-auto">
            VIP booths will appear here once configured
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rooms.map((room, index) => {
            const statusStyles = getRoomStatusStyles(room.status)
            const timerStatus = getTimerStatus(room)
            
            return (
              <div 
                key={room.id}
                className={`card-premium p-5 transition-all duration-200 animate-fade-in-up ${
                  room.status === 'occupied' ? statusStyles.glow : ''
                }`}
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                {/* Room Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{room.name}</h3>
                    <p className="text-sm text-text-tertiary font-mono">${room.hourlyRate}/hr</p>
                  </div>
                  
                  <span className={`badge border ${statusStyles.badge}`}>
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </span>
                </div>

                {/* Room Content */}
                {room.status === 'occupied' && room.currentSession ? (
                  <div className="space-y-4">
                    {/* Timer Display */}
                    <div className={`
                      relative p-5 rounded-xl text-center overflow-hidden
                      ${timerStatus === 'danger' ? 'bg-status-danger/10 border border-status-danger/20 animate-timer-warning' : ''}
                      ${timerStatus === 'warning' ? 'bg-status-warning/10 border border-status-warning/20' : ''}
                      ${timerStatus === 'ok' ? 'bg-midnight-800/50 border border-white/5' : ''}
                    `}>
                      {/* Background glow for occupied rooms */}
                      {timerStatus === 'ok' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-royal-500/5"></div>
                      )}
                      
                      <div className="relative">
                        <div className={`timer-display ${
                          timerStatus === 'danger' ? 'timer-danger' :
                          timerStatus === 'warning' ? 'timer-warning' : 'text-text-primary'
                        }`}>
                          {formatTime(Math.floor((Date.now() - new Date(room.currentSession.startTime).getTime()) / 1000))}
                        </div>
                        <p className="text-xs text-text-tertiary mt-1">Session Time</p>
                      </div>
                    </div>

                    {/* Session Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-tertiary">Dancer:</span>
                        <span className="text-text-primary font-medium">{room.currentSession.dancerName || 'Guest'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-tertiary">Started:</span>
                        <span className="text-text-secondary font-mono tabular-nums">
                          {new Date(room.currentSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-tertiary">Current:</span>
                        <span className="text-gold-500 font-bold font-mono tabular-nums">
                          ${calculateRevenue(room).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className={`inline-flex p-4 rounded-full ${statusStyles.icon} mb-3`}>
                      <BuildingStorefrontIcon className="h-8 w-8" />
                    </div>
                    <p className="text-sm text-text-tertiary">
                      {room.status === 'available' && 'Ready for next session'}
                      {room.status === 'cleaning' && 'Being prepared'}
                      {room.status === 'maintenance' && 'Under maintenance'}
                    </p>
                  </div>
                )}

                {/* Primary Action */}
                <div className="flex gap-2 mt-4">
                  {room.status === 'available' && (
                    <button
                      onClick={() => handleRoomAction(room.id, 'start')}
                      className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2 touch-target"
                    >
                      <PlayIcon className="h-4 w-4" />
                      Start Session
                    </button>
                  )}
                  
                  {room.status === 'occupied' && (
                    <button
                      onClick={() => handleRoomAction(room.id, 'stop')}
                      className="flex-1 btn-danger py-2.5 text-sm flex items-center justify-center gap-2 touch-target"
                    >
                      <StopIcon className="h-4 w-4" />
                      End Session
                    </button>
                  )}
                  
                  <button
                    onClick={() => viewRoomDetails(room)}
                    className="btn-secondary px-3 py-2.5 touch-target"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Quick Status Actions */}
                {room.status !== 'occupied' && (
                  <div className="flex gap-1.5 mt-2">
                    {['cleaning', 'maintenance', 'available'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleRoomAction(room.id, status)}
                        className={`
                          flex-1 text-xs py-1.5 px-2 rounded-lg transition-colors touch-target
                          ${room.status === status 
                            ? getRoomStatusStyles(status).badge 
                            : 'bg-midnight-800 text-text-tertiary hover:bg-midnight-700'
                          }
                        `}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Room Details Modal */}
      {showDetailsModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="card-premium p-6 w-full max-w-lg animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gold-500/10">
                  <SparklesIcon className="h-5 w-5 text-gold-500" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary">{selectedRoom.name}</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-icon touch-target"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-5">
              {/* Room Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-midnight-800/50">
                  <p className="text-xs text-text-tertiary mb-1">Status</p>
                  <span className={`badge border ${getRoomStatusStyles(selectedRoom.status).badge}`}>
                    {selectedRoom.status.toUpperCase()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-midnight-800/50">
                  <p className="text-xs text-text-tertiary mb-1">Hourly Rate</p>
                  <p className="text-lg font-bold font-mono text-gold-500 tabular-nums">${selectedRoom.hourlyRate}</p>
                </div>
                <div className="p-3 rounded-xl bg-midnight-800/50">
                  <p className="text-xs text-text-tertiary mb-1">Capacity</p>
                  <p className="text-text-primary font-medium">{selectedRoom.capacity} people</p>
                </div>
                <div className="p-3 rounded-xl bg-midnight-800/50">
                  <p className="text-xs text-text-tertiary mb-1">Size</p>
                  <p className="text-text-primary font-medium">{selectedRoom.size} sq ft</p>
                </div>
              </div>

              {/* Current Session */}
              {selectedRoom.currentSession && (
                <div className="p-4 rounded-xl bg-status-danger-muted border border-status-danger-border">
                  <h4 className="text-sm font-semibold text-status-danger mb-3">Active Session</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Duration:</span>
                      <span className="font-mono text-text-primary tabular-nums">
                        {formatTime(Math.floor((Date.now() - new Date(selectedRoom.currentSession.startTime).getTime()) / 1000))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">Current Charge:</span>
                      <span className="text-gold-500 font-bold font-mono tabular-nums">
                        ${calculateRevenue(selectedRoom).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Today's Performance */}
              <div className="p-4 rounded-xl bg-midnight-800/50 border border-white/5">
                <h4 className="text-sm font-semibold text-text-primary mb-3">Today's Performance</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-tertiary">Sessions</p>
                    <p className="text-lg font-bold font-mono text-text-primary tabular-nums">
                      {selectedRoom.todaySessions || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">Revenue</p>
                    <p className="text-lg font-bold font-mono text-gold-500 tabular-nums">
                      ${selectedRoom.todayRevenue || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">Utilization</p>
                    <p className="text-lg font-bold font-mono text-electric-400 tabular-nums">
                      {selectedRoom.utilization || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary">Avg. Session</p>
                    <p className="text-lg font-bold font-mono text-text-primary tabular-nums">
                      {selectedRoom.avgSession || 0}m
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full btn-secondary py-3 touch-target"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VIPBooths