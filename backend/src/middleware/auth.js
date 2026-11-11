import { config } from '../config.js'
import { verifyToken } from '../lib/token.js'
import { httpError } from '../lib/httpError.js'

/** Wajib login admin (Authorization: Bearer <token>). */
export function requireAdmin(req, res, next) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''

  const payload = verifyToken(token, { secret: config.authSecret })
  if (!payload) {
    return next(
      httpError(401, 'Sesi admin tidak valid atau sudah berakhir. Silakan login kembali.'),
    )
  }

  req.admin = { username: payload.sub, nama: payload.nama }
  next()
}
