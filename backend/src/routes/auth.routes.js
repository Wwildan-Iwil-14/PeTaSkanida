import { Router } from 'express'
import { config } from '../config.js'
import { supabase } from '../lib/supabase.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/httpError.js'
import { signToken } from '../lib/token.js'
import { validateCredentials } from '../lib/validate.js'
import { requireAdmin } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimit.js'

const router = Router()
const loginLimiter = createRateLimiter({ windowMs: 60_000, max: 10 })

/**
 * POST /api/auth/login
 * Verifikasi kredensial admin lewat function verify_admin (bcrypt) di database,
 * lalu terbitkan token session untuk dipakai pada endpoint admin.
 */
router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { username, password, errors } = validateCredentials(req.body)
    if (errors.length > 0) throw httpError(400, errors.join(' '))

    const { data, error } = await supabase.rpc('verify_admin', {
      p_username: username,
      p_password: password,
    })

    if (error) {
      throw httpError(502, `Verifikasi admin gagal: ${error.message}`)
    }
    if (!data) {
      throw httpError(401, 'Nama akun atau password salah.')
    }

    const token = signToken(
      { sub: username, nama: data },
      { secret: config.authSecret, ttlSeconds: config.tokenTtlSeconds },
    )

    res.json({
      token,
      admin: { username, nama: data },
    })
  }),
)

/** GET /api/auth/me - cek token session yang sedang dipakai. */
router.get(
  '/me',
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({ admin: req.admin })
  }),
)

export default router
