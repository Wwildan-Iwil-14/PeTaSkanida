import { supabase } from './supabase.js'
import { httpError } from './httpError.js'

const BASE_FIELDS = 'id, nama, role, email, username'
const FIELDS_WITH_FEATURES = `${BASE_FIELDS}, features`

/**
 * Ambil profil admin dari tabel public.admins berdasarkan akun Supabase Auth.
 *
 * Tabel admins hanya menyimpan PROFIL (nama, role, fitur, email) yang
 * dihubungkan ke auth.users lewat kolom user_id. Kredensial login diurus
 * Supabase Auth.
 *
 * Jika user_id belum terhubung (misal akun lama sebelum migrasi), fungsi ini
 * otomatis menautkan user_id ke baris profil lama yang cocok.
 */
export async function getAdminProfile(userId, email) {
  const found = await findProfile(userId, email)
  if (found) return found
  return linkLegacyProfile(userId, email)
}

async function findProfile(userId, email) {
  // 1. Cari berdasarkan user_id (kondisi normal setelah akun terhubung).
  //    Kolom features belum ada sebelum migration dijalankan → fallback
  //    tanpa fitur supaya login tetap berjalan.
  const { data, error } = await supabase
    .from('admins')
    .select(FIELDS_WITH_FEATURES)
    .eq('user_id', userId)
    .maybeSingle()

  if (!error) return data

  if (!/features/i.test(error.message)) {
    throw httpError(502, `Gagal memuat profil admin: ${error.message}`)
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from('admins')
    .select(BASE_FIELDS)
    .eq('user_id', userId)
    .maybeSingle()

  if (legacyError) throw httpError(502, `Gagal memuat profil admin: ${legacyError.message}`)
  return legacyData
}

/** Tautkan profil lama (user_id masih null) ke akun Supabase Auth yang login. */
async function linkLegacyProfile(userId, email) {
  if (!email || typeof email !== 'string') return null
  const normalized = email.trim().toLowerCase()

  // Cari baris admin lama yang email-nya cocok dan user_id masih kosong.
  const { data: byEmail } = await supabase
    .from('admins')
    .select('id, nama, role, email, username')
    .ilike('email', normalized)
    .is('user_id', null)
    .maybeSingle()

  let legacy = byEmail

  // Bila tidak ketemu via email, cari baris default lama (username = 'admin').
  if (!legacy) {
    const { data: byUsername } = await supabase
      .from('admins')
      .select('id, nama, role, email, username')
      .eq('username', 'admin')
      .is('user_id', null)
      .maybeSingle()
    legacy = byUsername
  }

  if (!legacy) return null

  const { data: updated, error: linkErr } = await supabase
    .from('admins')
    .update({ user_id: userId, email: normalized })
    .eq('id', legacy.id)
    .select('id, nama, role, email, username')
    .maybeSingle()

  if (linkErr || !updated) return null
  return updated
}
