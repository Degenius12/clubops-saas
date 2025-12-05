import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'https://clubops-backend-pgynfiz9g-tony-telemacques-projects.vercel.app',
        changeOrigin: true,
        secure: true,
      },
      '/socket.io': {
        target: 'https://clubops-backend-pgynfiz9g-tony-telemacques-projects.vercel.app',
        changeOrigin: true,
        ws: true,
        secure: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
