import { useState } from 'react'
import { Users, ClipboardList, UserPlus } from 'lucide-react'
import { useTablePaging, TablePaging } from '../lib/pagination'
import { RECORD_FIELDS, GUEST_CREATE_FIELDS } from '../lib/appConstants'
import { Panel, FormModal, ConfirmModal, RequestTable, SearchFilter } from '../components/ui'

function ListingPage({ type, title, subtitle, canCrud = true, canCreate = canCrud, visibleRequests, query, onQueryChange, filter, onFilterChange, contactFilter, onContactFilterChange, onUpdateStatus, onToggleContacted, onComplete, sortOrder, onSortOrderChange, onCreate, onUpdate, onDelete, highlightId = '' }) {
  const isPending = type === 'request'
  const [tamuView, setTamuView] = useState('semua')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Kelola Tamu hanya menampilkan tamu yang belum selesai.
  // Tamu berstatus "Selesai" sudah pindah ke Riwayat Kunjungan.
  const managed = visibleRequests.filter(item => item.status === 'Diterima' || item.status === 'Ditolak')
  const recent = managed.filter(item => item.status === 'Diterima')
  const view = isPending ? 'request' : (filter === 'Ditolak' ? 'semua' : tamuView)
  const byStatus = isPending
    ? visibleRequests.filter(item => item.status === 'Pending')
    : view === 'terkini' ? recent : managed
  const filtered = isPending
    ? byStatus
    : byStatus.filter(item => view !== 'semua' || contactFilter === 'Semua' || (contactFilter === 'Sudah' ? item.contacted : !item.contacted))
  const items = sortOrder === undefined
    ? filtered
    : filtered.toSorted((a, b) => {
        const toValue = item => new Date(`${item.date || ''}T${item.time || '00:00'}`).getTime() || 0
        const diff = toValue(a) - toValue(b)
        return sortOrder === 'Terlama' ? diff : -diff
      })
  const contactedCount = byStatus.filter(item => item.contacted).length
  const paging = useTablePaging(items, {
    resetKey: `${type}|${query}|${filter}|${contactFilter}|${tamuView}|${sortOrder}`,
    highlightId,
  })

  function selectView(next) {
    setTamuView(next)
    if (next === 'terkini' && filter === 'Ditolak') onFilterChange('Semua')
  }

  return <>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title || (isPending ? 'Daftar Request' : 'Kelola Tamu')}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle || (isPending ? 'Periksa permintaan dan tentukan persetujuan kunjungan.' : 'Daftar tamu yang telah disetujui atau ditolak. Klik Selesai untuk memindahkan tamu ke Riwayat Kunjungan.')}</p>
      </div>
      {!isPending && canCreate && (
        <button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-600">
          <UserPlus size={15} /> Tambah Tamu
        </button>
      )}
    </div>

    {!isPending && (
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => selectView('semua')}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            view === 'semua'
              ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-950/40'
              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300'
          }`}
        >
          <ClipboardList size={16} /> Semua Tamu
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${view === 'semua' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{managed.length}</span>
        </button>
        <button
          type="button"
          onClick={() => selectView('terkini')}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            view === 'terkini'
              ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-950/40'
              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300'
          }`}
        >
          <Users size={16} /> Kunjungan Terkini
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${view === 'terkini' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{recent.length}</span>
        </button>
      </div>
    )}

    <div className="mb-5">
      <SearchFilter
        query={query}
        onQueryChange={onQueryChange}
        filter={filter}
        onFilterChange={onFilterChange}
        showContactFilter={!isPending && view === 'semua'}
        contactFilter={contactFilter}
        onContactFilterChange={onContactFilterChange}
        statusOptions={isPending ? ['Semua', 'Pending', 'Diterima', 'Ditolak'] : ['Semua', 'Diterima', 'Ditolak']}
        sortOrder={isPending ? sortOrder : undefined}
        onSortOrderChange={onSortOrderChange}
      />
    </div>
    <Panel
      title={isPending ? 'Permintaan menunggu persetujuan' : view === 'terkini' ? 'Kunjungan terkini' : 'Daftar tamu terkelola'}
      subtitle={isPending
        ? `${items.length} data ditemukan`
        : view === 'terkini'
          ? `${items.length} tamu aktif · klik Selesai untuk memindahkan ke Riwayat Kunjungan`
          : `${items.length} data · ${contactedCount} sudah dihubungi · ${byStatus.length - contactedCount} belum dihubungi`}
    >
      <RequestTable
        items={paging.pageItems}
        showActions={isPending}
        showContact={!isPending && view === 'semua'}
        onUpdateStatus={onUpdateStatus}
        onToggleContacted={onToggleContacted}
        onComplete={!isPending ? onComplete : undefined}
        showCrud={!isPending && canCrud}
        onEdit={canCrud ? item => setEditing(item) : undefined}
        onDelete={canCrud ? item => setDeleting(item) : undefined}
        highlightId={highlightId}
      />
      <TablePaging paging={paging} />
    </Panel>

    {editing && (
      <FormModal
        title={editing === 'new' ? 'Tambah Tamu' : 'Edit Tamu'}
        subtitle={editing === 'new' ? 'Tambahkan tamu baru ke dalam sistem.' : `Ubah data ${editing.name}.`}
        fields={editing === 'new' ? GUEST_CREATE_FIELDS : RECORD_FIELDS}
        initial={editing === 'new'
          ? { tanggal: new Date().toISOString().split('T')[0], jumlah: 1, status: 'Diterima' }
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
        title="Hapus tamu?"
        message={`Data ${deleting.name} (${deleting.id}) akan dihapus beserta catatan kunjungannya.`}
        onConfirm={async () => { await onDelete(deleting.dbId); setDeleting(null) }}
        onClose={() => setDeleting(null)}
      />
    )}
  </>
}

export { ListingPage }
