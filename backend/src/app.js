import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import routes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

// Saat development, izinkan semua alamat lokal (localhost / 127.0.0.1 dengan
// port berapa pun) supaya frontend tetap bisa terhubung walau port Vite
// berubah (misalnya 5174 karena 5173 sedang dipakai).
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/

export function createApp() {
  const app = express()

  // Jangan mengumumkan stack/server ke klien.
  app.disable('x-powered-by')

  // Header keamanan dasar untuk semua respons API.
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()')
    next()
  })

  app.use(
    cors({
      origin(origin, callback) {
        // Permintaan tanpa Origin (curl, Postman, server-to-server) selalu diizinkan.
        if (!origin) return callback(null, true)
        if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
          return callback(null, true)
        }
        if (config.nodeEnv !== 'production' && LOCAL_ORIGIN.test(origin)) {
          return callback(null, true)
        }
        return callback(null, false)
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )

  // Import backup bisa berisi ribuan baris, jadi dilewatkan dari batas 100kb
  // global lalu diparse sendiri oleh route dengan batas lebih besar.
  app.use(express.json({
    limit: '100kb',
    type: req => !/\/admin\/database\/import(?:\?|$)/.test(req.url),
  }))

  // Halaman info sederhana saat backend dibuka langsung di browser.
  app.get('/', (req, res) => {
    res.json({
      service: 'PeTa SKANIDA API',
      status: 'ok',
      message: 'Backend berjalan dengan baik. Ini adalah server API, bukan tampilan aplikasi.',
      frontend: 'Buka http://localhost:5173 untuk menggunakan aplikasi.',
      endpoints: {
        health: 'GET /api/health',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        listRequests: 'GET /api/requests',
        approve: 'POST /api/requests/:id/approve',
        reject: 'POST /api/requests/:id/reject',
        contacted: 'PATCH /api/requests/:id/contacted',
        scan: 'POST /api/scans (admin)',
        scanList: 'GET /api/scans (admin)',
      },
    })
  })

  app.use('/api', routes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
