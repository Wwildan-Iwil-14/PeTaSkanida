import { Router } from 'express'
import authRoutes from './auth.routes.js'
import requestRoutes from './request.routes.js'
import userRoutes from './user.routes.js'
import historyRoutes from './history.routes.js'
import scanRoutes from './scan.routes.js'

const router = Router()

/** GET /api/health - cek koneksi backend. */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'peta-skanida-backend' })
})

router.use('/auth', authRoutes)
router.use('/requests', requestRoutes)
router.use('/admin/users', userRoutes)
router.use('/history', historyRoutes)
router.use('/scans', scanRoutes)

export default router
