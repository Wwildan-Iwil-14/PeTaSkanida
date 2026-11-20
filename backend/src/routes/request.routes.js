import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/httpError.js'
import { validateRequestPayload } from '../lib/validate.js'
import { uploadSuratTugas as sendToStorage } from '../lib/storage.js'
import { uploadSuratTugas as uploadSuratTugasMiddleware } from '../middleware/upload.js'
import { requireAdmin, requireFeature } from '../middleware/auth.js'

const router = Router()

const DUPLICATE_KEY = '23505'

const parseId = value => {
  const id = Number.parseInt(value, 10)
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, 'ID request tidak valid.')
  return id
}

async function insertIfMissing(table, record) {
  const { error } = await supabase.from(table).insert(record)
  if (error && error.code !== DUPLICATE_KEY) {
    throw httpError(502, `Gagal menyimpan ke ${table}: ${error.message}`)
  }
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
  // Hanya disertakan bila ada file, supaya alur approve/reject tetap jalan
  // sebelum migration dijalankan / untuk request tanpa surat tugas.
  ...(row.surat_tugas_url
    ? {
        surat_tugas_url: row.surat_tugas_url,
        surat_tugas_drive_id: row.surat_tugas_drive_id || null,
        surat_tugas_nama: row.surat_tugas_nama || null,
      }
    : {}),
})

/**
 * POST /api/requests
 * Dipakai halaman tamu untuk mengajukan permintaan kunjungan.
 */
router.post(
  '/',
  uploadSuratTugasMiddleware,
  asyncHandler(async (req, res) => {
    const { payload, errors } = validateRequestPayload(req.body)
    if (errors.length > 0) throw httpError(422, errors.join(' '))

    // Surat tugas bersifat opsional — hanya diunggah bila ada file.
    let uploadedFile = null
    if (req.file) {
      uploadedFile = await sendToStorage({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        nama: payload.nama,
      })
      payload.surat_tugas_url = uploadedFile.url
      payload.surat_tugas_drive_id = uploadedFile.id
      payload.surat_tugas_nama = uploadedFile.name
    }

    let { data, error } = await supabase
      .from('req_pending')
      .insert(payload)
      .select('id, nama, tanggal, waktu, jumlah, surat_tugas_url, surat_tugas_nama')
      .single()

    // Database belum ter-migration → simpan request tanpa metadata file
    // agar tamu tetap bisa mengirim. Tautan tetap dikembalikan ke frontend.
    if (error && /surat_tugas/i.test(error.message) && /does not exist|could not find/i.test(error.message)) {
      console.warn(
        '[backend] Kolom surat_tugas belum ada. Jalankan ' +
          'database/migrations/20261120000000_add_surat_tugas_columns.sql di Supabase SQL Editor.',
      )
      const {
        surat_tugas_url,
        surat_tugas_drive_id,
        surat_tugas_nama,
        ...basePayload
      } = payload
      ;({ data, error } = await supabase
        .from('req_pending')
        .insert(basePayload)
        .select('id, nama, tanggal, waktu, jumlah')
        .single())
    }

    if (error) throw httpError(502, `Gagal menyimpan permintaan: ${error.message}`)

    res.status(201).json({
      request: data,
      // Email tujuan berasal dari konfigurasi SURAT_TUGAS_EMAIL (sementara
      // rubikesper@gmail.com, nanti diganti email sekolah lewat .env).
      ...(uploadedFile
        ? {
            suratTugas: {
              url: uploadedFile.url,
              nama: uploadedFile.name,
              tujuanEmail: uploadedFile.tujuanEmail,
            },
          }
        : {}),
      ...(uploadedFile && !data?.surat_tugas_url
        ? {
            warning:
              'Surat tugas berhasil diunggah ke penyimpanan, tetapi database belum menyimpan tautannya. ' +
              'Jalankan migration 20261120000000_add_surat_tugas_columns.sql di Supabase SQL Editor.',
          }
        : {}),
    })
  }),
)

/**
 * POST /api/requests/admin
 * Admin menambah tamu langsung dengan status tertentu (default Diterima),
 * sehingga langsung muncul di Kelola Tamu / Riwayat Kunjungan.
 */
router.post(
  '/admin',
  requireAdmin,
  requireFeature('tamu'),
  asyncHandler(async (req, res) => {
    const { payload, errors } = validateRequestPayload(req.body)
    if (errors.length > 0) throw httpError(422, errors.join(' '))

    const status = ['Pending', 'Diterima', 'Ditolak', 'Selesai'].includes(req.body?.status)
      ? req.body.status
      : 'Diterima'

    const { data: created, error } = await supabase
      .from('req_pending')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw httpError(502, `Gagal menyimpan tamu: ${error.message}`)

    const record = toRecord(created)
    if (status === 'Diterima') {
      const { error: accError } = await supabase.from('req_acc').insert(record)
      if (accError) throw httpError(502, `Gagal menyimpan kunjungan: ${accError.message}`)
    } else if (status === 'Ditolak') {
      await insertIfMissing('req_reject', record)
      await insertIfMissing('riwayat', record)
    } else if (status === 'Selesai') {
      await insertIfMissing('riwayat', record)
    }

    res.status(201).json({ request: { ...record, status } })
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
    const [pendingRes, accRes, rejectRes, historyRes] = await Promise.all([
      supabase.from('req_pending').select('*').order('id', { ascending: false }),
      supabase.from('req_acc').select('id'),
      supabase.from('req_reject').select('id'),
      supabase.from('riwayat').select('id'),
    ])

    const failure = pendingRes.error || accRes.error || rejectRes.error || historyRes.error
    if (failure) throw httpError(502, `Gagal memuat data: ${failure.message}`)

    const acceptedIds = new Set((accRes.data || []).map(row => row.id))
    const rejectedIds = new Set((rejectRes.data || []).map(row => row.id))
    const completedIds = new Set((historyRes.data || []).map(row => row.id))

    // Urutan prioritas: Diterima (masih aktif) → Ditolak → Selesai (arsip).
    // Tamu yang sudah selesai otomatis hilang dari Kelola Tamu / Kunjungan
    // Terkini karena barisnya dihapus dari req_acc saat diselesaikan.
    const requests = (pendingRes.data || []).map(row => ({
      ...row,
      dihubungi: Boolean(row.dihubungi),
      dihubungi_at: row.dihubungi_at || null,
      status: acceptedIds.has(row.id)
        ? 'Diterima'
        : rejectedIds.has(row.id)
          ? 'Ditolak'
          : completedIds.has(row.id)
            ? 'Selesai'
            : 'Pending',
    }))

    res.json({ requests })
  }),
)

