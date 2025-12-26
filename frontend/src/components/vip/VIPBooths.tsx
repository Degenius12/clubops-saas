import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import { getSocket } from '../../config/socket'
import {
  fetchVIPRooms,
  startVipSession,
  endVipSession,
  updateRoomStatus,
  startRoomTimer,
  stopRoomTimer,
  addItemToSession,
  fetchVipAlerts,
  checkMinimumSpendAlerts,
  acknowledgeAlert,
  resolveAlert
} from '../../store/slices/vipSlice'
import { fetchDancers } from '../../store/slices/dancerSlice'
import {
  BuildingStorefrontIcon,
  ClockIcon,
  UserIcon,
  PlayIcon,
  StopIcon,
  EyeIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  PlusIcon,
  MusicalNoteIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

const VIPBooths: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { rooms, alerts, alertCount, loading, error } = useSelector((state: RootState) => state.vip)
  const { dancers } = useSelector((state: RootState) => state.dancers)

  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showStartSessionModal, setShowStartSessionModal] = useState(false)
  const [selectedBoothId, setSelectedBoothId] = useState<string>('')
  const [selectedDancer, setSelectedDancer] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [songRate, setSongRate] = useState<string>('')
  const [minimumSpend, setMinimumSpend] = useState<string>('')

  // Add Item Modal State
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [addItemBoothId, setAddItemBoothId] = useState<string>('')
  const [itemType, setItemType] = useState<'BOTTLE' | 'SERVICE' | 'FOOD' | 'OTHER'>('BOTTLE')
  const [itemName, setItemName] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('1')
  const [unitPrice, setUnitPrice] = useState<string>('')
  const [itemNotes, setItemNotes] = useState<string>('')

  // Alerts Modal State
  const [showAlertsModal, setShowAlertsModal] = useState(false)

  useEffect(() => {
    dispatch(fetchVIPRooms())
    dispatch(fetchDancers())
    dispatch(fetchVipAlerts())

    // Set up background polling for alerts every 5 minutes
    const checkAlertsInterval = setInterval(() => {
      dispatch(checkMinimumSpendAlerts())
      dispatch(fetchVipAlerts())
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(checkAlertsInterval)
  }, [dispatch])

  // Socket.IO real-time listeners
  useEffect(() => {
    const socket = getSocket()

    // Listen for new minimum spend alerts
    socket.on('vip:minimum-spend-alert', (data) => {
      console.log('🔔 New minimum spend alert:', data)
      // Refetch alerts to update the UI
      dispatch(fetchVipAlerts())
      dispatch(fetchVIPRooms())
    })

    // Listen for alert acknowledgements
    socket.on('vip:alert-acknowledged', (data) => {
      console.log('✅ Alert acknowledged:', data)
      dispatch(fetchVipAlerts())
    })

    // Listen for alert resolutions
    socket.on('vip:alert-resolved', (data) => {
      console.log('✅ Alert resolved:', data)
      dispatch(fetchVipAlerts())
    })

    // Listen for item additions (to update spending)
    socket.on('vip:item-added', (data) => {
      console.log('💰 Item added to session:', data)
      dispatch(fetchVIPRooms())
      dispatch(fetchVipAlerts()) // Check if this resolves any alerts
    })

    // Cleanup listeners on unmount
    return () => {
      socket.off('vip:minimum-spend-alert')
      socket.off('vip:alert-acknowledged')
      socket.off('vip:alert-resolved')
      socket.off('vip:item-added')
    }
  }, [dispatch])

  // Get checked-in dancers only
  const availableDancers = dancers.filter(dancer => dancer.is_checked_in)

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
    if (!room.current_session) return 0
    const songCount = room.current_session.song_count || 0
    const songRate = room.current_session.song_rate || room.song_rate || 50
    return songCount * songRate
  }

  const getTimerStatus = (room: any) => {
    if (!room.currentSession) return 'ok'
    const elapsed = Math.floor((Date.now() - new Date(room.currentSession.startTime).getTime()) / 1000)
    const minutes = elapsed / 60
    if (minutes > 60) return 'danger'
    if (minutes > 45) return 'warning'
    return 'ok'
  }

  const handleStartSession = (boothId: string) => {
    setSelectedBoothId(boothId)
    setShowStartSessionModal(true)
  }

  const handleSubmitStartSession = async () => {
    if (!selectedDancer) return

    try {
      await dispatch(startVipSession({
        boothId: selectedBoothId,
        dancerId: selectedDancer,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        songRate: songRate ? parseFloat(songRate) : undefined,
        minimumSpend: minimumSpend ? parseFloat(minimumSpend) : undefined
      })).unwrap()

      // Reset form and close modal
      setShowStartSessionModal(false)
      setSelectedBoothId('')
      setSelectedDancer('')
      setCustomerName('')
      setCustomerPhone('')
      setSongRate('')
      setMinimumSpend('')

      // Refetch rooms to get updated data
      dispatch(fetchVIPRooms())
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  const handleOpenAddItemModal = (boothId: string) => {
    setAddItemBoothId(boothId)
    setShowAddItemModal(true)
  }

  const handleSubmitAddItem = async () => {
    if (!itemName || !unitPrice) return

    try {
      await dispatch(addItemToSession({
        boothId: addItemBoothId,
        itemType,
        itemName,
        quantity: parseInt(quantity) || 1,
        unitPrice: parseFloat(unitPrice),
        notes: itemNotes || undefined
      })).unwrap()

      // Reset form and close modal
      setShowAddItemModal(false)
      setAddItemBoothId('')
      setItemType('BOTTLE')
      setItemName('')
      setQuantity('1')
      setUnitPrice('')
      setItemNotes('')

      // Refetch rooms to get updated spending data
      dispatch(fetchVIPRooms())
    } catch (error) {
      console.error('Failed to add item:', error)
    }
  }

  const handleEndSession = async (boothId: string) => {
    try {
      await dispatch(endVipSession(boothId)).unwrap()
      dispatch(fetchVIPRooms())
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  const handleRoomAction = (roomId: string, action: string) => {
    switch (action) {
      case 'start':
        handleStartSession(roomId)
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

        <div className="flex items-center gap-3">
          {/* Alert Badge Button */}
          {alertCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAlertsModal(true)}
              className="relative card-premium px-4 py-3 flex items-center gap-3 hover:bg-midnight-700/50 transition-colors group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-status-warning/30 blur-lg rounded-full animate-pulse"></div>
                <div className="relative p-2 rounded-lg bg-status-warning/15">
                  <BellIcon className="h-5 w-5 text-status-warning" />
                </div>
                {/* Badge count */}
                <div className="absolute -top-1 -right-1 bg-status-danger text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {alertCount}
                </div>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Active Alerts</p>
                <p className="text-sm font-semibold text-status-warning">
                  {alertCount} Minimum Spend Alert{alertCount !== 1 ? 's' : ''}
                </p>
              </div>
            </button>
          )}

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
                    <h3 className="text-lg font-semibold text-text-primary">
                      {room.booth_name || room.name || `Booth ${room.booth_number}`}
                    </h3>
                    <p className="text-sm text-text-tertiary font-mono">
                      ${room.song_rate || 50}/song • {room.capacity} capacity
                    </p>
                  </div>

                  <span className={`badge border ${statusStyles.badge}`}>
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </span>
                </div>

                {/* Room Content */}
                {room.status === 'occupied' && room.current_session ? (
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
                          {formatTime(Math.floor((Date.now() - new Date(room.current_session.started_at).getTime()) / 1000))}
                        </div>
                        <p className="text-xs text-text-tertiary mt-1">Session Time</p>
                      </div>
                    </div>

                    {/* Minimum Spend Progress */}
                    {room.current_session.minimum_spend > 0 && (
                      <div className="p-3 rounded-xl bg-midnight-800/50 border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-text-tertiary">Minimum Spend Progress</span>
                          <span className={`text-xs font-bold ${
                            room.current_session.meets_minimum ? 'text-status-success' : 'text-status-warning'
                          }`}>
                            {room.current_session.percent_complete}%
                          </span>
                        </div>
                        <div className="h-2 bg-midnight-700 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full transition-all duration-500 ${
                              room.current_session.meets_minimum
                                ? 'bg-gradient-to-r from-status-success to-status-success/80'
                                : 'bg-gradient-to-r from-status-warning to-gold-500'
                            }`}
                            style={{ width: `${Math.min(100, room.current_session.percent_complete)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-text-tertiary">
                            ${room.current_session.grand_total.toFixed(2)} / ${room.current_session.minimum_spend.toFixed(2)}
                          </span>
                          {room.current_session.remaining > 0 && (
                            <span className="text-status-warning font-medium">
                              ${room.current_session.remaining.toFixed(2)} remaining
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Session Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-tertiary">Dancer:</span>
                        <span className="font-medium text-text-primary">{room.current_session.dancer_name}</span>
                      </div>
                      {room.current_session.customer_name && (
                        <div className="flex justify-between text-sm">
                          <span className="text-text-tertiary">Customer:</span>
                          <span className="font-medium text-text-primary">{room.current_session.customer_name}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-text-tertiary">Started:</span>
                        <span className="text-text-secondary font-mono tabular-nums">
                          {new Date(room.current_session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-tertiary">Songs:</span>
                        <span className="text-text-primary font-mono tabular-nums">
                          {room.current_session.song_count} @ ${room.current_session.song_rate}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-tertiary">Song Total:</span>
                        <span className="text-text-primary font-mono tabular-nums">
                          ${room.current_session.song_total.toFixed(2)}
                        </span>
                      </div>
                      {room.current_session.items_count > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-tertiary">Items ({room.current_session.items_count}):</span>
                            <span className="text-text-primary font-mono tabular-nums">
                              ${room.current_session.items_total.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                        <span className="text-text-secondary font-medium">Grand Total:</span>
                        <span className="text-gold-500 font-bold font-mono tabular-nums">
                          ${room.current_session.grand_total.toFixed(2)}
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
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenAddItemModal(room.id)}
                        className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2 touch-target"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Item
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEndSession(room.id)}
                        className="flex-1 btn-danger py-2.5 text-sm flex items-center justify-center gap-2 touch-target"
                      >
                        <StopIcon className="h-4 w-4" />
                        End Session
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => viewRoomDetails(room)}
                    className="btn-secondary px-3 py-2.5 touch-target"
                    title="View Details"
                    aria-label="View booth details"
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

      {/* Start Session Modal */}
      {showStartSessionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="card-premium p-6 w-full max-w-md animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gold-500/10">
                  <MusicalNoteIcon className="h-5 w-5 text-gold-500" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary">Start VIP Session</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStartSessionModal(false)}
                className="btn-icon touch-target"
                title="Close modal"
                aria-label="Close start session modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Dancer Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Select Dancer <span className="text-status-danger">*</span>
                </label>
                <select
                  value={selectedDancer}
                  onChange={(e) => setSelectedDancer(e.target.value)}
                  className="input-premium"
                  aria-label="Select dancer for VIP session"
                  required
                >
                  <option value="">Choose a dancer...</option>
                  {availableDancers.map(dancer => (
                    <option key={dancer.id} value={dancer.id}>
                      {dancer.stage_name || dancer.name}
                    </option>
                  ))}
                </select>
                {availableDancers.length === 0 && (
                  <p className="text-sm text-text-tertiary mt-2">
                    No checked-in dancers available. Check in dancers first.
                  </p>
                )}
              </div>

              {/* Customer Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Customer Name <span className="text-text-tertiary">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-premium"
                  placeholder="Enter customer name"
                />
              </div>

              {/* Customer Phone (Optional) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Customer Phone <span className="text-text-tertiary">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="input-premium"
                  placeholder="Enter customer phone"
                />
              </div>

              {/* Song Rate Override (Optional) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Song Rate <span className="text-text-tertiary">(Optional - uses booth default)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
                  <input
                    type="number"
                    value={songRate}
                    onChange={(e) => setSongRate(e.target.value)}
                    className="input-premium pl-8"
                    placeholder="50"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Minimum Spend (Optional) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Minimum Spend <span className="text-text-tertiary">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
                  <input
                    type="number"
                    value={minimumSpend}
                    onChange={(e) => setMinimumSpend(e.target.value)}
                    className="input-premium pl-8"
                    placeholder="500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  Set a minimum spending requirement for this session
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowStartSessionModal(false)}
                className="flex-1 btn-secondary touch-target"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitStartSession}
                disabled={!selectedDancer}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-target"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="card-premium p-6 w-full max-w-md animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gold-500/10">
                  <PlusIcon className="h-5 w-5 text-gold-500" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary">Add Item to Session</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="btn-icon touch-target"
                aria-label="Close add item modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Item Type */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Item Type <span className="text-status-danger">*</span>
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as 'BOTTLE' | 'SERVICE' | 'FOOD' | 'OTHER')}
                  className="input-premium"
                  required
                >
                  <option value="BOTTLE">Bottle</option>
                  <option value="SERVICE">Service</option>
                  <option value="FOOD">Food</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Item Name <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="input-premium"
                  placeholder="e.g., Dom Pérignon, VIP Service"
                  required
                />
              </div>

              {/* Quantity and Unit Price Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Quantity <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input-premium"
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Unit Price <span className="text-status-danger">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
                    <input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="input-premium pl-8"
                      placeholder="250"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Total Price Display */}
              {quantity && unitPrice && (
                <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Total Price:</span>
                    <span className="text-xl font-bold font-mono text-gold-500 tabular-nums">
                      ${(parseInt(quantity || '0') * parseFloat(unitPrice || '0')).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes (Optional) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Notes <span className="text-text-tertiary">(Optional)</span>
                </label>
                <textarea
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="input-premium"
                  placeholder="Additional details..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="flex-1 btn-secondary touch-target"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitAddItem}
                disabled={!itemName || !unitPrice}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-target"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Modal */}
      {showAlertsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-midnight-800 rounded-2xl shadow-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-status-warning/15">
                    <BellIcon className="h-6 w-6 text-status-warning" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">
                      Minimum Spend Alerts
                    </h2>
                    <p className="text-sm text-text-tertiary mt-0.5">
                      {alertCount} active alert{alertCount !== 1 ? 's' : ''} requiring attention
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAlertsModal(false)}
                  className="p-2 hover:bg-midnight-700 rounded-lg transition-colors"
                  aria-label="Close alerts modal"
                >
                  <XMarkIcon className="h-5 w-5 text-text-tertiary" />
                </button>
              </div>
            </div>

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircleIcon className="h-12 w-12 text-status-success mx-auto mb-3 opacity-50" />
                  <p className="text-text-secondary">No active alerts</p>
                  <p className="text-sm text-text-tertiary mt-1">
                    All VIP booths are meeting their minimum spend requirements
                  </p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`card-premium p-5 border-l-4 ${
                      alert.severity === 'HIGH'
                        ? 'border-status-danger'
                        : alert.severity === 'MEDIUM'
                        ? 'border-status-warning'
                        : 'border-status-info'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            alert.severity === 'HIGH'
                              ? 'bg-status-danger/15'
                              : alert.severity === 'MEDIUM'
                              ? 'bg-status-warning/15'
                              : 'bg-status-info/15'
                          }`}
                        >
                          <ExclamationTriangleIcon
                            className={`h-5 w-5 ${
                              alert.severity === 'HIGH'
                                ? 'text-status-danger'
                                : alert.severity === 'MEDIUM'
                                ? 'text-status-warning'
                                : 'text-status-info'
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary">
                            {alert.booth_name} (Booth #{alert.booth_number})
                          </h3>
                          <p className="text-sm text-text-secondary mt-1">
                            {alert.dancer_name}
                            {alert.customer_name && ` • ${alert.customer_name}`}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          alert.severity === 'HIGH'
                            ? 'bg-status-danger/15 text-status-danger'
                            : alert.severity === 'MEDIUM'
                            ? 'bg-status-warning/15 text-status-warning'
                            : 'bg-status-info/15 text-status-info'
                        }`}
                      >
                        {alert.severity}
                      </div>
                    </div>

                    <p className="text-sm text-text-tertiary mb-4">{alert.description}</p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-text-tertiary">Spending Progress</span>
                        <span
                          className={`text-xs font-bold ${
                            alert.percent_complete >= 100
                              ? 'text-status-success'
                              : alert.percent_complete >= 75
                              ? 'text-status-warning'
                              : 'text-status-danger'
                          }`}
                        >
                          {alert.percent_complete}%
                        </span>
                      </div>
                      <div className="h-2 bg-midnight-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            alert.percent_complete >= 100
                              ? 'bg-status-success'
                              : alert.percent_complete >= 75
                              ? 'bg-status-warning'
                              : 'bg-status-danger'
                          }`}
                          style={{ width: `${Math.min(100, alert.percent_complete)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-2">
                        <span className="text-text-tertiary">
                          ${alert.current_spending.toFixed(2)} / ${alert.minimum_spend.toFixed(2)}
                        </span>
                        <span className="text-status-danger font-medium">
                          ${alert.remaining.toFixed(2)} remaining
                        </span>
                      </div>
                    </div>

                    {/* Session Duration */}
                    <div className="flex items-center gap-2 text-sm text-text-tertiary mb-4">
                      <ClockIcon className="h-4 w-4" />
                      <span>Session duration: {alert.session_duration_minutes} minutes</span>
                    </div>

                    {/* Action Buttons */}
                    {alert.status === 'OPEN' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            dispatch(acknowledgeAlert(alert.id))
                          }}
                          className="flex-1 btn-secondary text-sm py-2"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                          Acknowledge
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            dispatch(resolveAlert({ alertId: alert.id }))
                          }}
                          className="flex-1 btn-primary text-sm py-2"
                        >
                          Resolve
                        </button>
                      </div>
                    )}

                    {alert.status === 'ACKNOWLEDGED' && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-sm text-status-info">
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>Acknowledged {alert.acknowledged_at && new Date(alert.acknowledged_at).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 flex justify-between items-center">
              <p className="text-sm text-text-tertiary">
                Alerts auto-check every 5 minutes
              </p>
              <button
                type="button"
                onClick={() => setShowAlertsModal(false)}
                className="btn-primary"
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