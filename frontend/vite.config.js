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

  // Development tetap memakai subpath /Peta-Skanida/, sedangkan build
  // produksi (Vercel) dilayani dari root domain agar aset tidak 404.
  const base = env.VITE_BASE_PATH || (mode === 'production' ? '/' : '/Peta-Skanida/')

  return {
    plugins: [react()],
    base,
    server: { proxy },
    preview: { proxy },
  }
})