/**
 * POST /api/requests/:id/approve
 * Admin menyetujui request: dicatat di req_acc sebagai kunjungan aktif.
 * Riwayat baru diisi saat admin menandai kunjungan selesai.
 */
router.post(
  '/:id/approve',
  requireAdmin,
  requireFeature('request'),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const record = await loadPendingRecord(id)

    const { error: accError } = await supabase.from('req_acc').insert(record)
    if (accError && accError.code !== DUPLICATE_KEY) {
      throw httpError(502, `Gagal menyetujui request: ${accError.message}`)
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
  requireFeature('request'),
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

/**
 * POST /api/requests/:id/complete
 * Admin menandai kunjungan selesai: data diarsipkan ke riwayat lalu
 * dihapus dari req_acc. Statusnya menjadi "Selesai" sehingga hilang dari
 * Kelola Tamu / Kunjungan Terkini dan muncul di Riwayat Kunjungan.
 */
router.post(
  '/:id/complete',
  requireAdmin,
  requireFeature('tamu'),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const record = await loadPendingRecord(id)

    const { data: accepted, error: accError } = await supabase
      .from('req_acc')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (accError) throw httpError(502, `Gagal memeriksa status kunjungan: ${accError.message}`)
    if (!accepted) throw httpError(409, 'Hanya tamu dengan status Diterima yang dapat diselesaikan.')

    // Data lama bisa saja sudah memiliki baris riwayat dari alur sebelumnya,
    // jadi duplikat diabaikan.
    const { error: historyError } = await supabase.from('riwayat').insert(record)
    if (historyError && historyError.code !== DUPLICATE_KEY) {
      throw httpError(502, `Gagal menyimpan riwayat: ${historyError.message}`)
    }

    const { error: removeError } = await supabase.from('req_acc').delete().eq('id', id)
    if (removeError) throw httpError(502, `Gagal menyelesaikan kunjungan: ${removeError.message}`)

    res.json({ request: { ...record, status: 'Selesai' } })
  }),
)

/**
 * PATCH /api/requests/:id/contacted
 * Admin menandai tamu sudah / belum dihubungi.
 */
router.patch(
  '/:id/contacted',
  requireAdmin,
  requireFeature('tamu'),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const { dihubungi } = req.body || {}

    if (typeof dihubungi !== 'boolean') {
      throw httpError(422, 'Nilai "dihubungi" harus berupa boolean (true / false).')
    }

    const { data, error } = await supabase
      .from('req_pending')
      .update({
        dihubungi,
        dihubungi_at: dihubungi ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select('id, dihubungi, dihubungi_at')
      .maybeSingle()

    if (error) throw httpError(502, `Gagal memperbarui status kontak: ${error.message}`)
    if (!data) throw httpError(404, 'Request tidak ditemukan.')

    res.json({
      request: {
        id: data.id,
        dihubungi: Boolean(data.dihubungi),
        dihubungi_at: data.dihubungi_at || null,
      },
    })
  }),
)

/**
 * PATCH /api/requests/:id — edit data tamu.
 * Perubahan disamakan ke tabel req_pending dan tabel bayangannya.
 */
router.patch(
  '/:id',
  requireAdmin,
  requireFeature('tamu'),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)
    const { payload, errors } = validateRequestPayload(req.body)
    if (errors.length > 0) throw httpError(422, errors.join(' '))

    const { data: current, error: findError } = await supabase
      .from('req_pending')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (findError) throw httpError(502, `Gagal memuat request: ${findError.message}`)
    if (!current) throw httpError(404, 'Request tidak ditemukan.')

    for (const table of ['req_pending', 'req_acc', 'req_reject', 'riwayat']) {
      const { error } = await supabase.from(table).update(payload).eq('id', id)
      if (error) throw httpError(502, `Gagal memperbarui ${table}: ${error.message}`)
    }

    res.json({ request: { id, ...payload } })
  }),
)

/**
 * DELETE /api/requests/:id — hapus tamu beserta data terkait.
 * Baris req_acc / req_reject / riwayat ikut terhapus lewat ON DELETE CASCADE.
 */
router.delete(
  '/:id',
  requireAdmin,
  requireFeature('tamu'),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id)

    const { data: current, error: findError } = await supabase
      .from('req_pending')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (findError) throw httpError(502, `Gagal memuat request: ${findError.message}`)
    if (!current) throw httpError(404, 'Request tidak ditemukan.')

    const { error } = await supabase.from('req_pending').delete().eq('id', id)
    if (error) throw httpError(502, `Gagal menghapus request: ${error.message}`)

    res.json({ ok: true })
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
