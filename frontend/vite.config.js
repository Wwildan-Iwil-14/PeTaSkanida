import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Semua permintaan frontend ke /api diteruskan ke backend oleh dev server.
  // Dengan begitu frontend & backend tersambung tanpa perlu pengaturan CORS.
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3001'
  const proxy = {
    '/api': { target: apiTarget, changeOrigin: true },
  }

  return {
    plugins: [react()],
    base: '/Peta-Skanida/',
    server: { proxy },
    preview: { proxy },
  }
})
