import { CheckCircle2, MessageCircle, CircleDashed, BadgeCheck, Mail, Pencil, Trash2, FileText } from 'lucide-react'
import { formatDate } from '../lib/appConstants'
import { Status } from './Status'
import { ContactBadge } from './ContactBadge'

function RequestTable({ items, showActions = false, showContact = false, onUpdateStatus, onToggleContacted, onComplete, showCrud = false, onEdit, onDelete, highlightId = '' }) {
  if (!items.length) {
    return <div className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">Tidak ada data yang cocok.</div>
  }
  const hasActions = showActions || Boolean(onComplete) || showCrud
  const waLink = phone => `https://wa.me/${phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm sm:min-w-[900px] lg:min-w-[1140px]">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-800/60 dark:text-slate-400">
          <tr>
            <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold">Pengunjung</th>
            <th className="hidden px-3 py-3 sm:px-6 sm:py-4 font-semibold md:table-cell">Email</th>
            <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold">Tujuan</th>
            <th className="hidden px-3 py-3 sm:px-6 sm:py-4 font-semibold lg:table-cell">Keperluan</th>
            <th className="hidden px-3 py-3 sm:px-6 sm:py-4 font-semibold xl:table-cell">Surat Tugas</th>
            <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold">Jadwal</th>
            <th className="hidden px-3 py-3 sm:px-6 sm:py-4 font-semibold sm:table-cell">Jumlah</th>
            <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold">Status</th>
            {hasActions && <th className="px-3 py-3 sm:px-6 sm:py-4 text-right font-semibold">Aksi</th>}
            {showContact && <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold">Kontak</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map(item => (
            <tr
              id={`request-row-${item.id}`}
              key={item.id}
              className={`transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${highlightId === item.id ? 'row-highlight' : ''}`}
            >
              <td className="px-3 py-3 sm:px-6 sm:py-4">
                <div className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</div>
                <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{item.id} · {item.phone}</div>
              </td>
              <td className="hidden px-3 py-3 sm:px-6 sm:py-4 md:table-cell">
                {item.email ? (
                  <a
                    href={`mailto:${item.email}`}
                    title={item.email}
                    className="inline-flex max-w-[220px] items-center gap-1.5 text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
                  >
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">{item.email}</span>
                  </a>
                ) : <span className="text-slate-400 dark:text-slate-500">-</span>}
              </td>
              <td className="px-3 py-3 sm:px-6 sm:py-4 text-slate-600 dark:text-slate-300">{item.tujuan}</td>
              <td className="hidden px-3 py-3 sm:px-6 sm:py-4 text-slate-600 dark:text-slate-300 lg:table-cell">{item.keperluan}</td>
              <td className="hidden px-3 py-3 sm:px-6 sm:py-4 xl:table-cell">
                {item.suratTugasUrl ? (
                  <a href={item.suratTugasUrl} target="_blank" rel="noreferrer" title={item.suratTugasNama || 'Buka surat tugas'} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20">
                    <FileText size={13} /> Lihat
                  </a>
                ) : <span className="text-xs text-slate-400 dark:text-slate-500">-</span>}
              </td>
              <td className="px-3 py-3 sm:px-6 sm:py-4">
                <div className="font-medium text-slate-700 dark:text-slate-300">{formatDate(item.date)}</div>
                <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{item.time ? `${item.time} WIB` : '-'}</div>
              </td>
              <td className="hidden px-3 py-3 sm:px-6 sm:py-4 text-slate-600 dark:text-slate-300 sm:table-cell">{item.people} orang</td>
              <td className="px-3 py-3 sm:px-6 sm:py-4"><Status value={item.status} /></td>
              {hasActions && <td className="px-3 py-3 sm:px-6 sm:py-4">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {item.status === 'Pending' && showActions && (
                    <>
                      <button type="button" onClick={() => onUpdateStatus(item.id, 'Diterima')} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20">Terima</button>
                      <button type="button" onClick={() => onUpdateStatus(item.id, 'Ditolak')} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20">Tolak</button>
                    </>
                  )}
                  {item.status === 'Diterima' && onComplete && (
                    <button
                      type="button"
                      onClick={() => onComplete(item.id)}
                      title="Tandai kunjungan selesai dan pindahkan ke Riwayat Kunjungan"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
                    >
                      <CheckCircle2 size={14} /> Selesai
                    </button>
                  )}
                  {showCrud && (
                    <>
                      {onEdit && (
                        <button type="button" onClick={() => onEdit(item)} title="Edit data" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"><Pencil size={13} /> Edit</button>
                      )}
                      {onDelete && (
                        <button type="button" onClick={() => onDelete(item)} title="Hapus data" className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"><Trash2 size={13} /> Hapus</button>
                      )}
                    </>
                  )}
                  {!showActions && (!onComplete || item.status !== 'Diterima') && !showCrud && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">{item.status === 'Selesai' ? 'Di riwayat' : 'Sudah diproses'}</span>
                  )}
                </div>
              </td>}
              {showContact && <td className="px-3 py-3 sm:px-6 sm:py-4">
                <div className="flex flex-col items-start gap-2">
                  <ContactBadge contacted={item.contacted} />
                  {item.contacted && item.contactedAt && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {new Date(item.contactedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={waLink(item.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20">
                      <MessageCircle size={14} /> Hubungi
                    </a>
                    {onToggleContacted && (
                      <button
                        type="button"
                        onClick={() => onToggleContacted(item.id, !item.contacted)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          item.contacted
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20'
                        }`}
                      >
                        {item.contacted ? <CircleDashed size={14} /> : <BadgeCheck size={14} />}
                        {item.contacted ? 'Tandai belum' : 'Tandai sudah'}
                      </button>
                    )}
                  </div>
                </div>
              </td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { RequestTable }
