import { io, Socket } from 'socket.io-client'
import { API_BASE_URL } from './api'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
    })

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket?.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('🔌 Socket.IO connection error:', error)
    })
  }

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export default getSocket
