/**
 * Membuat akun admin di Supabase Auth (schema auth) sekaligus baris profilnya
 * di tabel public.admins.
 *
 * Pemakaian (dari folder backend):
 *   npm run admin:create -- admin@skanida.sch.id admin123 "Administrator" super_admin
 *
 * Prasyarat: migration database/migrations/20261112000000_*.sql dan
 * 20261120000002_add_features_role.sql sudah dijalankan di Supabase SQL Editor.
 */
import { config } from '../src/config.js'
import { supabase } from '../src/lib/supabase.js'
import { ROLES } from '../src/lib/features.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function usage() {
  console.log('Pemakaian: npm run admin:create -- <email> <password> [nama] [role]')
  console.log('Role     : petugas | admin | super_admin (default: admin)')
  console.log('Contoh:   npm run admin:create -- admin@skanida.sch.id admin123 "Administrator" super_admin')
}

const [, , email, password, nama = 'Administrator', roleArg = 'admin'] = process.argv

if (!email || !password) {
  usage()
  process.exit(1)
}
if (!EMAIL_PATTERN.test(email)) {
  console.error(`Email tidak valid: ${email}`)
  process.exit(1)
}
if (password.length < 6) {
  console.error('Password minimal 6 karakter (aturan bawaan Supabase Auth).')
  process.exit(1)
}
if (!ROLES.includes(roleArg)) {
  console.error(`Role tidak dikenal: ${roleArg}. Pilih: ${ROLES.join(', ')}`)
  process.exit(1)
}
const role = roleArg

/** Cari user Supabase Auth berdasarkan email (listUsers tidak punya filter email). */
async function findUserByEmail(target) {
  const perPage = 100
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`Gagal membaca daftar user: ${error.message}`)

    const users = data?.users || []
    const found = users.find(user => (user.email || '').toLowerCase() === target.toLowerCase())
    if (found) return found
    if (users.length < perPage) break
  }
  return null
}

/** Peringatan bila pendaftaran akun publik masih aktif di Supabase Auth. */
async function warnIfPublicSignupEnabled() {
  try {
    const response = await fetch(`${config.supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: config.supabaseKey },
    })
    if (!response.ok) return
    const settings = await response.json()
    if (settings?.disable_signup === false) {
      console.log('\n⚠️  PERINGATAN KEAMANAN:')
      console.log('   Pendaftaran akun publik masih AKTIF di Supabase Auth,')
      console.log('   sehingga siapa pun bisa membuat akun lewat /auth/v1/signup.')
      console.log('   Matikan di dashboard: Authentication > Sign In / Providers > Email > Enable sign ups (OFF).')
      console.log('   (Login admin tetap aman karena hanya user dengan profil di tabel admins yang diterima.)')
    }
  } catch {
    // Pemeriksaan ini hanya pelengkap; gagal memeriksa bukan masalah.
  }
}

async function main() {
  console.log(`Mencari akun Supabase Auth: ${email}`)
  let user = await findUserByEmail(email)

  if (user) {
    console.log(`• Akun sudah ada di Supabase Auth (id: ${user.id}) — memperbarui password...`)
    const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    })
    if (updateErr) throw new Error(`Gagal memperbarui password akun: ${updateErr.message}`)
    user = updated.user
    console.log('• Password akun berhasil diperbarui.')
  } else {
    console.log('• Membuat akun baru di Supabase Auth...')
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // langsung terkonfirmasi, tanpa email verifikasi.
    })
    if (error) throw new Error(`Gagal membuat akun: ${error.message}`)
    user = data.user
    console.log(`• Akun dibuat (id: ${user.id}).`)
  }

  console.log('• Menyimpan profil admin di tabel public.admins...')
  // Periksa apakah ada baris profil lama yang belum ditautkan ke user_id
  let { data: legacyRow } = await supabase
    .from('admins')
    .select('id, user_id')
    .ilike('email', email)
    .is('user_id', null)
    .maybeSingle()

  if (!legacyRow) {
    const { data: byUsername } = await supabase
      .from('admins')
      .select('id, user_id')
      .eq('username', 'admin')
      .is('user_id', null)
      .maybeSingle()
    legacyRow = byUsername
  }

  let upsertError = null
  if (legacyRow) {
    const { error } = await supabase
      .from('admins')
      .update({ user_id: user.id, nama, role })
      .eq('id', legacyRow.id)
    upsertError = error
  } else {
    const { error } = await supabase.from('admins').upsert(
      {
        user_id: user.id,
        email: user.email,
        nama,
        role,
      },
      { onConflict: 'user_id' },
    )
    upsertError = error
  }

  if (upsertError) {
    if (upsertError.message?.includes('user_id')) {
      throw new Error(
        'Kolom admins.user_id belum ada. Jalankan dulu migration ' +
          'database/migrations/20261112000000_*.sql di Supabase SQL Editor.',
      )
    }
    throw new Error(`Gagal menyimpan profil: ${upsertError.message}`)
  }

  await warnIfPublicSignupEnabled()

  console.log('\n✅ Admin siap dipakai:')
  console.log(`   Email    : ${email}`)
  console.log(`   Nama     : ${nama}`)
  console.log(`   Role     : ${role}`)
  console.log('   Login    : menu Admin / Pengelola di aplikasi frontend.')
}

main().catch(err => {
  console.error(`\n❌ ${err.message}`)
  process.exit(1)
})
