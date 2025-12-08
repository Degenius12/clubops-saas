import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store/store'
import { 
  fetchQueue, 
  addToQueue, 
  removeFromQueue, 
  reorderQueue, 
  playTrack, 
  pauseTrack, 
  nextTrack 
} from '../../store/slices/queueSlice'
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  PlusIcon,
  XMarkIcon,
  Bars3Icon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  MusicalNoteIcon,
  QueueListIcon
} from '@heroicons/react/24/outline'
import { PlayIcon as PlaySolidIcon } from '@heroicons/react/24/solid'

const DJQueue: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { 
    currentQueue, 
    currentTrack, 
    isPlaying, 
    volume, 
    currentTime, 
    duration,
    loading 
  } = useSelector((state: RootState) => state.queue)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTrackUrl, setNewTrackUrl] = useState('')
  const [newTrackTitle, setNewTrackTitle] = useState('')

  useEffect(() => {
    dispatch(fetchQueue())
  }, [dispatch])

  const handlePlayPause = () => {
    if (isPlaying) {
      dispatch(pauseTrack())
    } else {
      dispatch(playTrack())
    }
  }

  const handleNext = () => {
    dispatch(nextTrack())
  }

  const handleAddTrack = () => {
    if (newTrackUrl && newTrackTitle) {
      dispatch(addToQueue({
        dancerId: 'temp-dancer-id',
        songTitle: newTrackTitle,
        artist: 'Unknown Artist',
        stage: 'main'
      }))
      setNewTrackUrl('')
      setNewTrackTitle('')
      setShowAddModal(false)
    }
  }

  const handleRemoveTrack = (trackId: string) => {
    dispatch(removeFromQueue(trackId))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">DJ Queue</h1>
          <p className="text-sm text-text-tertiary mt-1">
            Manage music queue and playback
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 touch-target"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Track</span>
        </button>
      </div>

      {/* Music Player Card */}
      <div className="player-card animate-fade-in-up">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          
          {/* Album Art / Visualizer */}
          <div className="relative w-full lg:w-56 aspect-square lg:aspect-auto lg:h-56 rounded-xl overflow-hidden flex-shrink-0">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-royal-600/40 via-gold-500/30 to-electric-500/40" />
            
            {/* Blur overlay for "now playing" effect */}
            {currentTrack && isPlaying && (
              <div className="absolute inset-0 bg-gradient-to-br from-royal-600/20 via-gold-500/20 to-electric-500/20 animate-pulse" />
            )}
            
            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center">
              {currentTrack ? (
                <>
                  <div className={`p-4 rounded-full bg-midnight-900/50 backdrop-blur-sm ${isPlaying ? 'animate-spin-slow' : ''}`}>
                    <MusicalNoteIcon className="h-12 w-12 text-gold-500" />
                  </div>
                  <div className="mt-4 px-4 text-center">
                    <span className={`badge-gold text-xs ${isPlaying ? 'animate-pulse' : ''}`}>
                      {isPlaying ? '♫ Now Playing' : 'Paused'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-full bg-midnight-900/50 backdrop-blur-sm">
                    <MusicalNoteIcon className="h-12 w-12 text-text-tertiary" />
                  </div>
                  <p className="mt-4 text-sm text-text-tertiary">No track selected</p>
                </>
              )}
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex-1 space-y-5">
            {/* Track Info */}
            <div>
              <h3 className="text-xl font-bold text-text-primary truncate">
                {currentTrack?.title || 'No Track Playing'}
              </h3>
              <p className="text-text-secondary mt-1">
                {currentTrack?.artist || 'Select a track from the queue'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="player-progress">
                <div 
                  className="player-progress-bar"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-tertiary font-mono tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button className="btn-icon touch-target">
                <BackwardIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={handlePlayPause}
                className="player-btn-play touch-target"
              >
                {isPlaying ? (
                  <PauseIcon className="h-7 w-7" />
                ) : (
                  <PlaySolidIcon className="h-7 w-7 ml-0.5" />
                )}
              </button>
              
              <button 
                onClick={handleNext}
                className="btn-icon touch-target"
              >
                <ForwardIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3">
              <button className="btn-icon w-8 h-8">
                <SpeakerXMarkIcon className="h-4 w-4" />
              </button>
              <div className="flex-1 player-progress">
                <div 
                  className="h-full rounded-full bg-electric-500 transition-all duration-150"
                  style={{ width: `${volume}%` }}
                />
              </div>
              <button className="btn-icon w-8 h-8">
                <SpeakerWaveIcon className="h-4 w-4" />
              </button>
              <span className="text-xs text-text-tertiary font-mono w-10 text-right tabular-nums">{volume}%</span>
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
                ({currentQueue.length} tracks)
              </span>
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : currentQueue.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-royal-500/20 rounded-full blur-2xl"></div>
              <div className="relative p-6 rounded-full bg-midnight-800 border border-white/5">
                <MusicalNoteIcon className="h-12 w-12 text-text-tertiary" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">Queue is Empty</h3>
            <p className="text-text-tertiary mb-6 max-w-sm mx-auto">
              Add some tracks to get the party started
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary touch-target"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add First Track
            </button>
          </div>
        ) : (
          /* Queue Items */
          <div className="space-y-2">
            {currentQueue.map((track, index) => {
              const isCurrentTrack = track.id === currentTrack?.id
              return (
                <div 
                  key={track.id}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
                    ${isCurrentTrack 
                      ? 'bg-gold-500/10 border-gold-500/30 glow-gold-subtle' 
                      : 'bg-midnight-800/50 border-white/5 hover:border-white/10 hover:bg-midnight-800'
                    }
                    drag-item animate-fade-in
                  `}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary transition-colors">
                    <Bars3Icon className="h-5 w-5" />
                  </div>

                  {/* Track Number / Playing Indicator */}
                  <div className="w-8 flex justify-center">
                    {isCurrentTrack && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-4">
                        <div className="w-1 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', height: '60%' }} />
                        <div className="w-1 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms', height: '100%' }} />
                        <div className="w-1 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms', height: '40%' }} />
                      </div>
                    ) : (
                      <span className={`text-sm font-mono ${isCurrentTrack ? 'text-gold-500' : 'text-text-tertiary'}`}>
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-gold-500' : 'text-text-primary'}`}>
                      {track.title}
                    </h4>
                    <p className="text-sm text-text-tertiary truncate">
                      {track.artist || 'Unknown Artist'}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="text-sm text-text-tertiary font-mono tabular-nums hidden sm:block">
                    {track.duration ? formatTime(track.duration) : '--:--'}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!isCurrentTrack && (
                      <button
                        onClick={() => dispatch(playTrack())}
                        className="btn-icon w-9 h-9 hover:text-gold-500 touch-target"
                        title="Play"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRemoveTrack(track.id)}
                      className="btn-icon w-9 h-9 hover:text-status-danger touch-target"
                      title="Remove"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Track Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="card-premium p-6 w-full max-w-md animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">Add New Track</h3>
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
                  Track Title
                </label>
                <input
                  type="text"
                  value={newTrackTitle}
                  onChange={(e) => setNewTrackTitle(e.target.value)}
                  className="input-premium"
                  placeholder="Enter track title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Track URL or File Path
                </label>
                <input
                  type="url"
                  value={newTrackUrl}
                  onChange={(e) => setNewTrackUrl(e.target.value)}
                  className="input-premium"
                  placeholder="https://example.com/track.mp3"
                />
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
                onClick={handleAddTrack}
                disabled={!newTrackUrl || !newTrackTitle}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-target"
              >
                Add Track
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DJQueue
