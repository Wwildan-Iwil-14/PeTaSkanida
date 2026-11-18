import { createApp } from './src/app.js'

/**
 * Entry point Vercel (serverless) - ditempatkan di root project.
 *
 * Vercel menerapkan fungsi root ini sebagai catch-all untuk seluruh path,
 * termasuk /api/auth/* yang tidak bisa dijangkau bila fungsi ditempatkan
 * di folder api/[...path].js. Jangan memanggil app.listen() di sini karena
 * Vercel yang mengelola HTTP server.
 */
export default createApp()
