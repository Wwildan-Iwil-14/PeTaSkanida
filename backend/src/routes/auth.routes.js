import { Router } from 'express'
import { supabase, supabaseAuth } from '../lib/supabase.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/httpError.js'
import { getAdminProfile } from '../lib/admins.js'
import { resolveFeatures } from '../lib/features.js'
import { validateCredentials } from '../lib/validate.js'
import { requireAdmin, readBearer, clearAdminCache } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimit.js'

const router = Router()

const loginLimiter = createRateLimiter({ windowMs: 60_000, max: 10 })
const refreshLimiter = createRateLimiter({ windowMs: 60_000, max: 20 })

/**
 * POST /api/auth/login
 * Verifikasi kredensial lewat Supabase Auth (GoTrue) memakai email + password,
 * lalu terbitkan JWT Supabase beserta refresh token untuk sesi frontend.
 *
 * Login hanya diterima bila akun punya baris profil di public.admins,
 * sehingga pendaftaran akun baru di Supabase Auth tidak otomatis jadi admin.
 */
router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password, errors } = validateCredentials(req.body)
    if (errors.length > 0) throw httpError(400, errors.join(' '))

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password })

    if (error || !data?.session) {
      // Pesan generik: jangan bocorkan apakah email terdaftar.
      throw httpError(401, 'Email atau password salah.')
    }

    const profile = await getAdminProfile(data.user.id, data.user.email, Boolean(data.user.email_confirmed_at))
    if (!profile) {
      // Cabut sesi Supabase Auth yang baru saja dibuat agar user tidak meninggalkan sesi aktif
      await supabase.auth.admin.signOut(data.session.access_token, 'global').catch(() => {})
      throw httpError(403, 'Akun ini bukan admin terdaftar. Hubungi pengelola sistem.')
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      admin: {
        email: data.user.email,
        nama: profile.nama,
        role: profile.role,
        features: resolveFeatures(profile.role, profile.features),
      },
    })
  }),
)

/**
 * POST /api/auth/refresh
 * Tukar refresh token dengan JWT baru (access token) saat sesi hampir habis.
 */
router.post(
  '/refresh',
  refreshLimiter,
  asyncHandler(async (req, res) => {
    const refreshToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken.trim() : ''
    if (!refreshToken) throw httpError(400, 'Refresh token wajib diisi.')

    const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token: refreshToken })

    if (error || !data?.session) {
      throw httpError(401, 'Sesi admin tidak valid atau sudah berakhir. Silakan login kembali.')
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    })
  }),
)

/**
 * POST /api/auth/logout
 * Cabut sesi di Supabase Auth agar refresh token tidak bisa dipakai lagi.
 * Selalu menjawab 200 supaya proses "Keluar" di frontend tidak terganggu.
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const bearer = readBearer(req)
    const refreshToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken.trim() : ''

    // Cabut cache sesi agar token ini tidak lagi dipakai setelah logout.
    clearAdminCache(bearer)

    try {
      // Pakai refresh token bila ada (access token mungkin sudah kedaluwarsa).
      let jwt = bearer
      if (refreshToken) {
        const { data } = await supabaseAuth.auth.refreshSession({ refresh_token: refreshToken })
        if (data?.session?.access_token) jwt = data.session.access_token
      }
      if (jwt) await supabase.auth.admin.signOut(jwt, 'global')
    } catch {
      // Sesuatu yang gagal saat mencabut tidak boleh menggagalkan proses keluar.
    }

    res.json({ ok: true })
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
