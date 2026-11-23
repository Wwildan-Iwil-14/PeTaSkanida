import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, AlertCircle, Info, Download, Trash2, FileText, UploadCloud, Database, FileSpreadsheet } from 'lucide-react'
import { api } from '../lib/api'
import { FIELD, getTodayISO, DB_TABLE_LABELS, saveTextFile, readImportFile } from '../lib/appConstants'
import { Panel } from '../components/ui'

function DatabasePage({ onNotice }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [days, setDays] = useState('30')
  const [busy, setBusy] = useState(false)
  const [exportTable, setExportTable] = useState('req_pending')
  const [csvBusy, setCsvBusy] = useState(false)

  const [importFile, setImportFile] = useState(null)
  const [importData, setImportData] = useState(null)
  const [looseRows, setLooseRows] = useState(null)
  const [importTable, setImportTable] = useState('req_pending')
  const [importDedupe, setImportDedupe] = useState(true)
  const [importError, setImportError] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [importBusy, setImportBusy] = useState(false)
  const fileInputRef = useRef(null)

  async function loadStats({ silent = false } = {}) {
    if (!silent) setLoading(true)
    setError('')
    try {
      const { stats: result } = await api.databaseStats()
      setStats(result)
    } catch (err) {
      setError(err.message || 'Gagal memuat statistik database.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    const refresh = () => {
      if (document.visibilityState === 'visible') loadStats({ silent: true })
    }
    const timer = window.setInterval(refresh, 30000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  async function handleBackup() {
    setBusy(true)
    try {
      const { backup } = await api.databaseBackup()
      saveTextFile(JSON.stringify(backup, null, 2), `peta-skanida-backup-${getTodayISO()}.json`, 'application/json')
      onNotice?.('Backup database berhasil diunduh.')
    } catch (err) {
      setError(err.message || 'Gagal membuat backup.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCsvExport() {
    setCsvBusy(true)
    setError('')
    try {
      const { csv, filename, count } = await api.databaseExportCsv(exportTable)
      saveTextFile(csv, filename, 'text/csv;charset=utf-8')
      onNotice?.(`${count.toLocaleString('id-ID')} baris ${exportTable} diekspor ke CSV.`)
    } catch (err) {
      setError(err.message || 'Gagal mengekspor CSV.')
    } finally {
      setCsvBusy(false)
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0] || null
    setImportFile(file)
    setImportData(null)
    setLooseRows(null)
    setImportError('')
    setImportResult(null)
    if (!file) return

    try {
      const text = await file.text()
      const isCsv = /\.csv$/i.test(file.name)
      const { data, looseRows: rows } = readImportFile(text, isCsv)

      if (data) {
        const known = Object.entries(data).filter(
          ([table, value]) => DB_TABLE_LABELS[table] && Array.isArray(value) && value.length,
        )
        if (!known.length) throw new Error('File tidak berisi tabel database yang dikenal.')
        setImportData(data)
      } else {
        setLooseRows(rows)
      }
    } catch (err) {
      setImportError(err.message || 'Gagal membaca file. Pastikan formatnya JSON atau CSV.')
    }
  }

  async function handleImport() {
    const data = importData || (looseRows ? { [importTable]: looseRows } : null)
    if (!data) {
      setImportError('Pilih file JSON atau CSV terlebih dahulu.')
      return
    }
    setImportBusy(true)
    setImportError('')
    setImportResult(null)
    try {
      const result = await api.databaseImport({ data, dedupe: importDedupe })
      setImportResult(result)
      onNotice?.(`${result.totalAdded.toLocaleString('id-ID')} baris berhasil diimpor.`)
      loadStats()
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setImportError(err.message || 'Gagal mengimpor data.')
    } finally {
      setImportBusy(false)
    }
  }

  function resetImport() {
    setImportFile(null)
    setImportData(null)
    setLooseRows(null)
    setImportError('')
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleClean() {
    const value = Number.parseInt(days, 10)
    if (!Number.isInteger(value) || value < 0) {
      setError('Umur log harus berupa angka 0 atau lebih.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await api.cleanScanLogs(value)
      onNotice?.(`${result.deleted || 0} log scan lama dihapus.`)
      loadStats()
    } catch (err) {
      setError(err.message || 'Gagal membersihkan log scan.')
    } finally {
      setBusy(false)
    }
  }

  const previewRows = importData
    ? Object.entries(importData).filter(([table, rows]) =>
        DB_TABLE_LABELS[table] && Array.isArray(rows) && rows.length,
      )
    : looseRows ? [[importTable, looseRows]] : []
  const ignoredTables = importData
    ? Object.keys(importData).filter(table => !DB_TABLE_LABELS[table] || table === 'admins')
    : []

  return <>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kelola Database</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pantau jumlah data, ekspor &amp; impor data, dan bersihkan log scan lama. Hanya untuk super admin.</p>
    </div>

    {error && (
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
        <AlertCircle size={18} className="shrink-0" /> {error}
      </div>
    )}

    <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {loading ? (
        <div className="col-span-full flex items-center justify-center rounded-2xl border border-slate-100 bg-white py-12 text-slate-400 dark:border-slate-800 dark:bg-slate-900"><Loader2 className="animate-spin text-indigo-400" size={26} /></div>
      ) : (stats?.tables || []).map(table => (
        <div key={table.table} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{table.table}</p>
            <Database size={16} className="text-indigo-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-800 dark:text-slate-100">{table.count.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{table.available ? 'baris data' : 'tabel belum dibuat'}</p>
        </div>
      ))}
    </div>

    {stats && (
      <p className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        Total {stats.totalRecords.toLocaleString('id-ID')} baris pada tabel kunjungan · {stats.admins} akun pengguna · diperiksa {new Date(stats.checkedAt).toLocaleString('id-ID')}
      </p>
    )}

    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Ekspor data" subtitle="Unduh data kunjungan sebagai backup JSON atau CSV per tabel.">
        <div className="space-y-5 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <FileText size={15} className="text-indigo-500" /> Backup lengkap (JSON)
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              Semua tabel kunjungan + profil pengguna tanpa password. File ini bisa dipakai lagi lewat menu Impor.
            </p>
            <button type="button" disabled={busy || csvBusy} onClick={handleBackup} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-600 disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Unduh Backup JSON
            </button>
          </div>

          <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <FileSpreadsheet size={15} className="text-emerald-500" /> Ekspor per tabel (CSV)
            </div>
            <label htmlFor="export-table" className="mb-1.5 mt-3 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Tabel</label>
            <div className="flex flex-wrap items-center gap-2">
              <select id="export-table" value={exportTable} onChange={e => setExportTable(e.target.value)} className={`${FIELD} max-w-[240px] py-2.5`}>
                {Object.entries(DB_TABLE_LABELS).filter(([key]) => key !== 'admins').map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button type="button" disabled={busy || csvBusy} onClick={handleCsvExport} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60">
                {csvBusy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Unduh CSV
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400 dark:text-slate-500">CSV menggunakan UTF-8 (BOM) agar karakter Indonesia tetap benar dibuka di Excel.</p>
          </div>
        </div>
      </Panel>

      <Panel title="Impor data" subtitle="Tambahkan data dari backup JSON atau CSV langsung lewat dashboard.">
        <div className="space-y-4 px-6 py-5">
          <label htmlFor="import-file" className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">File backup (.json) atau CSV (.csv)</label>
          <input
            ref={fileInputRef}
            id="import-file"
            type="file"
            accept=".json,.csv,application/json,text/csv"
            onChange={handleFileChange}
            className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-indigo-600 hover:file:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
          />

          {importFile && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">{importFile.name}</p>
                <p className="text-[11px] text-slate-400">{(importFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button type="button" onClick={resetImport} className="shrink-0 text-[11px] font-bold text-rose-500 hover:underline">Hapus</button>
            </div>
          )}

          {importError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertCircle size={15} className="mt-0.5 shrink-0" /> {importError}
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pratinjau isi file</p>
              {looseRows && (
                <div className="mb-3">
                  <label htmlFor="import-table" className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Impor ke tabel</label>
                  <select id="import-table" value={importTable} onChange={e => setImportTable(e.target.value)} className={`${FIELD} py-2.5`}>
                    {Object.entries(DB_TABLE_LABELS).filter(([key]) => key !== 'admins').map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                {previewRows.map(([table, rows]) => (
                  <div key={table} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-600 dark:text-slate-300">{DB_TABLE_LABELS[table]}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{rows.length.toLocaleString('id-ID')} baris</span>
                  </div>
                ))}
              </div>
              {ignoredTables.length > 0 && (
                <p className="mt-3 flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                  <Info size={13} className="mt-0.5 shrink-0" /> {ignoredTables.join(', ')} tidak diimpor (akun pengguna diurus terpisah).
                </p>
              )}
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={importDedupe} onChange={e => setImportDedupe(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400" />
            <span>Lewati data yang sudah ada <span className="text-slate-400">(berdasarkan nama, email, no. HP, tanggal, dan keperluan)</span></span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={!previewRows.length || importBusy || busy} onClick={handleImport} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-600 disabled:opacity-60">
              {importBusy ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />} Impor Sekarang
            </button>
            {previewRows.length > 0 && (
              <button type="button" disabled={importBusy} onClick={resetImport} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Batal</button>
            )}
          </div>

          {importResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <p className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={15} /> Import selesai — {importResult.totalAdded.toLocaleString('id-ID')} baris ditambahkan, {importResult.totalSkipped.toLocaleString('id-ID')} dilewati.
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-emerald-700/80 dark:text-emerald-300/80">
                {importResult.results.map(item => (
                  <div key={item.table} className="flex justify-between gap-2">
                    <span>{item.table}</span>
                    <span className="font-bold">+{item.added} / −{item.skipped}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-emerald-700/70 dark:text-emerald-300/70">
                ID baru dibuat otomatis oleh database agar tidak bentrok dengan data lama, sehingga kode tiket hasil impor ikut menyesuaikan.
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
                Jika ada baris yang gagal selain duplikat, proses berhenti dengan pesan error dan sebagian data mungkin sudah tersimpan.
              </p>
            </div>
          )}
        </div>
      </Panel>
    </div>

    <div className="mt-5">
      <Panel title="Bersihkan log scan" subtitle="Hapus catatan scan yang lebih lama dari jumlah hari yang ditentukan.">
        <div className="px-6 py-5">
          <label htmlFor="clean-days" className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">Lebih lama dari (hari)</label>
          <div className="flex flex-wrap items-center gap-2">
            <input id="clean-days" type="number" min="0" max="3650" value={days} onChange={e => setDays(e.target.value)} className={`${FIELD} max-w-[140px]`} />
            <button type="button" disabled={busy || importBusy} onClick={handleClean} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-xs font-bold text-white transition hover:bg-rose-600 disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Bersihkan
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400 dark:text-slate-500">Hanya log scan yang dihapus. Data tamu dan riwayat kunjungan tidak tersentuh.</p>
        </div>
      </Panel>
    </div>
  </>
}

export { DatabasePage }
