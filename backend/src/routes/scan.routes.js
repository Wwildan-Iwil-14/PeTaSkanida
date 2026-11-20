import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/httpError.js'
import { requireAdmin } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimit.js'

const router = Router()

// Satu HP bisa memindai beberapa tamu per menit; batasi agar tidak disalahgunakan.
const scanLimiter = createRateLimiter({ windowMs: 60_000, max: 90 })

// Simpan sementara di memori bila migration scan_logs belum dijalankan di Supabase,
// sehingga endpoint tetap bisa diuji / dipakai tanpa terhambat 502.
const memoryLogs = []
let memoryCounter = 0

const GUEST_FIELDS = 'id, nama, tujuan, keperluan, jumlah, no_hp, tanggal, waktu'

/** Ambil id request dari isi QR/barcode, mis. "REQ-007" → 7. */
function parseKode(value) {
  const match = /REQ-(\d+)/i.exec(String(value || ''))
  return match ? Number.parseInt(match[1], 10) : null
}

/** Tentukan status tamu saat discan (logika sama dengan GET /api/requests). */
async function resolveStatus(id) {
  const [acc, rej, his] = await Promise.all([
    supabase.from('req_acc').select('id').eq('id', id).maybeSingle(),
    supabase.from('req_reject').select('id').eq('id', id).maybeSingle(),
    supabase.from('riwayat').select('id').eq('id', id).maybeSingle(),
  ])
  const failure = acc.error || rej.error || his.error
  if (failure) throw httpError(502, `Gagal memeriksa status tamu: ${failure.message}`)

  if (acc.data) return 'Diterima'
  if (rej.data) return 'Ditolak'
  if (his.data) return 'Selesai'
  return 'Pending'
}

const HASIL_BY_STATUS = {
  Diterima: 'valid',
  Pending: 'pending',
  Ditolak: 'ditolak',
  Selesai: 'selesai',
}

/**
 * POST /api/scans
 * Dipanggil HP petugas setelah memindai QR / barcode tamu.
 * Body: { kode: "REQ-007", deviceId?: "..." }
 */
router.post(
  '/',
  requireAdmin,
  scanLimiter,
  asyncHandler(async (req, res) => {
    const kode = String(req.body?.kode || '').trim().slice(0, 64)
    const deviceId = String(req.body?.deviceId || '').trim().slice(0, 64) || null
    if (!kode) throw httpError(422, 'Kode QR / barcode kosong.')

    const id = parseKode(kode)
    let guest = null
    let status = null

    if (id) {
      const { data, error } = await supabase
        .from('req_pending')
        .select(GUEST_FIELDS)
        .eq('id', id)
        .maybeSingle()
      if (error) throw httpError(502, `Gagal memuat tamu: ${error.message}`)
      guest = data
    }

    if (guest) status = await resolveStatus(guest.id)
    const hasil = guest ? HASIL_BY_STATUS[status] : 'tidak_ditemukan'

    let logRecord = null
    const { data: log, error: logError } = await supabase
      .from('scan_logs')
      .insert({
        request_id: guest ? guest.id : null,
        kode: id ? `REQ-${String(id).padStart(3, '0')}` : kode,
        hasil,
        scanned_by: req.admin.nama || req.admin.email,
        device_id: deviceId,
      })
      .select('id, scanned_at')
      .single()

    if (logError) {
      if (logError.code === 'PGRST205' || /does not exist|could not find/i.test(logError.message)) {
        memoryCounter += 1
        logRecord = {
          id: Date.now() + memoryCounter,
          scanned_at: new Date().toISOString(),
        }
        memoryLogs.unshift({
          id: logRecord.id,
          request_id: guest ? guest.id : null,
          kode: id ? `REQ-${String(id).padStart(3, '0')}` : kode,
          hasil,
          scanned_by: req.admin.nama || req.admin.email,
          device_id: deviceId,
          scanned_at: logRecord.scanned_at,
          guest,
        })
      } else {
        throw httpError(
          502,
          `Gagal mencatat scan: ${logError.message}. ` +
            'Pastikan migration 20261120000001_create_scan_logs.sql sudah dijalankan.',
        )
      }
    } else {
      logRecord = log
    }

    res.status(201).json({
      scan: {
        id: logRecord.id,
        scanned_at: logRecord.scanned_at,
        kode: id ? `REQ-${String(id).padStart(3, '0')}` : kode,
        hasil,
        status,
        scanned_by: req.admin.nama || req.admin.email,
        guest,
      },
    })
  }),
)

/**
 * GET /api/scans?limit=20
 * Daftar scan terbaru beserta data tamu. Dipakai dashboard admin (laptop).
 */
router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100)

    const { data, error } = await supabase
      .from('scan_logs')
      .select(`id, request_id, kode, hasil, scanned_by, device_id, scanned_at, req_pending ( ${GUEST_FIELDS} )`)
      .order('id', { ascending: false })
      .limit(limit)

    if (error) {
      if (error.code === 'PGRST205' || /does not exist|could not find/i.test(error.message)) {
        return res.json({ scans: memoryLogs.slice(0, limit) })
      }
      throw httpError(502, `Gagal memuat riwayat scan: ${error.message}`)
    }

    const scans = (data || []).map(({ req_pending: guest, ...row }) => ({ ...row, guest: guest || null }))
    res.json({ scans })
  }),
)

export default router
