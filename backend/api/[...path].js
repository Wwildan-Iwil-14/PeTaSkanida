import { createApp } from '../src/app.js'

/**
 * Entry point Vercel (serverless).
 *
 * Semua request /api/* diarahkan ke file ini oleh file-based routing Vercel.
 * Express app diekspor sebagai handler; JANGAN memanggil app.listen() karena
 * Vercel yang mengelola HTTP server.
 */
export default createApp()
