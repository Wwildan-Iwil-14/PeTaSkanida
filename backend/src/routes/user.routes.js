import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/httpError.js'
import { validateAdminPayload } from '../lib/validate.js'
import { requireAdmin, requireRole } from '../middleware/auth.js'

const router = Router()

const parseId = value => {
  const id = Number.parseInt(value, 10)
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, 'ID pengguna tidak valid.')
  return id
}

const PUBLIC_FIELDS = 'id, user_id, username, email, nama, role, features, created_at'
const FALLBACK_FIELDS = 'id, user_id, username, email, nama, role, created_at'

async function findProfile(id) {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw httpError(502, `Gagal memuat pengguna: ${error.message}`)
  if (!data) throw httpError(404, 'Pengguna tidak ditemukan.')
  return data
}

/** Daftar pengguna; kolom features opsional sebelum migration dijalankan. */
async function listProfiles() {
  const { data, error } = await supabase
    .from('admins')
    .select(PUBLIC_FIELDS)
    .order('id', { ascending: true })

  if (!error) return data || []
  if (!/features/i.test(error.message)) {
    throw httpError(502, `Gagal memuat daftar pengguna: ${error.message}`)
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from('admins')
    .select(FALLBACK_FIELDS)
    .order('id', { ascending: true })

  if (fallbackError) {
    throw httpError(502, `Gagal memuat daftar pengguna: ${fallbackError.message}`)
  }
  return fallback || []
}

// Seluruh pengelolaan akun hanya untuk super admin.
router.use(requireAdmin, requireRole('super_admin'))

/**
 * GET /api/admin/users — daftar akun admin/petugas/super admin.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const users = await listProfiles()
    res.json({ users })
  }),
)

/**
 * POST /api/admin/users — tambah akun baru.
 * Akun dibuat di Supabase Auth, profilnya disimpan di tabel admins.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { payload, errors } = validateAdminPayload(req.body, { isCreate: true })
    if (errors.length > 0) throw httpError(422, errors.join(' '))

    const { data: duplicate, error: checkError } = await supabase
      .from('admins')
      .select('id')
      .ilike('email', payload.email)
      .maybeSingle()

    if (checkError) throw httpError(502, `Gagal memeriksa email: ${checkError.message}`)
    if (duplicate) throw httpError(409, 'Email tersebut sudah terdaftar sebagai pengguna.')

    const { data: created, error: authError } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: { nama: payload.nama, role: payload.role },
    })

    if (authError) {
      throw httpError(
        502,
        /already registered|already exists/i.test(authError.message)
          ? 'Email tersebut sudah terdaftar di Supabase Auth.'
          : `Gagal membuat akun: ${authError.message}`,
      )
    }

    const userId = created.user?.id
    const profileRow = {
      user_id: userId,
      email: payload.email,
      nama: payload.nama,
      role: payload.role,
      features: payload.features,
    }

    let { data: profile, error: profileError } = await supabase
      .from('admins')
      .insert(profileRow)
      .select(PUBLIC_FIELDS)
      .single()

    // Migration fitur belum dijalankan → simpan tanpa kolom features.
    if (profileError && /features/i.test(profileError.message)) {
      delete profileRow.features
      ;({ data: profile, error: profileError } = await supabase
        .from('admins')
        .insert(profileRow)
        .select(FALLBACK_FIELDS)
        .single())
    }

    if (profileError) {
      // Rollback akun Auth agar tidak menjadi akun yatim piatu.
      if (userId) await supabase.auth.admin.deleteUser(userId)
      throw httpError(502, `Gagal menyimpan profil pengguna: ${profileError.message}`)
    }

    res.status(201).json({ user: profile })
  }),
)

/**
 * PATCH /api/admin/users/:id — edit nama, email, password, role, dan fitur.
 */
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const current = await findProfile(id)

    const { payload, errors } = validateAdminPayload(req.body)
    if (errors.length > 0) throw httpError(422, errors.join(' '))

    // Jangan sampai super admin mengunci dirinya sendiri dari panel.
    if (current.user_id && current.user_id === req.admin.userId && payload.role !== 'super_admin') {
      throw httpError(400, 'Anda tidak dapat menurunkan role akun yang sedang digunakan.')
    }

    if (current.user_id && (payload.email !== current.email || payload.password)) {
      const attributes = {}
      if (payload.email !== current.email) attributes.email = payload.email
      if (payload.password) attributes.password = payload.password

      const { error: authError } = await supabase.auth.admin.updateUserById(
        current.user_id,
        attributes,
      )
      if (authError) throw httpError(502, `Gagal memperbarui akun: ${authError.message}`)
    }

    const updateRow = { nama: payload.nama, email: payload.email, role: payload.role }
    if (payload.features !== null) updateRow.features = payload.features

    let { data: updated, error: updateError } = await supabase
      .from('admins')
      .update(updateRow)
      .eq('id', id)
      .select(PUBLIC_FIELDS)
      .single()

    if (updateError && /features/i.test(updateError.message)) {
      delete updateRow.features
      ;({ data: updated, error: updateError } = await supabase
        .from('admins')
        .update(updateRow)
        .eq('id', id)
        .select(FALLBACK_FIELDS)
        .single())
    }

    if (updateError) throw httpError(502, `Gagal memperbarui pengguna: ${updateError.message}`)
    res.json({ user: updated })
  }),
)

/**
 * DELETE /api/admin/users/:id — hapus akun admin/petugas.
 * Akun Auth ikut dihapus (baris admins tersambung via ON DELETE CASCADE).
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const profile = await findProfile(id)

    if (profile.user_id && profile.user_id === req.admin.userId) {
      throw httpError(400, 'Tidak dapat menghapus akun yang sedang digunakan sendiri.')
    }

    if (profile.user_id) {
      const { error: authError } = await supabase.auth.admin.deleteUser(profile.user_id)
      if (authError) throw httpError(502, `Gagal menghapus akun: ${authError.message}`)
    }

    // Baris admins dengan user_id akan terhapus otomatis, tetapi hapus juga
    // eksplisit untuk profil lama yang belum memiliki user_id.
    const { error: deleteError } = await supabase.from('admins').delete().eq('id', id)
    if (deleteError) throw httpError(502, `Gagal menghapus pengguna: ${deleteError.message}`)

    res.json({ ok: true })
  }),
)

export default router
