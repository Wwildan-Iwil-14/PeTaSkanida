import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Base path default cocok untuk GitHub Pages. Saat deploy ke Vercel (domain root),
// set VITE_BASE_PATH=/ di environment project Vercel.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/Peta-Skanida/',
  }
})
