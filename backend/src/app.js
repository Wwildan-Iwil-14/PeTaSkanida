import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import routes from './routes/index.js'
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
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )

  app.use(express.json({ limit: '100kb' }))
  app.use('/api', routes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
