import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api requests to the Node.js backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy all /ai requests to the Python FastAPI microservice
      '/ai': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
