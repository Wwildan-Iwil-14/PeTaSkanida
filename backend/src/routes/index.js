import { Router } from 'express'
import authRoutes from './auth.routes.js'
import requestRoutes from './request.routes.js'

const router = Router()

/** GET /api/health - cek koneksi backend. */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'peta-skanida-backend' })
})

router.use('/auth', authRoutes)
router.use('/requests', requestRoutes)

export default router
