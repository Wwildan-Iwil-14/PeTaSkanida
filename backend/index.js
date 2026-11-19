import { createApp } from './src/app.js'

/**
 * Entry point serverless untuk Vercel.
 *
 * Semua path (termasuk /api/auth/login yang bersegmen banyak) di-routing
 * ke fungsi root ini lewat konfigurasi `routes` di vercel.json.
 * JANGAN memanggil app.listen() di sini karena Vercel yang mengelola server.
 */
export default createApp()
