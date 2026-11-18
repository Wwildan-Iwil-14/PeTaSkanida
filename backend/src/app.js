import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import routes from './routes/index.js'
import authRoutes from './routes/auth.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin(origin, callback) {
        // Permintaan tanpa Origin (curl, Postman, server-to-server) selalu diizinkan.
        if (!origin) return callback(null, true)
        if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
          return callback(null, true)
        }
        return callback(null, false)
      },
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )

  app.use(express.json({ limit: '100kb' }))

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
      },
    })
  })

  // Alias untuk Vercel: path /api/auth/* diblokir oleh routing internal Vercel,
  // sehingga vercel.json me-rewrite-nya ke /api/_auth/* sebelum masuk ke sini.
  app.use('/api/_auth', authRoutes)

  app.use('/api', routes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
