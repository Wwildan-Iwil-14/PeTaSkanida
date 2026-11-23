import { useTablePaging, TablePaging } from '../lib/pagination'
import { getTodayISO } from '../lib/appConstants'
import { Panel, RequestTable, SearchFilter } from '../components/ui'

function UpcomingVisitsPage({ visibleRequests, query, onQueryChange, filter, onFilterChange }) {
  const today = getTodayISO()
  const items = visibleRequests
    .filter(item => (item.status === 'Pending' || item.status === 'Diterima') && item.date >= today)
    .toSorted((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`))
  const pending = items.filter(item => item.status === 'Pending').length
  const paging = useTablePaging(items, { resetKey: `${query}|${filter}` })
  return <>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kunjungan Mendatang</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Jadwal tamu yang akan datang. Data bersifat baca-saja untuk petugas.</p>
    </div>
    <div className="mb-5">
      <SearchFilter query={query} onQueryChange={onQueryChange} filter={filter} onFilterChange={onFilterChange} statusOptions={['Semua', 'Pending', 'Diterima']} />
    </div>
    <Panel title="Jadwal kunjungan" subtitle={`${items.length} tamu · ${pending} menunggu persetujuan`}>
      <RequestTable items={paging.pageItems} showContact />
      <TablePaging paging={paging} />
    </Panel>
  </>
}

// Super admin: tamu yang sedang berkunjung (status Diterima), baca-saja.
function CurrentVisitsPage({ visibleRequests, query, onQueryChange, filter, onFilterChange }) {
  const items = visibleRequests
    .filter(item => item.status === 'Diterima')
    .toSorted((a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`))
  const paging = useTablePaging(items, { resetKey: `${query}|${filter}` })
  return <>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kunjungan Terkini</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tamu yang sudah disetujui dan sedang / akan berkunjung.</p>
    </div>
    <div className="mb-5">
      <SearchFilter query={query} onQueryChange={onQueryChange} filter={filter} onFilterChange={onFilterChange} statusOptions={['Semua', 'Diterima']} />
    </div>
    <Panel title="Kunjungan aktif" subtitle={`${items.length} tamu sedang berkunjung`}>
      <RequestTable items={paging.pageItems} showContact />
      <TablePaging paging={paging} />
    </Panel>
  </>
}

// Semua akun: detail akun yang sedang aktif.

export { UpcomingVisitsPage, CurrentVisitsPage }
