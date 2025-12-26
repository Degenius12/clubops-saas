import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import {
  fetchQueue,
  addToQueue,
  startPerformance,
  endPerformance,
  reorderQueue
} from '../../store/slices/queueSlice'
import { fetchDancers } from '../../store/slices/dancerSlice'
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  PlusIcon,
  XMarkIcon,
  Bars3Icon,
  MusicalNoteIcon,
  QueueListIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { PlayIcon as PlaySolidIcon } from '@heroicons/react/24/solid'

const DJQueue: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const {
    mainQueue,
    currentPerformances,
    loading
  } = useSelector((state: RootState) => state.queue)

  const { dancers } = useSelector((state: RootState) => state.dancers)

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDancer, setSelectedDancer] = useState('')
  const [selectedStage, setSelectedStage] = useState<'main' | 'vip' | 'side'>('main')

  useEffect(() => {
    dispatch(fetchQueue())
    dispatch(fetchDancers())
  }, [dispatch])

  // Get current performer for main stage
  const currentPerformer = currentPerformances?.find(p => p.stage === 'main')

  // Get checked-in dancers not already in queue
  const availableDancers = (dancers || []).filter(dancer => {
    const isCheckedIn = dancer.is_checked_in
    const isInQueue = (mainQueue || []).some(item => item.dancer_id === dancer.id)
    const isPerforming = (currentPerformances || []).some(p => p.dancer_id === dancer.id)
    return isCheckedIn && !isInQueue && !isPerforming
  })

  const handleAddToQueue = () => {
    if (selectedDancer) {
      dispatch(addToQueue({
        dancerId: selectedDancer,
        songTitle: 'Open Performance',
        artist: '',
        stage: selectedStage
      }))
      setSelectedDancer('')
      setShowAddModal(false)
      // Refresh queue
      setTimeout(() => dispatch(fetchQueue()), 500)
    }
  }

  const handleNextPerformer = () => {
    if (mainQueue && mainQueue.length > 0) {
      const nextItem = mainQueue.find(item => item.status === 'queued')
      if (nextItem) {
        dispatch(startPerformance(nextItem.id))
        // Refresh queue
        setTimeout(() => dispatch(fetchQueue()), 500)
      }
    }
  }

  const handleEndPerformance = () => {
    if (currentPerformer && mainQueue) {
      // Find the queue item for this performer
      const performanceItem = mainQueue.find(item => item.status === 'current')
      if (performanceItem) {
        dispatch(endPerformance(performanceItem.id))
        // Refresh queue
        setTimeout(() => dispatch(fetchQueue()), 500)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">DJ Queue</h1>
          <p className="text-sm text-text-tertiary mt-1">
            Manage stage rotation and performer queue
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 touch-target"
          disabled={availableDancers.length === 0}
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add to Queue</span>
        </button>
      </div>

      {/* Current Performer Card */}
      <div className="player-card animate-fade-in-up">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">

          {/* Performer Visual */}
          <div className="relative w-full lg:w-56 aspect-square lg:aspect-auto lg:h-56 rounded-xl overflow-hidden flex-shrink-0">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-royal-600/40 via-gold-500/30 to-electric-500/40" />

            {/* Blur overlay for "now performing" effect */}
            {currentPerformer && (
              <div className="absolute inset-0 bg-gradient-to-br from-royal-600/20 via-gold-500/20 to-electric-500/20 animate-pulse" />
            )}

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center">
              {currentPerformer ? (
                <>
                  <div className="p-4 rounded-full bg-midnight-900/50 backdrop-blur-sm animate-pulse">
                    <MusicalNoteIcon className="h-12 w-12 text-gold-500" />
                  </div>
                  <div className="mt-4 px-4 text-center">
                    <span className="badge-gold text-xs animate-pulse">
                      ♫ Now Performing
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-full bg-midnight-900/50 backdrop-blur-sm">
                    <UserGroupIcon className="h-12 w-12 text-text-tertiary" />
                  </div>
                  <p className="mt-4 text-sm text-text-tertiary">No performer on stage</p>
                </>
              )}
            </div>
          </div>

          {/* Performer Info & Controls */}
          <div className="flex-1 space-y-5">
            {/* Performer Info */}
            <div>
              <h3 className="text-xl font-bold text-text-primary truncate">
                {currentPerformer?.dancer_name || 'Stage Empty'}
              </h3>
              <p className="text-text-secondary mt-1">
                {currentPerformer ? 'Main Stage Performance' : 'Ready for next performer'}
              </p>
            </div>

            {/* Progress Bar (if performing) */}
            {currentPerformer && (
              <div className="space-y-2">
                <div className="player-progress">
                  <div
                    className="player-progress-bar"
                    style={{
                      width: `${Math.max(0, (1 - currentPerformer.remaining_time / currentPerformer.duration) * 100)}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-tertiary font-mono tabular-nums">
                  <span>{formatTime(currentPerformer.duration - currentPerformer.remaining_time)}</span>
                  <span>{formatTime(currentPerformer.remaining_time)}</span>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              {currentPerformer ? (
                <button
                  onClick={handleEndPerformance}
                  className="player-btn-play touch-target"
                  title="End Performance"
                >
                  <CheckCircleIcon className="h-7 w-7" />
                </button>
              ) : (
                <button
                  onClick={handleNextPerformer}
                  disabled={!mainQueue || mainQueue.length === 0}
                  className="player-btn-play touch-target disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Start Next Performer"
                >
                  <PlaySolidIcon className="h-7 w-7 ml-0.5" />
                </button>
              )}

              <button
                onClick={handleNextPerformer}
                disabled={!mainQueue || mainQueue.length === 0}
                className="btn-icon touch-target disabled:opacity-50"
                title="Next Performer"
              >
                <ForwardIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Queue Stats */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 text-sm">
                <QueueListIcon className="h-4 w-4 text-text-tertiary" />
                <span className="text-text-tertiary">In Queue:</span>
                <span className="text-text-primary font-semibold">{(mainQueue || []).filter(i => i.status === 'queued').length}</span>
              </div>
              <div className="flex-1 flex items-center gap-2 text-sm">
                <ClockIcon className="h-4 w-4 text-text-tertiary" />
                <span className="text-text-tertiary">Est. Wait:</span>
                <span className="text-text-primary font-semibold">
                  {formatTime((mainQueue || []).filter(i => i.status === 'queued').length * 180)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="card-premium p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-royal-500/10">
              <QueueListIcon className="h-5 w-5 text-royal-400" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              Up Next
              <span className="ml-2 text-sm font-normal text-text-tertiary">
                ({(mainQueue || []).filter(i => i.status === 'queued').length} dancers)
              </span>
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (mainQueue || []).filter(i => i.status === 'queued').length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-royal-500/20 rounded-full blur-2xl"></div>
              <div className="relative p-6 rounded-full bg-midnight-800 border border-white/5">
                <UserGroupIcon className="h-12 w-12 text-text-tertiary" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">Queue is Empty</h3>
            <p className="text-text-tertiary mb-6 max-w-sm mx-auto">
              {availableDancers.length > 0
                ? 'Add dancers to the queue to start the rotation'
                : 'Check in dancers first to add them to the queue'}
            </p>
            {availableDancers.length > 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary touch-target"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add First Dancer
              </button>
            )}
          </div>
        ) : (
          /* Queue Items */
          <div className="space-y-2">
            {mainQueue
              .filter(item => item.status === 'queued')
              .map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-xl border bg-midnight-800/50 border-white/5 hover:border-white/10 hover:bg-midnight-800 transition-all duration-200 drag-item animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary transition-colors">
                    <Bars3Icon className="h-5 w-5" />
                  </div>

                  {/* Position Number */}
                  <div className="w-8 flex justify-center">
                    <span className="text-sm font-mono text-text-tertiary">
                      {index + 1}
                    </span>
                  </div>

                  {/* Dancer Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate text-text-primary">
                      {item.dancer_name}
                    </h4>
                    <p className="text-sm text-text-tertiary truncate">
                      {item.song_title || 'Open Performance'}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="text-sm text-text-tertiary font-mono tabular-nums hidden sm:block">
                    {item.duration ? formatTime(item.duration) : '3:00'}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {index === 0 && !currentPerformer && (
                      <button
                        onClick={() => dispatch(startPerformance(item.id)).then(() => dispatch(fetchQueue()))}
                        className="btn-icon w-9 h-9 hover:text-gold-500 touch-target"
                        title="Start Performance"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        // Remove from queue - will implement with backend
                        console.log('Remove', item.id)
                      }}
                      className="btn-icon w-9 h-9 hover:text-status-danger touch-target"
                      title="Remove"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Dancer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="card-premium p-6 w-full max-w-md animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">Add Entertainer to Queue</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-icon"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Select Dancer
                </label>
                <select
                  value={selectedDancer}
                  onChange={(e) => setSelectedDancer(e.target.value)}
                  className="input-premium"
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

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Stage
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value as 'main' | 'vip' | 'side')}
                  className="input-premium"
                >
                  <option value="main">Main Stage</option>
                  <option value="vip">VIP Stage</option>
                  <option value="side">Side Stage</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 btn-secondary touch-target"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToQueue}
                disabled={!selectedDancer}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-target"
              >
                Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DJQueue
