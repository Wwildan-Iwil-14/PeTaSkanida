import { useEffect, useRef, useState } from 'react'
import { Eye, ChevronDown, Download, UserPlus, FileText, FileSpreadsheet } from 'lucide-react'
import { downloadCsv, downloadXlsx, openWebView } from '../lib/export'
import { useTablePaging, TablePaging } from '../lib/pagination'
import { RECORD_FIELDS } from '../lib/appConstants'
import { Panel, FormModal, ConfirmModal, RequestTable, SearchFilter } from '../components/ui'

function HistoryPage({ title, subtitle, visibleRequests, query, onQueryChange, filter, onFilterChange, onCreate, onUpdate, onDelete, canPrint = false, canEdit = true, onNotice = () => {}, highlightId = '' }) {
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef(null)
  const items = visibleRequests
    .filter(item => item.status === 'Selesai' || item.status === 'Ditolak')
    .toSorted((a, b) => {
      const toValue = ({ date, time }) => new Date(`${date}T${time || '00:00'}`).getTime()
      return toValue(b) - toValue(a)
    })
  const completed = items.filter(item => item.status === 'Selesai').length
  const exportTitle = (title || 'Riwayat Kunjungan').replace(/\s*\(.*\)$/, '').trim()
  const paging = useTablePaging(items, {
    resetKey: `${query}|${filter}`,
    highlightId,
  })

  useEffect(() => {
    if (!exportOpen) return undefined
    const closeOnOutside = event => {
      if (exportRef.current && !exportRef.current.contains(event.target)) setExportOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [exportOpen])

  function handleExport(format) {
    setExportOpen(false)
    if (!items.length) {
      onNotice('Tidak ada data riwayat untuk diekspor.')
      return
    }
    try {
      if (format === 'web') openWebView(items, exportTitle)
      else if (format === 'csv') downloadCsv(items, exportTitle)
      else downloadXlsx(items, exportTitle)
    } catch (err) {
      onNotice(err.message || 'Gagal mengekspor riwayat.')
    }
  }

  return <>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title || 'Riwayat Kunjungan'}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle || 'Arsip kunjungan yang sudah ditandai selesai, beserta permintaan yang ditolak.'}</p>
      </div>
      <div className="no-print flex flex-wrap items-center gap-2">
        {canPrint && (
          <div className="relative" ref={exportRef}>
            <button type="button" onClick={() => setExportOpen(open => !open)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              <Download size={15} /> Ekspor & Cetak <ChevronDown size={14} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <button type="button" onClick={() => handleExport('web')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                  <Eye size={15} className="text-indigo-500" /> Lihat Web (cetak / PDF)
                </button>
                <button type="button" onClick={() => handleExport('xlsx')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                  <FileSpreadsheet size={15} className="text-emerald-600" /> Excel (.xlsx)
                </button>
                <button type="button" onClick={() => handleExport('csv')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                  <FileText size={15} className="text-sky-600" /> CSV (.csv)
                </button>
              </div>
            )}
          </div>
        )}
        {canEdit && (
          <button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-600">
            <UserPlus size={15} /> Tambah Riwayat
          </button>
        )}
      </div>
    </div>
    <div className="print-only mb-4 border-b border-slate-300 pb-3">
      <h1 className="text-xl font-bold text-slate-900">PeTa SKANIDA — {title || 'Riwayat Kunjungan'}</h1>
      <p className="mt-1 text-xs text-slate-600">Dicetak pada {new Date().toLocaleString('id-ID')} · {items.length} data</p>
    </div>
    <div className="no-print mb-5">
      <SearchFilter query={query} onQueryChange={onQueryChange} filter={filter} onFilterChange={onFilterChange} statusOptions={['Semua', 'Selesai', 'Ditolak']} />
    </div>
    <Panel title="Riwayat request" subtitle={`${items.length} data · ${completed} kunjungan selesai · ${items.length - completed} ditolak`}>
      <RequestTable
        items={paging.pageItems}
        showCrud={canEdit}
        onEdit={canEdit ? item => setEditing(item) : undefined}
        onDelete={canEdit ? item => setDeleting(item) : undefined}
        highlightId={highlightId}
      />
      <TablePaging paging={paging} />
    </Panel>

    {editing && (
      <FormModal
        title={editing === 'new' ? 'Tambah Riwayat' : 'Edit Riwayat'}
        subtitle={editing === 'new' ? 'Tambahkan arsip kunjungan baru.' : `Ubah data ${editing.name}.`}
        fields={RECORD_FIELDS}
        initial={editing === 'new'
          ? { tanggal: new Date().toISOString().split('T')[0], jumlah: 1 }
          : {
              nama: editing.name,
              email: editing.email,
              no_hp: editing.phone,
              tujuan: editing.tujuan,
              keperluan: editing.keperluan,
              tanggal: editing.date,
              waktu: editing.time,
              jumlah: editing.people,
            }}
        onSave={async values => {
          if (editing === 'new') await onCreate(values)
          else await onUpdate(editing.dbId, values)
          setEditing(null)
        }}
        onClose={() => setEditing(null)}
      />
    )}

    {deleting && (
      <ConfirmModal
        title="Hapus riwayat?"
        message={`Riwayat ${deleting.name} (${deleting.id}) akan dihapus permanen.`}
        onConfirm={async () => { await onDelete(deleting.dbId); setDeleting(null) }}
        onClose={() => setDeleting(null)}
      />
    )}
  </>
}

// Petugas: daftar tamu yang akan datang (Pending / Diterima, tanggal >= hari ini).

export { HistoryPage }
