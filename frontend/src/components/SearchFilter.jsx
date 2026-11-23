import { useEffect, useRef, useState } from 'react'
import { Search, CalendarDays, Filter, MessageCircle } from 'lucide-react'

function SearchFilter({ query, onQueryChange, filter, onFilterChange, contactFilter, onContactFilterChange, showContactFilter = false, statusOptions = ['Semua', 'Pending', 'Diterima', 'Ditolak'], sortOrder, onSortOrderChange }) {
  // Ketikan di-debounce supaya tabel besar tidak difilter ulang tiap karakter.
  const [text, setText] = useState(query)
  const timerRef = useRef(null)

  useEffect(() => {
    window.clearTimeout(timerRef.current)
    setText(query)
  }, [query])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  function handleSearch(event) {
    const value = event.target.value
    setText(value)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => onQueryChange(value), 150)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input
          type="search"
          value={text}
          onChange={handleSearch}
          placeholder="Cari nama atau ID request..."
          aria-label="Cari nama atau ID request"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
        />
      </div>
      {showContactFilter && (
        <div className="relative">
          <MessageCircle className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={contactFilter}
            onChange={e => onContactFilterChange(e.target.value)}
            aria-label="Filter status kontak"
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm text-slate-600 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:focus:border-indigo-500 sm:w-48"
          >
            <option value="Semua">Semua kontak</option><option value="Sudah">Sudah dihubungi</option><option value="Belum">Belum dihubungi</option>
          </select>
        </div>
      )}
      <div className="relative">
        <Filter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <select
          value={filter}
          onChange={e => onFilterChange(e.target.value)}
          aria-label="Filter status"
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm text-slate-600 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:focus:border-indigo-500 sm:w-44"
        >
          {statusOptions.map(option => <option key={option}>{option}</option>)}
        </select>
      </div>
      {sortOrder !== undefined && (
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={sortOrder}
            onChange={e => onSortOrderChange(e.target.value)}
            aria-label="Urutkan berdasarkan tanggal request"
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm text-slate-600 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:focus:border-indigo-500 sm:w-52"
          >
            <option value="Terkini">Tanggal Terkini</option>
            <option value="Terlama">Tanggal Terlama</option>
          </select>
        </div>
      )}
    </div>
  )
}

export { SearchFilter }
