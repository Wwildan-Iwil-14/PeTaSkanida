import { useEffect, useState } from 'react'

/** Jumlah baris yang bisa dipilih pengguna. 0 = tampilkan semua. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 0]

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter(page => page >= 1 && page <= total).sort((a, b) => a - b)
  const result = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push(`gap-${page}`)
    result.push(page)
  })
  return result
}

/**
 * State pagination untuk sebuah daftar.
 * resetKey sebaiknya berisi query/filter agar halaman kembali ke 1 saat filter berubah.
 */
export function useTablePaging(items, { defaultSize = 10, resetKey = '', highlightId = '' } = {}) {
  const [perPage, setPerPage] = useState(defaultSize)
  const [page, setPage] = useState(1)
  const total = items.length
  const totalPages = perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1

  useEffect(() => {
    setPage(1)
  }, [resetKey, perPage])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // Bila notifikasi menyorot baris di halaman lain, buka halamannya.
  useEffect(() => {
    if (!highlightId || perPage <= 0) return
    const index = items.findIndex(item => item.id === highlightId)
    if (index >= 0) setPage(Math.floor(index / perPage) + 1)
  }, [highlightId, perPage])

  const pageItems = perPage > 0 ? items.slice((page - 1) * perPage, page * perPage) : items
  return { page, setPage, perPage, setPerPage, total, totalPages, pageItems }
}

/** Kontrol pagination: info data, pilihan jumlah baris, dan tombol pindah halaman. */
export function TablePaging({ paging }) {
  const { page, setPage, perPage, setPerPage, total, totalPages } = paging
  if (!total) return null
  const start = perPage > 0 ? (page - 1) * perPage + 1 : 1
  const end = perPage > 0 ? Math.min(page * perPage, total) : total
  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-3 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-6">
      <p>
        Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-200">{start}–{end}</span> dari{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{total}</span> data
      </p>
      <label className="flex items-center gap-2">
        Tampilkan
        <select
          value={perPage}
          onChange={event => setPerPage(Number(event.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size === 0 ? 'Semua' : size}</option>
          ))}
        </select>
      </label>
      {perPage > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden font-semibold sm:inline">Halaman {page} dari {totalPages}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage(1)} disabled={page === 1} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Halaman pertama">«</button>
            <button type="button" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page === 1} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800">
              <span aria-hidden="true">‹</span> Sebelumnya
            </button>
            {pageNumbers(page, totalPages).map(item => typeof item === 'number' ? (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                className={`min-w-[32px] rounded-lg px-2 py-1.5 font-semibold transition ${item === page ? 'bg-indigo-500 text-white' : 'border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}
              >
                {item}
              </button>
            ) : <span key={item} className="px-1 text-slate-400">…</span>)}
            <button type="button" onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800">
              Selanjutnya <span aria-hidden="true">›</span>
            </button>
            <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Halaman terakhir">»</button>
          </div>
        </div>
      )}
    </div>
  )
}
