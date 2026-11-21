import express, { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { httpError } from '../lib/httpError.js'
import { requireAdmin, requireFeature, requireRole } from '../middleware/auth.js'

const router = Router()

// Pengelolaan database khusus super admin.
router.use(requireAdmin, requireRole('super_admin'), requireFeature('database'))

const TABLES = ['req_pending', 'req_acc', 'req_reject', 'riwayat', 'scan_logs']
const DUPLICATE_KEY = '23505'

const VISIT_COLUMNS = [
  'nama', 'email', 'no_hp', 'tujuan', 'keperluan', 'tanggal', 'waktu', 'jumlah',
  'surat_tugas_url', 'surat_tugas_drive_id', 'surat_tugas_nama',
]

/** Kolom yang boleh ditulis saat import (whitelist, bukan dari file sembarangan). */
const IMPORT_COLUMNS = {
  req_pending: [...VISIT_COLUMNS, 'dihubungi', 'dihubungi_at'],
  req_acc: VISIT_COLUMNS,
  req_reject: VISIT_COLUMNS,
  riwayat: VISIT_COLUMNS,
  scan_logs: ['request_id', 'kode', 'hasil', 'scanned_by', 'device_id', 'scanned_at'],
}

const CHILD_TABLES = ['req_acc', 'req_reject', 'riwayat']
const MAX_ROWS_PER_TABLE = 2000
const MAX_TOTAL_ROWS = 5000
const CHUNK_SIZE = 100

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

// ---- Ekspor CSV per tabel -------------------------------------------------

function csvCell(value) {
  if (value === null || value === undefined) return ''
  const raw = Array.isArray(value) ? value.join(', ') : String(value)
  // Cegah CSV/Excel formula injection saat file dibuka di spreadsheet.
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replace(/"/g, '""')}"`
}

/**
 * GET /api/admin/database/export/csv?table=req_pending
 * Ekspor satu tabel sebagai CSV (UTF-8 + BOM agar Excel tidak merusak huruf Indonesia).
 */
router.get(
  '/export/csv',
  asyncHandler(async (req, res) => {
    const table = String(req.query.table || '')
    if (!TABLES.includes(table)) {
      throw httpError(400, `Tabel "${table}" tidak dikenal.`)
    }

    const { data, error } = await supabase.from(table).select('*').order('id', { ascending: true })
    if (error) {
      if (error.code === 'PGRST205' || /does not exist|could not find/i.test(error.message)) {
        return res.json({ table, filename: `peta-${table}.csv`, count: 0, csv: '' })
      }
      throw httpError(502, `Gagal mengekspor ${table}: ${error.message}`)
    }

    const columns = [...new Set([
      'id',
      ...(data || []).flatMap(row => Object.keys(row)),
      ...(IMPORT_COLUMNS[table] || []),
    ])]
    const lines = [
      columns.map(csvCell).join(','),
      ...(data || []).map(row => columns.map(column => csvCell(row[column])).join(',')),
    ]

    res.json({
      table,
      filename: `peta-${table}-${new Date().toISOString().slice(0, 10)}.csv`,
      count: (data || []).length,
      csv: `\uFEFF${lines.join('\r\n')}`,
    })
  }),
)

// ---- Import data ----------------------------------------------------------

/** Bagi array menjadi beberapa chunk agar request ke PostgREST tidak terlalu besar. */
function chunkArray(items, size) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

/** Kunci alami untuk mendeteksi data tamu yang sudah ada (tanpa bergantung pada ID). */
function visitKey(row) {
  return ['nama', 'email', 'no_hp', 'tanggal', 'keperluan']
    .map(column => String(row?.[column] ?? '').trim().toLowerCase())
    .join('|')
}

function scanKey(row) {
  return ['kode', 'hasil', 'scanned_at', 'device_id']
    .map(column => String(row?.[column] ?? '').trim().toLowerCase())
    .join('|')
}

/** Ambil hanya kolom yang dikenal, normalisasi tipe, dan simpan ID asli untuk dipetakan. */
function normalizeRow(table, raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  const row = { __oldId: raw.id == null ? null : String(raw.id) }
  if (table === 'scan_logs') {
    row.__oldRequestId = raw.request_id == null ? null : String(raw.request_id)
  }

  for (const column of IMPORT_COLUMNS[table]) {
    const value = raw[column]
    if (value === undefined || value === null || value === '') {
      row[column] = column === 'jumlah' ? 1 : null
      continue
    }
    if (column === 'jumlah') {
      const parsed = Number.parseInt(value, 10)
      row[column] = Number.isFinite(parsed) ? parsed : 1
    } else if (column === 'dihubungi') {
      row[column] = value === true || value === 'true' || value === 1 || value === '1'
    } else if (column === 'surat_tugas_url') {
      // Hanya terima tautan http(s); cegah javascript: dari file impor.
      const url = String(value).trim()
      row[column] = /^https?:\/\//i.test(url) ? url : null
    } else if (typeof value === 'string') {
      row[column] = value.trim()
    } else {
      row[column] = value
    }
  }

  return row
}

function toDbRow(row) {
  const { __oldId, __oldRequestId, ...rest } = row
  return rest
}

/** Insert banyak baris; baris yang bertabrakan (23505) dihitung sebagai dilewati. */
async function insertRows(table, rows) {
  let added = 0
  let skipped = 0

  for (const chunk of chunkArray(rows, CHUNK_SIZE)) {
    const { error } = await supabase.from(table).insert(chunk.map(toDbRow))
    if (!error) {
      added += chunk.length
      continue
    }
    if (error.code !== DUPLICATE_KEY) {
      throw httpError(502, `Gagal menyimpan ${table}: ${error.message}`)
    }
    // Sebagian baris bertabrakan — coba satu per satu supaya sisanya tetap masuk.
    for (const row of chunk) {
      const { error: singleError } = await supabase.from(table).insert(toDbRow(row))
      if (!singleError) added += 1
      else if (singleError.code === DUPLICATE_KEY) skipped += 1
      else throw httpError(502, `Gagal menyimpan ${table}: ${singleError.message}`)
    }
  }

  return { added, skipped }
}

/**
 * POST /api/admin/database/import
 * Terima backup JSON / baris CSV lalu tambahkan ke tabel.
 *
 * ID lama tidak dipakai langsung (sequence Postgres tidak ikut bergeser kalau
 * ID eksplisit disisipkan). ID baru dibuat database, lalu ID relasi anak
 * (req_acc / req_reject / riwayat / scan_logs) dipetakan ke ID orang tuanya.
 */
router.post(
  '/import',
  // Body backup bisa jauh lebih besar dari batas default 100kb.
  express.json({ limit: '10mb' }),
  asyncHandler(async (req, res) => {
    const payload = req.body || {}
    const rawData = payload.data
    const dedupe = payload.dedupe !== false

    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
      throw httpError(422, 'Format file tidak dikenali. Pilih backup JSON atau CSV yang valid.')
    }

    const prepared = {}
    let totalRows = 0
    for (const table of TABLES) {
      const rows = rawData[table]
      if (rows === undefined || rows === null) continue
      if (!Array.isArray(rows)) throw httpError(422, `Data tabel ${table} harus berupa daftar baris.`)
      if (rows.length > MAX_ROWS_PER_TABLE) {
        throw httpError(422, `Tabel ${table} melebihi batas ${MAX_ROWS_PER_TABLE} baris per import.`)
      }
      totalRows += rows.length
      prepared[table] = rows.map(row => normalizeRow(table, row)).filter(Boolean)
    }

    if (totalRows > MAX_TOTAL_ROWS) {
      throw httpError(422, `Total baris melebihi batas ${MAX_TOTAL_ROWS} per import.`)
    }

    const hasRows = Object.values(prepared).some(rows => rows.length > 0)
    if (!hasRows) throw httpError(422, 'File tidak berisi baris data yang bisa diimpor.')

    // Kumpulkan kunci data yang sudah ada supaya import ulang tidak menimbulkan duplikat.
    const visitKeys = new Set()
    const visitIds = new Map()
    const scanKeys = new Set()
    if (dedupe) {
      const [{ data: existingVisits, error: visitError }, { data: existingScans, error: scanError }] =
        await Promise.all([
          supabase.from('req_pending').select('id, nama, email, no_hp, tanggal, keperluan'),
          supabase.from('scan_logs').select('kode, hasil, scanned_at, device_id'),
        ])
      if (visitError) throw httpError(502, `Gagal memeriksa data lama: ${visitError.message}`)
      if (scanError) throw httpError(502, `Gagal memeriksa log lama: ${scanError.message}`)

      for (const row of existingVisits || []) {
        visitKeys.add(visitKey(row))
        visitIds.set(visitKey(row), row.id)
      }
      for (const row of existingScans || []) scanKeys.add(scanKey(row))
    }

    const results = []
    const idMap = new Map() // ID lama (string) -> ID baru (number)

    // 1) Induk dulu: ID-nya dibuat database, lalu dipetakan dari ID file.
    const pendingRows = (prepared.req_pending || []).filter(row => {
      if (!dedupe) return true
      const key = visitKey(row)
      if (visitKeys.has(key)) return false
      visitKeys.add(key)
      return true
    })

    let pendingAdded = 0
    for (const chunk of chunkArray(pendingRows, CHUNK_SIZE)) {
      const { data: inserted, error } = await supabase
        .from('req_pending')
        .insert(chunk.map(toDbRow))
        .select('id')
      if (error) throw httpError(502, `Gagal menyimpan req_pending: ${error.message}`)
      ;(inserted || []).forEach((saved, index) => {
        pendingAdded += 1
        const oldId = chunk[index]?.__oldId
        if (oldId != null) idMap.set(oldId, saved.id)
        visitIds.set(visitKey(chunk[index]), saved.id)
      })
    }
    results.push({
      table: 'req_pending',
      added: pendingAdded,
      skipped: (prepared.req_pending || []).length - pendingAdded,
    })

    /** Pastikan orang tua ada; kalau tidak, buat dari kolom baris anak itu sendiri. */
    async function ensureParent(row) {
      if (row.__oldId != null && idMap.has(row.__oldId)) return idMap.get(row.__oldId)

      const key = visitKey(row)
      if (dedupe && visitKeys.has(key) && visitIds.has(key)) return visitIds.get(key)

      const parent = toDbRow({
        ...Object.fromEntries(VISIT_COLUMNS.map(column => [column, row[column]])),
        dihubungi: false,
        dihubungi_at: null,
      })
      const { data: created, error } = await supabase.from('req_pending').insert(parent).select('id').single()
      if (error) throw httpError(502, `Gagal membuat data tamu untuk relasi: ${error.message}`)
      visitKeys.add(key)
      visitIds.set(key, created.id)
      if (row.__oldId != null) idMap.set(row.__oldId, created.id)
      return created.id
    }

    // 2) Tabel bayangan: id harus sama dengan id req_pending (FK CASCADE).
    for (const table of CHILD_TABLES) {
      const rows = prepared[table] || []
      const mapped = []
      for (const row of rows) {
        const parentId = await ensureParent(row)
        if (!parentId) continue
        mapped.push({ ...row, id: parentId })
      }
      const { added, skipped } = await insertRows(table, mapped)
      results.push({ table, added, skipped: skipped + rows.length - mapped.length })
    }

    // 3) Log scan: request_id mengikuti ID induk yang baru.
    const scanRows = prepared.scan_logs || []
    const mappedScans = []
    for (const row of scanRows) {
      if (dedupe && scanKeys.has(scanKey(row))) continue
      scanKeys.add(scanKey(row))
      const requestId = row.__oldRequestId != null
        ? (idMap.get(row.__oldRequestId) ?? null)
        : null
      const dbRow = toDbRow(row)
      delete dbRow.id
      mappedScans.push({ ...dbRow, request_id: requestId })
    }
    const scanResult = await insertRows('scan_logs', mappedScans)
    results.push({
      table: 'scan_logs',
      added: scanResult.added,
      skipped: scanResult.skipped + scanRows.length - mappedScans.length,
    })

    res.json({
      results,
      totalAdded: results.reduce((sum, item) => sum + item.added, 0),
      totalSkipped: results.reduce((sum, item) => sum + item.skipped, 0),
      dedupe,
      skippedTables: Object.keys(rawData).filter(table => !TABLES.includes(table)),
    })
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
