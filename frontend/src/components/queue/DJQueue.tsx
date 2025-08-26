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
  MusicalNoteIcon
} from '@heroicons/react/24/outline'

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
        url: newTrackUrl,
        title: newTrackTitle,
        duration: 0 // Will be calculated when loaded
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
          <h1 className="text-3xl font-bold text-white">DJ Queue</h1>
          <p className="text-gray-400 mt-1">
            Manage music queue and playback controls
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-accent-red to-accent-gold hover:from-accent-gold hover:to-accent-red text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Track</span>
        </button>
      </div>

      {/* Music Player */}
      <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Album Art / Visualizer */}
          <div className="w-full lg:w-48 h-48 bg-gradient-to-br from-accent-red/30 via-accent-gold/30 to-accent-blue/30 rounded-xl flex items-center justify-center border border-white/10">
            {currentTrack ? (
              <div className="text-center">
                <MusicalNoteIcon className="h-16 w-16 text-white mx-auto mb-2" />
                <div className="text-white font-medium text-sm">Now Playing</div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <MusicalNoteIcon className="h-16 w-16 mx-auto mb-2" />
                <div className="text-sm">No track selected</div>
              </div>
            )}
          </div>

          {/* Player Controls */}
          <div className="flex-1 space-y-4">
            {/* Track Info */}
            <div>
              <h3 className="text-xl font-bold text-white">
                {currentTrack?.title || 'No Track Playing'}
              </h3>
              <p className="text-gray-400">
                {currentTrack?.artist || 'Select a track from the queue'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-dark-bg/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-accent-red to-accent-gold transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-4">
              <button className="p-3 text-gray-400 hover:text-white transition-colors">
                <BackwardIcon className="h-6 w-6" />
              </button>
              
              <button
                onClick={handlePlayPause}
                className="p-4 bg-gradient-to-r from-accent-red to-accent-gold hover:from-accent-gold hover:to-accent-red text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                {isPlaying ? (
                  <PauseIcon className="h-8 w-8" />
                ) : (
                  <PlayIcon className="h-8 w-8 ml-1" />
                )}
              </button>
              
              <button 
                onClick={handleNext}
                className="p-3 text-gray-400 hover:text-white transition-colors"
              >
                <ForwardIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-3">
              <SpeakerXMarkIcon className="h-5 w-5 text-gray-400" />
              <div className="flex-1 bg-dark-bg/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-accent-blue transition-all duration-300"
                  style={{ width: `${volume}%` }}
                />
              </div>
              <SpeakerWaveIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-400 min-w-[3rem]">{volume}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="bg-dark-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Up Next ({currentQueue.length} tracks)
          </h2>
          
          <button className="text-gray-400 hover:text-white transition-colors">
            <Bars3Icon className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-accent-red border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : currentQueue.length === 0 ? (
          <div className="text-center py-8">
            <MusicalNoteIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Queue is Empty</h3>
            <p className="text-gray-400 mb-6">Add some tracks to get the party started!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-accent-red hover:bg-accent-gold text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Add First Track
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentQueue.map((track, index) => (
              <div 
                key={track.id}
                className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-300 ${
                  track.id === currentTrack?.id 
                    ? 'bg-accent-red/20 border-accent-red/30' 
                    : 'bg-dark-bg/50 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Drag Handle */}
                <div className="cursor-move text-gray-400 hover:text-white">
                  <Bars3Icon className="h-5 w-5" />
                </div>

                {/* Track Number */}
                <div className="w-8 text-center">
                  {track.id === currentTrack?.id ? (
                    <div className="w-4 h-4 mx-auto">
                      <div className="flex space-x-1">
                        <div className="w-1 h-4 bg-accent-red animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-4 bg-accent-gold animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-4 bg-accent-blue animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">{index + 1}</span>
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{track.title}</h4>
                  <p className="text-gray-400 text-sm truncate">{track.artist || 'Unknown Artist'}</p>
                </div>

                {/* Duration */}
                <div className="text-gray-400 text-sm">
                  {track.duration ? formatTime(track.duration) : '--:--'}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {track.id !== currentTrack?.id && (
                    <button
                      onClick={() => dispatch(playTrack())}
                      className="p-2 text-gray-400 hover:text-accent-red transition-colors"
                    >
                      <PlayIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleRemoveTrack(track.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Track Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-white/20 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Add New Track</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Track Title
                </label>
                <input
                  type="text"
                  value={newTrackTitle}
                  onChange={(e) => setNewTrackTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-red focus:border-transparent"
                  placeholder="Enter track title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Track URL or File Path
                </label>
                <input
                  type="url"
                  value={newTrackUrl}
                  onChange={(e) => setNewTrackUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-red focus:border-transparent"
                  placeholder="https://example.com/track.mp3"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTrack}
                disabled={!newTrackUrl || !newTrackTitle}
                className="flex-1 bg-gradient-to-r from-accent-red to-accent-gold hover:from-accent-gold hover:to-accent-red text-white font-medium py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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