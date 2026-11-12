import { supabase } from '../lib/supabase.js'
import { getAdminProfile } from '../lib/admins.js'
import { httpError } from '../lib/httpError.js'

/** Baca token dari header `Authorization: Bearer <token>`. */
export function readBearer(req) {
  const header = req.get('authorization') || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

const SESSAI_INVALID = 'Sesi admin tidak valid atau sudah berakhir. Silakan login kembali.'

/**
 * Wajib login admin (Authorization: Bearer <JWT Supabase Auth>).
 *
 * Token diverifikasi langsung ke Supabase Auth (GoTrue) lewat auth.getUser(),
 * lalu dipastikan akunnya punya baris profil di tabel public.admins.
 */
export async function requireAdmin(req, res, next) {
  try {
    const token = readBearer(req)
    if (!token) return next(httpError(401, SESSAI_INVALID))

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return next(httpError(401, SESSAI_INVALID))

    const profile = await getAdminProfile(data.user.id, data.user.email)
    if (!profile) {
      return next(httpError(403, 'Akun ini bukan admin terdaftar. Hubungi pengelola sistem.'))
    }

    req.admin = {
      userId: data.user.id,
      email: data.user.email,
      nama: profile.nama,
      role: profile.role,
    }
    next()
  } catch (err) {
    next(err)
  }
}
