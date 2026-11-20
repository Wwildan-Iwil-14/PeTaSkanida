import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/httpError.js'
import { requireAdmin, requireFeature, requireRole } from '../middleware/auth.js'

const router = Router()

// Pengelolaan database khusus super admin.
router.use(requireAdmin, requireRole('super_admin'), requireFeature('database'))

const TABLES = ['req_pending', 'req_acc', 'req_reject', 'riwayat', 'scan_logs']

/** Hitung baris satu tabel; tabel yang belum ada dianggap 0. */
async function countRows(table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) {
    if (error.code === 'PGRST205' || /does not exist|could not find/i.test(error.message)) {
      return { table, count: 0, available: false }
    }
    throw httpError(502, `Gagal menghitung ${table}: ${error.message}`)
  }
  return { table, count: count || 0, available: true }
}

/**
 * GET /api/admin/database/stats
 * Ringkasan jumlah data tiap tabel + akun pengguna.
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [tables, admins] = await Promise.all([
      Promise.all(TABLES.map(countRows)),
      countRows('admins'),
    ])

    const totalRecords = tables.reduce((sum, item) => sum + item.count, 0)

    res.json({
      stats: {
        tables,
        admins: admins.count,
        totalRecords,
        checkedAt: new Date().toISOString(),
      },
    })
  }),
)

/**
 * GET /api/admin/database/backup
 * Ekspor seluruh data inti sebagai JSON. Dipakai tombol "Unduh Backup".
 */
router.get(
  '/backup',
  asyncHandler(async (req, res) => {
    const backup = {
      meta: {
        aplikasi: 'PeTa SKANIDA',
        dibuatPada: new Date().toISOString(),
        dibuatOleh: req.admin.nama || req.admin.email,
      },
      data: {},
    }

    for (const table of TABLES) {
      const { data, error } = await supabase.from(table).select('*').order('id', { ascending: true })
      if (error) {
        if (error.code === 'PGRST205' || /does not exist|could not find/i.test(error.message)) {
          backup.data[table] = []
          continue
        }
        throw httpError(502, `Gagal mengekspor ${table}: ${error.message}`)
      }
      backup.data[table] = data || []
    }

    // Profil pengguna saja — tanpa data kredensial (password diurus Supabase Auth).
    const { data: admins, error: adminError } = await supabase
      .from('admins')
      .select('id, email, nama, role, features, created_at')
      .order('id', { ascending: true })

    if (adminError) throw httpError(502, `Gagal mengekspor pengguna: ${adminError.message}`)
    backup.data.admins = admins || []

    res.json({ backup })
  }),
)

/**
 * POST /api/admin/database/scan-logs/clean
 * Hapus log scan yang lebih lama dari N hari (default 30).
 */
router.post(
  '/scan-logs/clean',
  asyncHandler(async (req, res) => {
    const requested = Number.parseInt(req.body?.days, 10)
    const days = Number.isInteger(requested) && requested >= 0 ? Math.min(requested, 3650) : 30
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { error, count } = await supabase
      .from('scan_logs')
      .delete({ count: 'exact' })
      .lt('scanned_at', cutoff)

    if (error) {
      if (error.code === 'PGRST205' || /does not exist|could not find/i.test(error.message)) {
        return res.json({ deleted: 0, days, cutoff, message: 'Tabel scan_logs belum tersedia.' })
      }
      throw httpError(502, `Gagal membersihkan log scan: ${error.message}`)
    }

    res.json({ deleted: count || 0, days, cutoff })
  }),
)

export default router
