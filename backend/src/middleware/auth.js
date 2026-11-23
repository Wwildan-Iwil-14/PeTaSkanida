import { supabase } from '../lib/supabase.js'
import { getAdminProfile } from '../lib/admins.js'
import { resolveFeatures } from '../lib/features.js'
import { httpError } from '../lib/httpError.js'

/** Baca token dari header `Authorization: Bearer <token>`. */
export function readBearer(req) {
  const header = req.get('authorization') || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

const SESSAI_INVALID = 'Sesi admin tidak valid atau sudah berakhir. Silakan login kembali.'

// Cache profil per access token supaya setiap request tidak perlu dua
// network call ke Supabase (getUser + getAdminProfile). Token baru = kunci
// baru, dan cache dibatasi/usang sebentar agar pencabutan sesi tetap cepat.
const ADMIN_CACHE_TTL_MS = 10_000
const ADMIN_CACHE_MAX = 500
const adminCache = new Map()

function cachedAdmin(token) {
  const hit = adminCache.get(token)
  if (!hit) return null
  if (Date.now() >= hit.expires) {
    adminCache.delete(token)
    return null
  }
  return hit.admin
}

function rememberAdmin(token, admin) {
  if (adminCache.size >= ADMIN_CACHE_MAX) adminCache.clear()
  adminCache.set(token, { admin, expires: Date.now() + ADMIN_CACHE_TTL_MS })
}

/** Hapus cache saat sesi dicabut (logout / ganti password). */
export function clearAdminCache(token) {
  if (token) adminCache.delete(token)
}

/**
 * Wajib login admin (Authorization: Bearer <JWT Supabase Auth>).
 *
 * Token diverifikasi langsung ke Supabase Auth (GoTrue) lewat auth.getUser(),
 * lalu dipastikan akunnya punya baris profil di tabel public.admins.
 * Hasilnya ditempel ke req.admin: userId, profileId, email, nama, role, features.
 */
export async function requireAdmin(req, res, next) {
  try {
    const token = readBearer(req)
    if (!token) return next(httpError(401, SESSAI_INVALID))

    const cached = cachedAdmin(token)
    if (cached) {
      req.admin = cached
      return next()
    }

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return next(httpError(401, SESSAI_INVALID))

    const profile = await getAdminProfile(data.user.id, data.user.email, Boolean(data.user.email_confirmed_at))
    if (!profile) {
      return next(httpError(403, 'Akun ini bukan admin terdaftar. Hubungi pengelola sistem.'))
    }

    const admin = {
      userId: data.user.id,
      profileId: profile.id,
      email: data.user.email,
      nama: profile.nama,
      role: profile.role,
      features: resolveFeatures(profile.role, profile.features),
    }
    rememberAdmin(token, admin)
    req.admin = admin
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Wajib memiliki salah satu fitur yang diminta.
 * Contoh: requireFeature('scan') atau requireFeature('request', 'tamu').
 */
export function requireFeature(...keys) {
  return (req, res, next) => {
    const owned = req.admin?.features || []
    if (!keys.some(key => owned.includes(key))) {
      return next(
        httpError(403, 'Akun Anda tidak memiliki akses ke fitur ini. Hubungi super admin.'),
      )
    }
    next()
  }
}

/** Wajib memiliki salah satu role yang diminta. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.admin?.role)) {
      return next(httpError(403, 'Aksi ini hanya boleh dilakukan oleh super admin.'))
    }
    next()
  }
}
