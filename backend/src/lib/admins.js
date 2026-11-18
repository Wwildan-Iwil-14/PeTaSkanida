import { supabase } from './supabase.js'
import { httpError } from './httpError.js'

/**
 * Ambil profil admin dari tabel public.admins berdasarkan akun Supabase Auth.
 *
 * Tabel admins hanya menyimpan PROFIL (nama, role, email) yang dihubungkan ke
 * auth.users lewat kolom user_id. Kredensial login diurus Supabase Auth.
 *
 * Jika user_id belum terhubung (misal akun lama sebelum migrasi), fungsi ini
 * otomatis menautkan user_id ke baris profil lama yang cocok.
 */
export async function getAdminProfile(userId, email) {
  // 1. Cari berdasarkan user_id (kondisi normal setelah akun terhubung)
  const { data, error } = await supabase
    .from('admins')
    .select('nama, role, email, username')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw httpError(502, `Gagal memuat profil admin: ${error.message}`)
  }
  if (data) return data

  // 2. Fallback migrasi otomatis: jika ada baris profil lama yang belum ditautkan (user_id masih null)
  if (email && typeof email === 'string') {
    const normalized = email.trim().toLowerCase()

    // Cari baris admin lama yang email-nya cocok dan user_id masih kosong
    const { data: byEmail } = await supabase
      .from('admins')
      .select('id, nama, role, email, username')
      .ilike('email', normalized)
      .is('user_id', null)
      .maybeSingle()

    let legacy = byEmail

    // Bila tidak ketemu via email, cari baris default lama (username = 'admin' dan user_id null)
    if (!legacy) {
      const { data: byUsername } = await supabase
        .from('admins')
        .select('id, nama, role, email, username')
        .eq('username', 'admin')
        .is('user_id', null)
        .maybeSingle()
      legacy = byUsername
    }

    if (legacy) {
      // Tautkan user_id akun Supabase Auth ke profil admin di database
      const { data: updated, error: linkErr } = await supabase
        .from('admins')
        .update({ user_id: userId, email: normalized })
        .eq('id', legacy.id)
        .select('nama, role, email, username')
        .maybeSingle()

      if (!linkErr && updated) {
        return updated
      }
    }
  }

  return null
}
