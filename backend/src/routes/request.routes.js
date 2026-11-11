import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/httpError.js'
import { validateRequestPayload } from '../lib/validate.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

const DUPLICATE_KEY = '23505'

const parseId = value => {
  const id = Number.parseInt(value, 10)
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, 'ID request tidak valid.')
  return id
}

const toRecord = row => ({
  id: row.id,
  nama: row.nama,
  email: row.email,
  no_hp: row.no_hp,
  tujuan: row.tujuan,
  keperluan: row.keperluan,
  tanggal: row.tanggal,
  waktu: row.waktu,
  jumlah: row.jumlah,
})

/**
 * POST /api/requests
 * Dipakai halaman tamu untuk mengajukan permintaan kunjungan.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { payload, errors } = validateRequestPayload(req.body)
    if (errors.length > 0) throw httpError(422, errors.join(' '))

    const { data, error } = await supabase
      .from('req_pending')
      .insert(payload)
      .select('id, nama, tanggal, waktu, jumlah')
      .single()

    if (error) throw httpError(502, `Gagal menyimpan permintaan: ${error.message}`)

    res.status(201).json({ request: data })
  }),
)

/**
 * GET /api/requests
 * Daftar semua request beserta statusnya (Pending / Diterima / Ditolak).
 */
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [pendingRes, accRes, rejectRes] = await Promise.all([
      supabase.from('req_pending').select('*').order('id', { ascending: false }),
      supabase.from('req_acc').select('id'),
      supabase.from('req_reject').select('id'),
    ])

    const failure = pendingRes.error || accRes.error || rejectRes.error
    if (failure) throw httpError(502, `Gagal memuat data: ${failure.message}`)

    const acceptedIds = new Set((accRes.data || []).map(row => row.id))
    const rejectedIds = new Set((rejectRes.data || []).map(row => row.id))

    const requests = (pendingRes.data || []).map(row => ({
      ...row,
      status: acceptedIds.has(row.id)
        ? 'Diterima'
        : rejectedIds.has(row.id)
          ? 'Ditolak'
          : 'Pending',
    }))

    res.json({ requests })
  }),
)

/**
 * POST /api/requests/:id/approve
 * Admin menyetujui request: dicatat di req_acc dan riwayat.
 */
router.post(
  '/:id/approve',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const record = await loadPendingRecord(id)

    const { error: accError } = await supabase.from('req_acc').insert(record)
    if (accError && accError.code !== DUPLICATE_KEY) {
      throw httpError(502, `Gagal menyetujui request: ${accError.message}`)
    }

    const { error: historyError } = await supabase.from('riwayat').insert(record)
    if (historyError && historyError.code !== DUPLICATE_KEY) {
      throw httpError(502, `Gagal menyimpan riwayat: ${historyError.message}`)
    }

    res.json({ request: { ...record, status: 'Diterima' } })
  }),
)

/**
 * POST /api/requests/:id/reject
 * Admin menolak request: dicatat di req_reject dan riwayat.
 */
router.post(
  '/:id/reject',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const record = await loadPendingRecord(id)

    const { error: rejectError } = await supabase.from('req_reject').insert(record)
    if (rejectError && rejectError.code !== DUPLICATE_KEY) {
      throw httpError(502, `Gagal menolak request: ${rejectError.message}`)
    }

    const { error: historyError } = await supabase.from('riwayat').insert(record)
    if (historyError && historyError.code !== DUPLICATE_KEY) {
      throw httpError(502, `Gagal menyimpan riwayat: ${historyError.message}`)
    }

    res.json({ request: { ...record, status: 'Ditolak' } })
  }),
)

async function loadPendingRecord(id) {
  const { data, error } = await supabase
    .from('req_pending')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw httpError(502, `Gagal memuat request: ${error.message}`)
  if (!data) throw httpError(404, 'Request tidak ditemukan.')

  return toRecord(data)
}

export default router
