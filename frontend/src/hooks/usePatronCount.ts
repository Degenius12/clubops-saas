// usePatronCount.ts
// Custom hook for real-time patron count tracking (Feature #49)

import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'

interface PatronCountData {
  currentCount: number
  capacityLimit: number | null
  percentFull: number
  lastUpdate: string | null
  trend: 'increasing' | 'decreasing' | 'stable'
  recentChangeCount: number
}

interface UsePatronCountReturn {
  patronCount: PatronCountData | null
  isLoading: boolean
  error: string | null
  refreshCount: () => Promise<void>
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function usePatronCount(clubId: string): UsePatronCountReturn {
  const [patronCount, setPatronCount] = useState<PatronCountData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { socket, isConnected } = useWebSocket(API_BASE_URL)

  // Fetch current patron count
  const fetchPatronCount = useCallback(async () => {
    if (!clubId) return

    try {
      setIsLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/patron-count/current/${clubId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch patron count: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setPatronCount({
          currentCount: data.currentCount,
          capacityLimit: data.capacityLimit,
          percentFull: data.percentFull,
          lastUpdate: data.lastUpdate,
          trend: data.trend,
          recentChangeCount: data.recentChangeCount
        })
      } else {
        throw new Error(data.error || 'Failed to fetch patron count')
      }
    } catch (err) {
      console.error('[usePatronCount] Error fetching patron count:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [clubId])

  // Initial fetch
  useEffect(() => {
    fetchPatronCount()
  }, [fetchPatronCount])

  // Listen for real-time patron count updates via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return

    const handlePatronCountUpdate = (data: any) => {
      if (data.clubId === clubId) {
        setPatronCount(prev => ({
          currentCount: data.newCount,
          capacityLimit: prev?.capacityLimit || data.capacityLimit || null,
          percentFull: data.capacityLimit
            ? (data.newCount / data.capacityLimit) * 100
            : 0,
          lastUpdate: data.timestamp,
          trend: data.delta > 0 ? 'increasing' : data.delta < 0 ? 'decreasing' : 'stable',
          recentChangeCount: data.delta
        }))
      }
    }

    socket.on('patronCountUpdate', handlePatronCountUpdate)

    return () => {
      socket.off('patronCountUpdate', handlePatronCountUpdate)
    }
  }, [socket, isConnected, clubId])

  return {
    patronCount,
    isLoading,
    error,
    refreshCount: fetchPatronCount
  }
}
