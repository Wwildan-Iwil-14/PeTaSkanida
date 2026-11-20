import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/httpError.js'
import { validateRequestPayload } from '../lib/validate.js'
import { requireAdmin, requireFeature } from '../middleware/auth.js'

const router = Router()

const DUPLICATE_KEY = '23505'

const parseId = value => {
  const id = Number.parseInt(value, 10)
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, 'ID riwayat tidak valid.')
  return id
}

// Riwayat terhubung ke req_pending lewat FK. Setiap entri baru dibuat dengan
// mendaftarkan req_pending terlebih dahulu, lalu menyalin datanya ke riwayat.
// Dengan begitu status "Selesai" tetap terdeteksi oleh GET /api/requests.
async function createMaster(payload) {
  const { data, error } = await supabase
    .from('req_pending')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw httpError(502, `Gagal menyimpan data tamu: ${error.message}`)
  return data.id
}

async function insertIfMissing(table, record) {
  const { error } = await supabase.from(table).insert(record)
  if (error && error.code !== DUPLICATE_KEY) {
    throw httpError(502, `Gagal menyimpan ke ${table}: ${error.message}`)
  }
}

/**
 * POST /api/history — tambah entri riwayat kunjungan secara manual.
 */
router.post(
  '/',
  requireAdmin,
  requireFeature('riwayat_superadmin', 'riwayat'),
  asyncHandler(async (req, res) => {
    const { payload, errors } = validateRequestPayload(req.body)
    if (errors.length > 0) throw httpError(422, errors.join(' '))

    const id = await createMaster(payload)
    const record = { id, ...payload }
    await insertIfMissing('riwayat', record)

    res.status(201).json({ history: { ...record, status: 'Selesai' } })
  }),
)

/**
 * PATCH /api/history/:id — edit entri riwayat.
 * Perubahan disamakan ke req_pending dan tabel bayangannya agar status
 * dan data yang ditampilkan admin tetap konsisten.
 */
router.patch(
  '/:id',
  requireAdmin,
  requireFeature('riwayat_superadmin', 'riwayat'),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const { payload, errors } = validateRequestPayload(req.body)
    if (errors.length > 0) throw httpError(422, errors.join(' '))

    const { data: current, error: findError } = await supabase
      .from('riwayat')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (findError) throw httpError(502, `Gagal memuat riwayat: ${findError.message}`)
    if (!current) throw httpError(404, 'Riwayat tidak ditemukan.')

    for (const table of ['riwayat', 'req_reject', 'req_pending']) {
      const { error } = await supabase.from(table).update(payload).eq('id', id)
      if (error) throw httpError(502, `Gagal memperbarui ${table}: ${error.message}`)
    }

    res.json({ history: { id, ...payload, status: 'Selesai' } })
  }),
)

/**
 * DELETE /api/history/:id — hapus entri riwayat beserta data induknya.
 */
router.delete(
  '/:id',
  requireAdmin,
  requireFeature('riwayat_superadmin', 'riwayat'),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)

    const { data: current, error: findError } = await supabase
      .from('riwayat')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (findError) throw httpError(502, `Gagal memuat riwayat: ${findError.message}`)
    if (!current) throw httpError(404, 'Riwayat tidak ditemukan.')

    for (const table of ['riwayat', 'req_reject', 'req_pending']) {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw httpError(502, `Gagal menghapus ${table}: ${error.message}`)
    }

    res.json({ ok: true })
  }),
)

export default router
